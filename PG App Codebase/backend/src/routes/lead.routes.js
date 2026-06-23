import { Router } from "express";
import { recordView, getOwnerLeads } from "../controllers/lead.controller.js";
import { protect, allowRoles } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/view", protect, allowRoles("user"), recordView);
router.get("/owner", protect, allowRoles("pg_owner"), getOwnerLeads);

export default router;
