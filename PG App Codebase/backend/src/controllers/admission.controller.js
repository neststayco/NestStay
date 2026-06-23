import mongoose from "mongoose";
import PGResidency from "../models/pgResidency.js";
import PG from "../models/pg.js";
import User from "../models/user.js";
import Logger from "../services/logger.service.js";

// POST /api/admissions — user submits admission request
export const createAdmissionRequest = async (req, res) => {
  try {
    const { pgId, moveInNote } = req.body;
    const userId = req.user.id;

    if (!pgId) {
      return res.status(400).json({ success: false, message: "pgId is required" });
    }

    if (!mongoose.isValidObjectId(pgId)) {
      return res.status(400).json({ success: false, message: "Invalid pgId format" });
    }

    const pg = await PG.findOne({ _id: pgId, status: 'active' }).lean();
    if (!pg) {
      return res.status(404).json({ success: false, message: "PG not found or inactive" });
    }

    // Block if user already has an active admission or pending request
    const existingActiveAnywhere = await PGResidency.findOne({
      userId,
      status: { $in: ["pending", "approved"] },
      residentStatus: { $ne: "removed" },
    }).lean();

    if (existingActiveAnywhere) {
      return res.status(400).json({
        success: false,
        message: "You already have an active admission or pending request. Resolve it first.",
      });
    }

    const admission = await PGResidency.create({ userId, pgId, moveInNote: moveInNote || "" });

    const populatedAdmission = await PGResidency.findById(admission._id)
      .populate("pgId", "name location images slug")
      .lean();

    Logger.event("admission.requested", { admissionId: admission._id, userId, pgId });

    return res.status(201).json({
      success: true,
      message: "Admission request submitted",
      data: populatedAdmission,
    });
  } catch (error) {
    Logger.error("CREATE_ADMISSION_ERROR", { error: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// GET /api/admissions/mine — user gets their current active admission
export const getMyAdmission = async (req, res) => {
  try {
    const admission = await PGResidency.findOne({
      userId: req.user.id,
      status: { $in: ["pending", "approved"] },
      residentStatus: { $ne: "removed" },
    })
      .populate("pgId", "name location images slug")
      .lean();

    return res.status(200).json({
      success: true,
      data: admission || null,
    });
  } catch (error) {
    Logger.error("GET_MY_ADMISSION_ERROR", { error: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// GET /api/admissions/pg — pg_owner gets admissions for their PG
export const getPGAdmissions = async (req, res) => {
  try {
    const pgId = req.user.pgId;
    const { status, residentStatus, search, page = 1, limit = 15 } = req.query;

    if (!pgId) {
      return res.status(400).json({ success: false, message: "No PG linked to this owner account" });
    }

    const filter = { pgId };
    if (status) filter.status = status;
    if (residentStatus) filter.residentStatus = residentStatus;

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      const matchingUserIds = await User.find({ $or: [{ name: regex }, { email: regex }] }).distinct("_id");
      filter.userId = { $in: matchingUserIds };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [admissions, totalItems] = await Promise.all([
      PGResidency.find(filter)
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      PGResidency.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: admissions,
      pagination: {
        totalItems,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalItems / parseInt(limit)),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    Logger.error("GET_PG_ADMISSIONS_ERROR", { error: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// GET /api/admissions — admin gets all admissions
export const getAllAdmissions = async (req, res) => {
  try {
    const { status, residentStatus, search, pgId, page = 1, limit = 15 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (residentStatus) filter.residentStatus = residentStatus;
    if (pgId && mongoose.isValidObjectId(pgId)) filter.pgId = pgId;

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      const matchingUserIds = await User.find({ $or: [{ name: regex }, { email: regex }] }).distinct("_id");
      filter.userId = { $in: matchingUserIds };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [admissions, totalItems] = await Promise.all([
      PGResidency.find(filter)
        .populate("userId", "name email")
        .populate("pgId", "name location.city location.area")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      PGResidency.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: admissions,
      pagination: {
        totalItems,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalItems / parseInt(limit)),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    Logger.error("GET_ALL_ADMISSIONS_ERROR", { error: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// PATCH /api/admissions/:id/decide — owner or admin approves/rejects a pending admission
export const decideAdmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision } = req.body;
    const actorRole = req.user.role;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid admission ID" });
    }

    if (!["approved", "rejected"].includes(decision)) {
      return res.status(400).json({ success: false, message: "decision must be 'approved' or 'rejected'" });
    }

    const admission = await PGResidency.findById(id);
    if (!admission) {
      return res.status(404).json({ success: false, message: "Admission request not found" });
    }

    if (actorRole === "pg_owner") {
      if (!admission.pgId.equals(req.user.pgId)) {
        return res.status(403).json({ success: false, message: "Not authorized for this admission" });
      }
    }

    if (admission.status !== "pending") {
      return res.status(400).json({ success: false, message: "Can only decide on pending admissions" });
    }

    admission.status = decision;
    admission.processedBy = {
      role: actorRole === "admin" ? "admin" : "owner",
      userId: req.user.id,
    };

    // Approval creates an active resident — admission stays approved permanently
    if (decision === "approved") {
      admission.residentStatus = "active";
    }

    await admission.save();

    Logger.event("admission.decided", { admissionId: id, decision, by: actorRole });

    return res.status(200).json({
      success: true,
      message: `Admission ${decision}`,
      data: admission,
    });
  } catch (error) {
    Logger.error("DECIDE_ADMISSION_ERROR", { error: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// POST /api/admissions/owner-add — pg_owner directly admits a guest by email
export const ownerAddResident = async (req, res) => {
  try {
    const { email } = req.body;
    const pgId = req.user.pgId;

    if (!email) {
      return res.status(400).json({ success: false, message: "email is required" });
    }

    if (!pgId) {
      return res.status(400).json({ success: false, message: "No PG linked to this owner account" });
    }

    const guest = await User.findOne({
      email: email.toLowerCase().trim(),
      role: "user",
    }).lean();

    if (!guest) {
      return res.status(404).json({
        success: false,
        message: "No guest account found with that email. Make sure the user has registered.",
      });
    }

    const existingActive = await PGResidency.findOne({
      userId: guest._id,
      status: { $in: ["pending", "approved"] },
      residentStatus: { $ne: "removed" },
    }).lean();

    if (existingActive) {
      return res.status(400).json({
        success: false,
        message: "This guest already has an active admission or pending request.",
      });
    }

    const admission = await PGResidency.create({
      userId: guest._id,
      pgId,
      status: "approved",
      residentStatus: "active",
      processedBy: { role: "owner", userId: req.user.id },
    });

    const populated = await PGResidency.findById(admission._id)
      .populate("userId", "name email")
      .lean();

    Logger.event("admission.owner_added", { admissionId: admission._id, guestId: guest._id, pgId });

    return res.status(201).json({
      success: true,
      message: "Guest added successfully",
      data: populated,
    });
  } catch (error) {
    Logger.error("OWNER_ADD_RESIDENT_ERROR", { error: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// POST /api/admissions/:id/withdraw — user withdraws their own pending admission
export const withdrawAdmission = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid admission ID" });
    }

    const admission = await PGResidency.findById(id);
    if (!admission) {
      return res.status(404).json({ success: false, message: "Admission not found" });
    }

    if (!admission.userId.equals(userId)) {
      return res.status(403).json({ success: false, message: "Not authorized to withdraw this admission" });
    }

    if (admission.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending applications can be withdrawn",
      });
    }

    admission.status = "withdrawn";
    await admission.save();

    Logger.event("admission.withdrawn", { admissionId: id, userId });

    return res.status(200).json({ success: true, message: "Application withdrawn", data: admission });
  } catch (error) {
    Logger.error("WITHDRAW_ADMISSION_ERROR", { error: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// PATCH /api/admissions/:id/remove-resident — owner/admin removes an active resident
// Admission status is NEVER modified — only residentStatus changes
export const removeResident = async (req, res) => {
  try {
    const { id } = req.params;
    const actorRole = req.user.role;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid admission ID" });
    }

    const admission = await PGResidency.findById(id);
    if (!admission) {
      return res.status(404).json({ success: false, message: "Admission not found" });
    }

    if (actorRole === "pg_owner" && !admission.pgId.equals(req.user.pgId)) {
      return res.status(403).json({ success: false, message: "Not authorized for this admission" });
    }

    if (admission.residentStatus !== "active") {
      return res.status(400).json({ success: false, message: "Resident is not currently active" });
    }

    admission.residentStatus = "removed";
    admission.residentRemovedAt = new Date();

    await admission.save();

    Logger.event("resident.removed", { admissionId: id, by: actorRole });

    return res.status(200).json({
      success: true,
      message: "Resident removed",
      data: admission,
    });
  } catch (error) {
    Logger.error("REMOVE_RESIDENT_ERROR", { error: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
