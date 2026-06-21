import express from "express";
import { protect, allowRoles } from "../middleware/auth.middleware.js";
import {
  createOnboardingPG,
  updateOnboardingPG,
  getMyOnboardingPG,
  submitOnboardingPG,
} from "../controllers/onboarding.controller.js";

const router = express.Router();

router.use(protect);
router.use(allowRoles("pg_owner"));

router.post("/create-pg", createOnboardingPG);
router.get("/my-pg", getMyOnboardingPG);
router.patch("/:id", updateOnboardingPG);
router.post("/submit", submitOnboardingPG);

export default router;
