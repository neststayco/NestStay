import express from "express";
import {
  createTestimonial,
  getPublicTestimonials,
  getMyTestimonials,
  getOwnerTestimonials,
  updateTestimonial,
  getAdminTestimonials,
} from "../controllers/testimonial.controller.js";
import { protect, allowRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public
router.get("/", getPublicTestimonials);

// Authenticated user
router.post("/", protect, allowRoles("user"), createTestimonial);
router.get("/mine", protect, allowRoles("user"), getMyTestimonials);

// PG owner
router.get("/pg", protect, allowRoles("pg_owner"), getOwnerTestimonials);
router.patch("/:id", protect, allowRoles("pg_owner", "admin"), updateTestimonial);

// Admin
router.get("/admin", protect, allowRoles("admin"), getAdminTestimonials);

export default router;
