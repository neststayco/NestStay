import express from "express";
import { getImageKitAuth } from "../controllers/imagekit.controller.js";
import { protect, allowRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/auth", protect, allowRoles("pg_owner", "admin"), getImageKitAuth);

export default router;
