import express from "express";
import {
  createAdmissionRequest,
  getMyAdmission,
  getPGAdmissions,
  getAllAdmissions,
  decideAdmission,
  revokeAdmission,
  ownerAddResident,
} from "../controllers/admission.controller.js";
import { protect, allowRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

// Guest (user) routes
router.post("/", protect, allowRoles("user"), createAdmissionRequest);
router.get("/mine", protect, allowRoles("user"), getMyAdmission);

// PG Owner routes
router.get("/pg", protect, allowRoles("pg_owner"), getPGAdmissions);
router.post("/owner-add", protect, allowRoles("pg_owner"), ownerAddResident);

// Admin routes
router.get("/", protect, allowRoles("admin"), getAllAdmissions);

// Shared decide + revoke (role enforcement inside controller)
router.patch("/:id/decide", protect, allowRoles("pg_owner", "admin"), decideAdmission);
router.patch("/:id/revoke", protect, allowRoles("pg_owner", "admin"), revokeAdmission);

export default router;
