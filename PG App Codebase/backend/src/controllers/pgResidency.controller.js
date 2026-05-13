import PGResidency from "../models/pgResidency.js";
import PG from "../models/pg.js";
import mongoose from "mongoose";
import Logger from "../services/logger.service.js";

export const applyForVerification = async (req, res) => {
  try {
    const { pgId, moveInNote } = req.body;

    if (!pgId) {
      return res.status(400).json({ success: false, message: "pgId is required" });
    }

    if (!mongoose.isValidObjectId(pgId)) {
      return res.status(400).json({ success: false, message: "Invalid pgId format" });
    }

    const pgExists = await PG.exists({ _id: pgId, isActive: true });
    if (!pgExists) {
      return res.status(404).json({ success: false, message: "PG not found or inactive" });
    }

    const existingApp = await PGResidency.findOne({ userId: req.user.id, pgId });
    if (existingApp) {
      return res.status(400).json({
        success: false,
        message: `Application already exists with status: ${existingApp.status}`,
      });
    }

    const verification = await PGResidency.create({
      userId: req.user.id,
      pgId,
      moveInNote,
    });

    return res.status(201).json({
      success: true,
      message: "Verification application submitted successfully",
      data: verification,
    });
  } catch (error) {
    Logger.error("APPLY_VERIFICATION_ERROR", { message: error.message });
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Application already exists" });
    }
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getVerifications = async (req, res) => {
  try {
    const { status, pgId, page = 1, limit = 15 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (pgId) {
      if (!mongoose.isValidObjectId(pgId)) {
        return res.status(400).json({ success: false, message: "Invalid pgId format" });
      }
      filter.pgId = pgId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const verifications = await PGResidency.find(filter)
      .populate("userId", "name email")
      .populate("pgId", "name location")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const totalItems = await PGResidency.countDocuments(filter);

    return res.status(200).json({
      success: true,
      message: "Verifications fetched",
      data: verifications,
      pagination: {
        totalItems,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalItems / parseInt(limit)),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    Logger.error("GET_VERIFICATIONS_ERROR", { message: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const manageVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid verification ID format" });
    }

    if (!["admitted", "rejected"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Status must be 'admitted' or 'rejected'" });
    }

    const verification = await PGResidency.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!verification) {
      return res.status(404).json({ success: false, message: "Verification application not found" });
    }

    return res.status(200).json({
      success: true,
      message: `Verification application marked as ${status}`,
      data: verification,
    });
  } catch (error) {
    Logger.error("MANAGE_VERIFICATION_ERROR", { message: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
