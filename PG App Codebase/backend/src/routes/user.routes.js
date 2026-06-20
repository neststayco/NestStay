import express from "express";
import {
  getUserInteractions,
  toggleSave,
  getSavedPGs,
} from "../controllers/user.controller.js";
import { protect, allowRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/interactions", protect, allowRoles("user"), getUserInteractions);
router.get("/saved", protect, allowRoles("user"), getSavedPGs);
router.post("/pgs/:pgId/save", protect, allowRoles("user"), toggleSave);

export default router;
