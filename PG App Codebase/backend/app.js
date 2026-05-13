import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import complaintRoutes from "./src/routes/complaint.routes.js";
import testimonialRoutes from "./src/routes/testimonial.routes.js";
import imagekitRoutes from "./src/routes/imagekit.routes.js";
import authRoutes from "./src/routes/auth.routes.js";
import pgRoutes from "./src/routes/pg.routes.js";
import pgResidencyRoutes from "./src/routes/pgResidency.routes.js";
import adminRoutes from "./src/routes/admin.routes.js";
import admissionRoutes from "./src/routes/admission.routes.js";
import { initializeEventHandlers } from "./src/events/listeners.js";
import requestLogger from "./src/middleware/requestLogger.middleware.js";
import Logger from "./src/services/logger.service.js";

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [];

const app = express();

initializeEventHandlers();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later." },
});

app.use(express.json());
app.use(requestLogger);

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/pgs", pgRoutes);
app.use("/api/verify-residency", pgResidencyRoutes);
app.use("/api/admissions", admissionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/imagekit", imagekitRoutes);

app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  Logger.error(err.message, {
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
  });

  res.status(500).json({
    message: "Something went wrong",
  });
});

export default app;
