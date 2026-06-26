import jwt from "jsonwebtoken";
import crypto from "crypto";

// jti (JWT ID) ensures each token is unique even when generated in the same second
const jti = () => crypto.randomBytes(16).toString("hex");

export const generateAccessToken = (id, role) => {
  return jwt.sign(
    { id, role, type: "access", jti: jti() },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" }
  );
};

export const generateRefreshToken = (id) => {
  return jwt.sign(
    { id, type: "refresh", jti: jti() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );
};

// Short-lived token for password reset only — verified by type + purpose
export const generateResetToken = (id) => {
  return jwt.sign(
    { id, type: "reset", purpose: "PASSWORD_RESET", jti: jti() },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" }
  );
};

// SHA-256 hash for storing refresh tokens in DB — never store raw JWT
export const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const isProd = () => process.env.NODE_ENV === "production";

export const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: isProd(),
  // SameSite=None required for cross-origin deployments (neststay.co → onrender.com).
  // SameSite=None mandates Secure=true, which is already set above in production.
  sameSite: isProd() ? "none" : "strict",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

export const getClearCookieOptions = () => ({
  httpOnly: true,
  secure: isProd(),
  sameSite: isProd() ? "none" : "strict",
  path: "/",
});
