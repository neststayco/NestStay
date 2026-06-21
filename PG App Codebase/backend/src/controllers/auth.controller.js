import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/user.js";
import OTP from "../models/OTP.js";
import {
  generateAccessToken,
  generateRefreshToken,
  generateResetToken,
  hashToken,
  getRefreshCookieOptions,
} from "../utils/tokenUtils.js";
import { runInTransaction } from "../utils/transaction.js";
import { generateOTP, hashOTP, verifyOTP } from "../utils/otpUtils.js";
import NotificationService from "../services/notification.service.js";
import Logger from "../services/logger.service.js";

const OTP_EXPIRY_MS = 10 * 60 * 1000;       // 10 minutes
const OTP_RESEND_COOLDOWN_MS = process.env.NODE_ENV === "production" ? 60 * 1000 : 10 * 1000;
const MAX_OTP_ATTEMPTS = 5;

// Used in login timing-attack prevention — compare cost is same as real hash
const DUMMY_HASH = "$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW";

// Rejects after mongo-sanitize strips $ keys, leaving {} instead of string
const isString = (v) => typeof v === "string" && v.length > 0;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isValidEmail = (v) => isString(v) && EMAIL_RE.test(v.toLowerCase().trim());

const serializeAuthUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  pgId: user.pgId || null,
  onboardingStatus: user.onboardingStatus === "not_started" ? "legacy" : (user.onboardingStatus || "legacy"),
});

const isDuplicateKeyError = (error) => error?.code === 11000 || error?.code === 11001;

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRATION — 2-step OTP flow
// ─────────────────────────────────────────────────────────────────────────────

