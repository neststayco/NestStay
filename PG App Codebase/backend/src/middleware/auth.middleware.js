import jwt from "jsonwebtoken";
import User from "../models/user.js";
import Logger from "../services/logger.service.js";

const SENSITIVE_FIELDS = "-password -refreshToken";

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

      // Reject refresh/reset tokens used as access tokens
      if (decoded.type !== "access") {
        return res.status(401).json({
          success: false,
          message: "Not authorized. Invalid token type.",
        });
      }

      const user = await User.findById(decoded.id).select(SENSITIVE_FIELDS);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Not authorized. User not found.",
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: "Account deactivated.",
        });
      }

      req.user = user;
      return next();
    } catch (error) {
      Logger.error("AUTH_ERROR", { message: error.message });
      return res.status(401).json({
        success: false,
        message: "Not authorized. Token failed.",
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized. No token.",
    });
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
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

      if (decoded.type === "access") {
        const user = await User.findById(decoded.id).select(SENSITIVE_FIELDS);
        if (user && user.isActive) {
          req.user = user;
        }
      }
    } catch {
      Logger.warn("OPTIONAL_AUTH_SKIPPED", { reason: "Token invalid or expired" });
    }
  }
  next();
};
