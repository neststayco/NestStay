import express from "express";
import {
  createPG,
  updatePG,
  deactivatePG,
  restorePG,
  toggleVerifyPG,
  getPGList,
  getPGDetails,
  updateMyPGCapacity,
  updateMyPGLocation,
  updateMyPGImages,
  updateMyPGVideo,
  updateMyPGDetails,
  toggleLike,
  setLikesEnabled,
} from "../controllers/pg.controller.js";
import { protect, allowRoles, optionalAuth } from "../middleware/auth.middleware.js";
import { uploadMedia } from "../middleware/upload.middleware.js";

const router = express.Router();

// Public / Student routes
router.get("/", optionalAuth, getPGList);
router.get("/:id", optionalAuth, getPGDetails);

// PG owner routes
router.patch("/my/images", protect, allowRoles("pg_owner"), updateMyPGImages);
router.patch("/my/video", protect, allowRoles("pg_owner"), updateMyPGVideo);
router.patch("/my/location", protect, allowRoles("pg_owner"), updateMyPGLocation);
router.patch("/my/capacity", protect, allowRoles("pg_owner"), updateMyPGCapacity);
router.patch("/my/details", protect, allowRoles("pg_owner"), updateMyPGDetails);

// User routes
router.post("/:id/like", protect, allowRoles("user"), toggleLike);

// Admin routes
router.post("/", protect, allowRoles("admin"), uploadMedia, createPG);
router.patch("/:id/deactivate", protect, allowRoles("admin"), deactivatePG);
router.patch("/:id/restore", protect, allowRoles("admin"), restorePG);
router.patch("/:id/verify", protect, allowRoles("admin"), toggleVerifyPG);
router.patch("/:id/likes-enabled", protect, allowRoles("admin"), setLikesEnabled);
router.patch("/:id", protect, allowRoles("admin"), uploadMedia, updatePG);

export default router;
