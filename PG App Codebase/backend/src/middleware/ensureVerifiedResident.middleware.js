import mongoose from "mongoose";
import PGResidency from "../models/pgResidency.js";

export const ensureVerifiedResident = async (req, res, next) => {
  try {
    const { pgId } = req.body;

    if (!pgId || !mongoose.isValidObjectId(pgId)) {
      return res.status(400).json({ success: false, message: "pgId is required and must be valid" });
    }

    const residency = await PGResidency.findOne({
      userId: req.user.id,
      pgId,
      status: "admitted",
    }).lean();

    if (!residency) {
      return res.status(403).json({
        success: false,
        error: "NOT_VERIFIED_RESIDENT",
        message: "Only verified residents of this PG can perform this action.",
      });
    }

    req.residency = residency;
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
