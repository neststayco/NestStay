import express from "express";
import {
  getGlobalStats,
  getStatsByPG,
  createPGOwner,
  getAllPGOwners,
  updatePGOwner,
  resetOwnerPassword,
  getAllUsers,
  deactivateUser,
  getPendingPGs,
  approvePG,
  rejectPG,
} from "../controllers/admin.controller.js";
import { protect, allowRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);
router.use(allowRoles("admin"));

router.get("/users", getAllUsers);
router.patch("/users/:id/deactivate", deactivateUser);

router.get("/complaints/stats", getGlobalStats);
router.get("/complaints/by-pg", getStatsByPG);

router.post("/owners", createPGOwner);
router.get("/owners", getAllPGOwners);
router.patch("/owners/:id", updatePGOwner);
router.patch("/owners/:id/password", resetOwnerPassword);

router.get("/pending-pgs", getPendingPGs);
router.patch("/pending-pgs/:id/approve", approvePG);
router.patch("/pending-pgs/:id/reject", rejectPG);

export default router;
