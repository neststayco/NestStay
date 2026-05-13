import jwt from "jsonwebtoken";
import User from "../models/user.js";
import Logger from "../services/logger.service.js";

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ success: false, message: "Not authorized. User not found." });
      }

      next();
    } catch (error) {
      Logger.error("AUTH_ERROR", { message: error.message });
      return res.status(401).json({ success: false, message: "Not authorized. Token failed." });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "Not authorized. No token." });
  }
};

export const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role '${req.user ? req.user.role : "none"}' is not authorized to access this route`,
      });
    }
    next();
  };
};

export const optionalAuth = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
    } catch {
      Logger.warn("OPTIONAL_AUTH_SKIPPED", { reason: "Token invalid or expired" });
    }
  }
  next();
};
