import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import complaintRoutes from "./src/routes/complaint.routes.js";
import testimonialRoutes from "./src/routes/testimonial.routes.js";
import imagekitRoutes from "./src/routes/imagekit.routes.js";
import authRoutes from "./src/routes/auth.routes.js";
import pgRoutes from "./src/routes/pg.routes.js";
import pgResidencyRoutes from "./src/routes/pgResidency.routes.js";
import adminRoutes from "./src/routes/admin.routes.js";
import admissionRoutes from "./src/routes/admission.routes.js";
import userRoutes from "./src/routes/user.routes.js";
import requestLogger from "./src/middleware/requestLogger.middleware.js";
import Logger from "./src/services/logger.service.js";

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : [];

const app = express();

// Security headers (CSP, HSTS, X-Frame-Options, etc.)
app.use(helmet());

// CORS — credentials required for httpOnly refresh cookie
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman) or from allowed list
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
  })
);

// Cookie parser — must be before routes that read req.cookies
app.use(cookieParser());

// Limit request body to 10kb to prevent payload DoS
app.use(express.json({ limit: "10kb" }));

// Sanitize req.body — removes MongoDB operator keys ($ prefix).
// Note: using sanitize() directly instead of middleware because Express 5 makes req.query
// a read-only getter, which the middleware would otherwise try to overwrite (throwing TypeError).
app.use((req, res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = mongoSanitize.sanitize(req.body);
  }
  next();
});

app.use(requestLogger);

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/pgs", pgRoutes);
app.use("/api/verify-residency", pgResidencyRoutes);
app.use("/api/admissions", admissionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/imagekit", imagekitRoutes);
app.use("/api/user", userRoutes);

app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;

  Logger.error(err.message, {
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
  });

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? "Something went wrong" : err.message,
  });
});

export default app;
