import express from "express";
import {
  createComplaint,
  getMyComplaints,
  getComplaints,
  updateComplaintStatus,
} from "../controllers/complaint.controller.js";
import { protect, allowRoles } from "../middleware/auth.middleware.js";
import { ensureVerifiedResident } from "../middleware/ensureVerifiedResident.middleware.js";

const router = express.Router();

router.post("/", protect, allowRoles("user"), ensureVerifiedResident, createComplaint);
router.get("/mine", protect, allowRoles("user"), getMyComplaints);
router.get("/", protect, allowRoles("admin", "pg_owner"), getComplaints);
router.patch("/:id", protect, allowRoles("pg_owner"), updateComplaintStatus);

export default router;