export const registerInitiate = async (req, res) => {
  try {
    const { email } = req.body;

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: "Valid email address is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await User.findOne({ email: normalizedEmail }).lean();
    if (existing) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    // Enforce resend cooldown
    const recent = await OTP.findOne({
      email: normalizedEmail,
      type: "REGISTER",
      createdAt: { $gte: new Date(Date.now() - OTP_RESEND_COOLDOWN_MS) },
    }).lean();

    if (recent) {
      return res.status(429).json({
        success: false,
        message: "Please wait 60 seconds before requesting a new OTP",
      });
    }

    const otp = generateOTP();
    const hashedOtp = await hashOTP(otp);

    await OTP.findOneAndUpdate(
      { email: normalizedEmail, type: "REGISTER" },
      { 
        $set: { 
          hashedOtp, 
          attempts: 0, 
          expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
          createdAt: new Date()
        } 
      },
      { upsert: true, new: true }
    );

    await NotificationService.sendOTPEmail(normalizedEmail, otp, "REGISTER");

    Logger.event("register.otp.sent", { email: normalizedEmail });

    return res.status(200).json({
      success: true,
      message: "OTP sent to your email address. Valid for 10 minutes.",
    });
  } catch (error) {
    Logger.error("REGISTER_INITIATE_ERROR", { error: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const registerVerify = async (req, res) => {
  try {
    const { email, otp, name, password } = req.body;

    if (!isString(email) || !isString(otp) || !isString(name) || !isString(password)) {
      return res.status(400).json({
        success: false,
        message: "email, otp, name, and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const otpDoc = await OTP.findOne({ email: normalizedEmail, type: "REGISTER" });

    if (!otpDoc) {
      return res.status(400).json({
        success: false,
        message: "No active OTP found. Please request a new one.",
      });
    }

    if (otpDoc.expiresAt < new Date()) {
      await otpDoc.deleteOne();
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please request a new one.",
      });
    }

    if (otpDoc.attempts >= MAX_OTP_ATTEMPTS) {
      await otpDoc.deleteOne();
      return res.status(429).json({
        success: false,
        message: "Too many failed attempts. Please request a new OTP.",
      });
    }

    const isValid = await verifyOTP(otp, otpDoc.hashedOtp);

    if (!isValid) {
      // Atomic increment — prevents TOCTOU race on concurrent wrong-OTP requests
      const updated = await OTP.findOneAndUpdate(
        { _id: otpDoc._id, attempts: { $lt: MAX_OTP_ATTEMPTS } },
        { $inc: { attempts: 1 } },
        { new: true }
      );
      const attemptsUsed = updated ? updated.attempts : MAX_OTP_ATTEMPTS;
      const remaining = Math.max(0, MAX_OTP_ATTEMPTS - attemptsUsed);
      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${remaining} attempt(s) remaining.`,
      });
    }

    // Race condition guard — check email not registered since initiate
    const existing = await User.findOne({ email: normalizedEmail }).lean();
    if (existing) {
      await otpDoc.deleteOne();
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const user = await runInTransaction(async (session) => {
      const [createdUser] = await User.create([{
        name: name.trim(),
        email: normalizedEmail,
        password,
        role: "user",
        isVerified: true,
        isActive: true,
      }], { session });

      await otpDoc.deleteOne({ session });

      const refreshToken = generateRefreshToken(createdUser._id);
      await User.findByIdAndUpdate(createdUser._id, { refreshToken: hashToken(refreshToken) }, { session });

      return { user: createdUser, refreshToken };
    });

    Logger.event("user.registered", { userId: user.user._id });

    res.cookie("refreshToken", user.refreshToken, getRefreshCookieOptions());

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      data: serializeAuthUser(user.user),
      accessToken: generateAccessToken(user.user._id, user.user.role),
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }
    Logger.error("REGISTER_VERIFY_ERROR", { error: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────────────────────

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!isString(email) || !isString(password)) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });

    // Timing attack prevention: run bcrypt even when user not found
    if (!user) {
      await bcrypt.compare(password, DUMMY_HASH);
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account has been deactivated. Contact support.",
      });
    }

    if (user.isAccountLocked()) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(423).json({
        success: false,
        message: `Account locked. Try again in ${minutesLeft} minute(s).`,
      });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      await user.incrementLoginAttempts();
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // Only regular users require email verification (admin/pg_owner are provisioned by admin)
    if (!user.isVerified && user.role === "user") {
      return res.status(403).json({
        success: false,
        message: "Email not verified. Please complete registration.",
      });
    }

    // Reset lockout on successful login
    await user.updateOne({ $set: { loginAttempts: 0 }, $unset: { lockUntil: 1 } });

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    await User.findByIdAndUpdate(user._id, { refreshToken: hashToken(refreshToken) });

    Logger.event("user.login", { userId: user._id, role: user.role });

    res.cookie("refreshToken", refreshToken, getRefreshCookieOptions());

    return res.status(200).json({
      success: true,
      data: serializeAuthUser(user),
      accessToken,
    });
  } catch (error) {
    Logger.error("LOGIN_ERROR", { error: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────────────────────────────────────

export const logout = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;

    if (token) {
      await User.findOneAndUpdate(
        { refreshToken: hashToken(token) },
        { refreshToken: null }
      );
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    return res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    Logger.error("LOGOUT_ERROR", { error: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// REFRESH TOKEN — with rotation
// ─────────────────────────────────────────────────────────────────────────────

export const refreshTokens = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json({ success: false, message: "No refresh token provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
    }

    if (decoded.type !== "refresh") {
      return res.status(401).json({ success: false, message: "Invalid token type" });
    }

    const user = await User.findOne({
      _id: decoded.id,
      refreshToken: hashToken(token),
    });

    if (!user) {
      // Possible token reuse — invalidate any stored token for this user
      await User.findByIdAndUpdate(decoded.id, { refreshToken: null });
      return res.status(401).json({
        success: false,
        message: "Refresh token invalid or reuse detected. Please log in again.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Account deactivated" });
    }

    // Rotate — generate fresh pair
    const newAccessToken = generateAccessToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id);

    await User.findByIdAndUpdate(user._id, { refreshToken: hashToken(newRefreshToken) });

    Logger.event("token.refreshed", { userId: user._id });

    res.cookie("refreshToken", newRefreshToken, getRefreshCookieOptions());

    return res.status(200).json({
      success: true,
      accessToken: newAccessToken,
      data: serializeAuthUser(user),
    });
  } catch (error) {
    Logger.error("REFRESH_ERROR", { error: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// FORGOT PASSWORD — OTP-based, 3-step
// ─────────────────────────────────────────────────────────────────────────────

// Same response regardless of email existence — prevents enumeration
const FP_SUCCESS = {
  success: true,
  message: "If that email is registered, an OTP has been sent.",
};

export const forgotPasswordInitiate = async (req, res) => {
  try {
    const { email } = req.body;

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: "Valid email address is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).lean();

    // Return same response regardless of whether user exists
    if (!user || !user.isActive) {
      return res.status(200).json(FP_SUCCESS);
    }

    // Enforce cooldown silently
    const recent = await OTP.findOne({
      email: normalizedEmail,
      type: "FORGOT_PASSWORD",
      createdAt: { $gte: new Date(Date.now() - OTP_RESEND_COOLDOWN_MS) },
    }).lean();

    if (recent) {
      return res.status(200).json(FP_SUCCESS);
    }

    const otp = generateOTP();
    const hashedOtp = await hashOTP(otp);

    await OTP.findOneAndUpdate(
      { email: normalizedEmail, type: "FORGOT_PASSWORD" },
      { 
        $set: { 
          hashedOtp, 
          attempts: 0, 
          expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
          createdAt: new Date()
        } 
      },
      { upsert: true, new: true }
    );

    await NotificationService.sendOTPEmail(normalizedEmail, otp, "FORGOT_PASSWORD");

    Logger.event("forgot.password.otp.sent", { email: normalizedEmail });

    return res.status(200).json(FP_SUCCESS);
  } catch (error) {
    Logger.error("FORGOT_PASSWORD_INITIATE_ERROR", { error: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const forgotPasswordVerify = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!isString(email) || !isString(otp)) {
      return res.status(400).json({ success: false, message: "Email and OTP are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const otpDoc = await OTP.findOne({ email: normalizedEmail, type: "FORGOT_PASSWORD" });

    if (!otpDoc) {
      return res.status(400).json({
        success: false,
        message: "No active OTP found. Please request a new one.",
      });
    }

    if (otpDoc.expiresAt < new Date()) {
      await otpDoc.deleteOne();
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please request a new one.",
      });
    }

    if (otpDoc.attempts >= MAX_OTP_ATTEMPTS) {
      await otpDoc.deleteOne();
      return res.status(429).json({
        success: false,
        message: "Too many failed attempts. Please request a new OTP.",
      });
    }

    const isValid = await verifyOTP(otp, otpDoc.hashedOtp);

    if (!isValid) {
      const updated = await OTP.findOneAndUpdate(
        { _id: otpDoc._id, attempts: { $lt: MAX_OTP_ATTEMPTS } },
        { $inc: { attempts: 1 } },
        { new: true }
      );
      const attemptsUsed = updated ? updated.attempts : MAX_OTP_ATTEMPTS;
      const remaining = Math.max(0, MAX_OTP_ATTEMPTS - attemptsUsed);
      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${remaining} attempt(s) remaining.`,
      });
    }

    const user = await User.findOne({ email: normalizedEmail }).lean();
    if (!user) {
      await otpDoc.deleteOne();
      return res.status(400).json({ success: false, message: "User not found" });
    }

    await otpDoc.deleteOne();

    // Short-lived reset token — frontend must use within 15 minutes
    const resetToken = generateResetToken(user._id);

    Logger.event("forgot.password.otp.verified", { userId: user._id });

    return res.status(200).json({
      success: true,
      message: "OTP verified. Use the reset token to set a new password.",
      resetToken,
    });
  } catch (error) {
    Logger.error("FORGOT_PASSWORD_VERIFY_ERROR", { error: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!isString(resetToken) || !isString(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "Reset token and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_ACCESS_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: "Invalid or expired reset token" });
    }

    if (decoded.type !== "reset" || decoded.purpose !== "PASSWORD_RESET") {
      return res.status(401).json({ success: false, message: "Invalid token type or purpose" });
    }

    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(404).json({ success: false, message: "User not found or account deactivated" });
    }

    // Update password (pre-save hook re-hashes), clear refresh token (force re-login), clear lockout
    user.password = newPassword;
    user.refreshToken = null;
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    Logger.event("user.password.reset", { userId: user._id });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "Password reset successful. Please log in with your new password.",
    });
  } catch (error) {
    Logger.error("RESET_PASSWORD_ERROR", { error: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ME
// ─────────────────────────────────────────────────────────────────────────────

export const getMe = async (req, res) => {
  return res.status(200).json({ success: true, data: serializeAuthUser(req.user) });
};

// ─────────────────────────────────────────────────────────────────────────────
// OWNER REGISTRATION — 2-step OTP flow
// ─────────────────────────────────────────────────────────────────────────────

export const registerOwnerInitiate = async (req, res) => {
  try {
    const { email } = req.body;

    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, message: "Valid email address is required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await User.findOne({ email: normalizedEmail }).lean();
    if (existing) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const recent = await OTP.findOne({
      email: normalizedEmail,
      type: "REGISTER_OWNER",
      createdAt: { $gte: new Date(Date.now() - OTP_RESEND_COOLDOWN_MS) },
    }).lean();

    if (recent) {
      return res.status(429).json({
        success: false,
        message: "Please wait before requesting a new OTP",
      });
    }

    const otp = generateOTP();
    const hashedOtp = await hashOTP(otp);

    await OTP.findOneAndUpdate(
      { email: normalizedEmail, type: "REGISTER_OWNER" },
      {
        $set: {
          hashedOtp,
          attempts: 0,
          expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
          createdAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    await NotificationService.sendOTPEmail(normalizedEmail, otp, "REGISTER_OWNER");

    Logger.event("register.owner.otp.sent", { email: normalizedEmail });

    return res.status(200).json({
      success: true,
      message: "OTP sent to your email address. Valid for 10 minutes.",
    });
  } catch (error) {
    Logger.error("REGISTER_OWNER_INITIATE_ERROR", { error: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const registerOwnerVerify = async (req, res) => {
  try {
    const { email, otp, name, password } = req.body;

    if (!isString(email) || !isString(otp) || !isString(name) || !isString(password)) {
      return res.status(400).json({
        success: false,
        message: "email, otp, name, and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const otpDoc = await OTP.findOne({ email: normalizedEmail, type: "REGISTER_OWNER" });

    if (!otpDoc) {
      return res.status(400).json({
        success: false,
        message: "No active OTP found. Please request a new one.",
      });
    }

    if (otpDoc.expiresAt < new Date()) {
      await otpDoc.deleteOne();
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please request a new one.",
      });
    }

    if (otpDoc.attempts >= MAX_OTP_ATTEMPTS) {
      await otpDoc.deleteOne();
      return res.status(429).json({
        success: false,
        message: "Too many failed attempts. Please request a new OTP.",
      });
    }

    const isValid = await verifyOTP(otp, otpDoc.hashedOtp);

    if (!isValid) {
      const updated = await OTP.findOneAndUpdate(
        { _id: otpDoc._id, attempts: { $lt: MAX_OTP_ATTEMPTS } },
        { $inc: { attempts: 1 } },
        { new: true }
      );
      const attemptsUsed = updated ? updated.attempts : MAX_OTP_ATTEMPTS;
      const remaining = Math.max(0, MAX_OTP_ATTEMPTS - attemptsUsed);
      return res.status(400).json({
        success: false,
        message: `Invalid OTP. ${remaining} attempt(s) remaining.`,
      });
    }

    const existing = await User.findOne({ email: normalizedEmail }).lean();
    if (existing) {
      await otpDoc.deleteOne();
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const user = await runInTransaction(async (session) => {
      const [createdUser] = await User.create([{
        name: name.trim(),
        email: normalizedEmail,
        password,
        role: "pg_owner",
        onboardingStatus: "profile_incomplete",
        pgId: null,
        isVerified: true,
        isActive: true,
      }], { session });

      await otpDoc.deleteOne({ session });

      const refreshToken = generateRefreshToken(createdUser._id);
      await User.findByIdAndUpdate(createdUser._id, { refreshToken: hashToken(refreshToken) }, { session });

      return { user: createdUser, refreshToken };
    });

    Logger.event("owner.registered", { userId: user.user._id });

    res.cookie("refreshToken", user.refreshToken, getRefreshCookieOptions());

    return res.status(201).json({
      success: true,
      message: "Owner account created. Please complete your PG listing.",
      data: serializeAuthUser(user.user),
      accessToken: generateAccessToken(user.user._id, user.user.role),
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }
    Logger.error("REGISTER_OWNER_VERIFY_ERROR", { error: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
