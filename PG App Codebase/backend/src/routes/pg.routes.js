import express from "express";
import {
  createPG,
  updatePG,
  deletePG,
  getPGList,
  getPGDetails,
  updateMyPGCapacity,
  updateMyPGLocation,
  updateMyPGImages,
  updateMyPGDetails,
} from "../controllers/pg.controller.js";
import { protect, allowRoles, optionalAuth } from "../middleware/auth.middleware.js";
import { uploadImages } from "../middleware/upload.middleware.js";

const router = express.Router();

// Public / Student routes
router.get("/", getPGList);
router.get("/:id", optionalAuth, getPGDetails);

// PG owner routes
router.patch("/my/images", protect, allowRoles("pg_owner"), updateMyPGImages);
router.patch("/my/location", protect, allowRoles("pg_owner"), updateMyPGLocation);
router.patch("/my/capacity", protect, allowRoles("pg_owner"), updateMyPGCapacity);
router.patch("/my/details", protect, allowRoles("pg_owner"), updateMyPGDetails);

// Admin routes
router.post("/", protect, allowRoles("admin"), uploadImages, createPG);
router.patch("/:id", protect, allowRoles("admin"), uploadImages, updatePG);
router.delete("/:id", protect, allowRoles("admin"), deletePG);

export default router;
