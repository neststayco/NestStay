import express from "express";
import { getTerms, updateTerms } from "../controllers/terms.controller.js";
import { protect, allowRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getTerms);
router.patch("/", protect, allowRoles("admin"), updateTerms);

export default router;
