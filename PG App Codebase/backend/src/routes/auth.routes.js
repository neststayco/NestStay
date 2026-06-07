import express from "express";
import rateLimit from "express-rate-limit";
import {
  registerInitiate,
  registerVerify,
  login,
  logout,
  refreshTokens,
  forgotPasswordInitiate,
  forgotPasswordVerify,
  resetPassword,
  getMe,
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

const makeLimiter = (max, windowMs, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message },
  });

const registerInitiateLimiter = makeLimiter(
  5, 15 * 60 * 1000,
  "Too many registration attempts. Try again in 15 minutes."
);
const registerVerifyLimiter = makeLimiter(
  10, 15 * 60 * 1000,
  "Too many OTP verification attempts. Try again in 15 minutes."
);
const loginLimiter = makeLimiter(
  5, 15 * 60 * 1000,
  "Too many login attempts. Try again in 15 minutes."
);
const forgotInitiateLimiter = makeLimiter(
  3, 60 * 60 * 1000,
  "Too many password reset requests. Try again in 1 hour."
);
const forgotVerifyLimiter = makeLimiter(
  10, 15 * 60 * 1000,
  "Too many OTP verification attempts. Try again in 15 minutes."
);
const refreshLimiter = makeLimiter(
  20, 15 * 60 * 1000,
  "Too many refresh requests. Try again in 15 minutes."
);
const resetPasswordLimiter = makeLimiter(
  5, 15 * 60 * 1000,
  "Too many password reset attempts. Try again in 15 minutes."
);

// Registration
router.post("/register/initiate", registerInitiateLimiter, registerInitiate);
router.post("/register/verify", registerVerifyLimiter, registerVerify);

// Session
router.post("/login", loginLimiter, login);
router.post("/logout", logout);
router.post("/refresh", refreshLimiter, refreshTokens);

// Forgot password
router.post("/forgot-password/initiate", forgotInitiateLimiter, forgotPasswordInitiate);
router.post("/forgot-password/verify", forgotVerifyLimiter, forgotPasswordVerify);
router.post("/reset-password", resetPasswordLimiter, resetPassword);

// Profile
router.get("/me", protect, getMe);

export default router;
