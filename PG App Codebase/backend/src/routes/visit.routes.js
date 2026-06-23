import express from "express";
import { createVisit, getOwnerVisits } from "../controllers/visit.controller.js";
import { protect, allowRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protect, allowRoles("user"), createVisit);
router.get("/owner", protect, allowRoles("pg_owner"), getOwnerVisits);

export default router;
