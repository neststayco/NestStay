import express from "express";
import {
  registerInitiate,
  registerVerify,
  registerOwnerInitiate,
  registerOwnerVerify,
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

// Registration
router.post("/register/initiate", registerInitiate);
router.post("/register/verify", registerVerify);
router.post("/register-owner/initiate", registerOwnerInitiate);
router.post("/register-owner/verify", registerOwnerVerify);

// Session
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh", refreshTokens);

// Forgot password
router.post("/forgot-password/initiate", forgotPasswordInitiate);
router.post("/forgot-password/verify", forgotPasswordVerify);
router.post("/reset-password", resetPassword);

// Profile
router.get("/me", protect, getMe);

export default router;
