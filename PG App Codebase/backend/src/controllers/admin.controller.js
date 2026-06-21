import Complaint from "../models/Complaint.js";
import PG from "../models/pg.js";
import PGResidency from "../models/pgResidency.js";
import User from "../models/user.js";
import mongoose from "mongoose";
import Logger from "../services/logger.service.js";
import { runInTransaction } from "../utils/transaction.js";

// GET /api/admin/users
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "", role = "user" } = req.query;

    const filter = { role };
    if (search) {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [{ name: regex }, { email: regex }];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, totalItems] = await Promise.all([
      User.find(filter)
        .select("-password -refreshToken")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: users,
      pagination: {
        totalItems,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalItems / parseInt(limit)),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    Logger.error("GET_ALL_USERS_ERROR", { error: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// PATCH /api/admin/users/:id/deactivate
export const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    if (id === req.user.id.toString()) {
      return res.status(400).json({ success: false, message: "Cannot deactivate your own account" });
    }

    const user = await User.findOneAndUpdate(
      { _id: id, role: "user" },
      { isActive: false, refreshToken: null },
      { new: true }
    ).select("-password -refreshToken").lean();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    Logger.event("user.deactivated", { targetUserId: id, byAdmin: req.user.id });

    return res.status(200).json({ success: true, message: "User deactivated", data: user });
  } catch (error) {
    Logger.error("DEACTIVATE_USER_ERROR", { error: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// GET /api/admin/complaints/stats
export const getGlobalStats = async (req, res) => {
  try {
    const [stats, totalAdmitted, totalPending] = await Promise.all([
      Complaint.aggregate([
        {
          $group: {
            _id: null,
            totalComplaints: { $sum: 1 },
            verifiedComplaints: {
              $sum: { $cond: [{ $eq: ["$isVerifiedResident", true] }, 1, 0] },
            },
            pendingComplaints: {
              $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
            },
            approvedComplaints: {
              $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] },
            },
            rejectedComplaints: {
              $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
            },
          },
        },
        {
          $project: {
            _id: 0,
            totalComplaints: 1,
            verifiedComplaints: 1,
            unverifiedComplaints: { $subtract: ["$totalComplaints", "$verifiedComplaints"] },
            pendingComplaints: 1,
            approvedComplaints: 1,
            rejectedComplaints: 1,
          },
        },
      ]),
      PGResidency.countDocuments({ residentStatus: "active" }),
      PGResidency.countDocuments({ status: "pending" }),
    ]);

    const result = stats.length > 0
      ? stats[0]
      : {
          totalComplaints: 0,
          verifiedComplaints: 0,
          unverifiedComplaints: 0,
          pendingComplaints: 0,
          approvedComplaints: 0,
          rejectedComplaints: 0,
        };

    return res.status(200).json({
      success: true,
      data: {
        ...result,
        totalAdmitted,
        totalPendingAdmissions: totalPending,
      },
    });
  } catch (error) {
    Logger.error("GET_GLOBAL_STATS_ERROR", { error: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// GET /api/admin/complaints/by-pg
export const getStatsByPG = async (req, res) => {
  try {
    const stats = await Complaint.aggregate([
      {
        $group: {
          _id: "$pgId",
          complaintCount: { $sum: 1 },
          verifiedComplaints: {
            $sum: { $cond: [{ $eq: ["$isVerifiedResident", true] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: "pgs",
          localField: "_id",
          foreignField: "_id",
          as: "pgInfo",
        },
      },
      { $unwind: "$pgInfo" },
      {
        $project: {
          _id: 1,
          pgName: "$pgInfo.name",
          complaintCount: 1,
          verifiedComplaints: 1,
          unverifiedComplaints: { $subtract: ["$complaintCount", "$verifiedComplaints"] },
        },
      },
      { $sort: { complaintCount: -1 } },
    ]);

    return res.status(200).json({ success: true, data: stats });
  } catch (error) {
    Logger.error("GET_STATS_BY_PG_ERROR", { error: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// POST /api/admin/owners
export const createPGOwner = async (req, res) => {
  try {
    const { name, email, password, pgId } = req.body;

    if (!name || !email || !password || !pgId) {
      return res.status(400).json({ success: false, message: "name, email, password and pgId are required" });
    }

    if (!mongoose.isValidObjectId(pgId)) {
      return res.status(400).json({ success: false, message: "Invalid pgId format" });
    }

    const pg = await PG.findById(pgId).lean();
    if (!pg) {
      return res.status(404).json({ success: false, message: "PG not found" });
    }

    if (pg.ownerId) {
      return res.status(409).json({ success: false, message: "PG already has an assigned owner" });
    }

    const existing = await User.findOne({ email }).lean();
    if (existing) {
      return res.status(400).json({ success: false, message: "Email already in use" });
    }

    const owner = await runInTransaction(async (session) => {
      const conflict = await User.findOne({ role: "pg_owner", pgId }).session(session).lean();
      if (conflict) {
        throw new Error("PG_ALREADY_ASSIGNED");
      }

      const [createdOwner] = await User.create([{
        name,
        email,
        password,
        role: "pg_owner",
        pgId,
        onboardingStatus: "legacy",
        isVerified: true,
        isActive: true,
      }], { session });

      const linkedPG = await PG.findOneAndUpdate(
        { _id: pgId, ownerId: null },
        { ownerId: createdOwner._id },
        { new: true, session }
      ).lean();

      if (!linkedPG) {
        throw new Error("PG_ALREADY_ASSIGNED");
      }

      return createdOwner;
    });

    Logger.event("owner.created", { ownerId: owner._id, pgId });

    return res.status(201).json({
      success: true,
      message: "PG owner account created",
      data: {
        _id: owner._id,
        name: owner.name,
        email: owner.email,
        role: owner.role,
        pgId: owner.pgId,
      },
    });
  } catch (error) {
    if (error.message === "PG_ALREADY_ASSIGNED") {
      return res.status(409).json({ success: false, message: "PG already has an assigned owner" });
    }
    Logger.error("CREATE_PG_OWNER_ERROR", { error: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// GET /api/admin/owners
export const getAllPGOwners = async (req, res) => {
  try {
    const owners = await User.find({ role: "pg_owner" })
      .select("-password -refreshToken")
      .populate("pgId", "name location.city")
      .lean();

    return res.status(200).json({ success: true, data: owners });
  } catch (error) {
    Logger.error("GET_PG_OWNERS_ERROR", { error: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// PATCH /api/admin/owners/:id
export const updatePGOwner = async (req, res) => {
  try {
    const { id } = req.params;
    const { pgId } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid owner ID" });
    }

    if (pgId && !mongoose.isValidObjectId(pgId)) {
      return res.status(400).json({ success: false, message: "Invalid pgId format" });
    }

    const existingOwner = await User.findOne({ _id: id, role: "pg_owner" }).select("-password");

    if (!existingOwner) {
      return res.status(404).json({ success: false, message: "PG owner not found" });
    }

    if (pgId) {
      const assigneeConflict = await User.findOne({
        _id: { $ne: id },
        role: "pg_owner",
        pgId,
      }).lean();

      if (assigneeConflict) {
        return res.status(409).json({ success: false, message: "PG already has an assigned owner" });
      }
    }

    const owner = await runInTransaction(async (session) => {
      const ownerDoc = await User.findOne({ _id: id, role: "pg_owner" }).session(session);

      if (!ownerDoc) {
        throw new Error("OWNER_NOT_FOUND");
      }

      const previousPgId = ownerDoc.pgId;

      if (pgId) {
        const targetPG = await PG.findOne({ _id: pgId }).session(session);
        if (!targetPG) {
          throw new Error("PG_NOT_FOUND");
        }
        if (targetPG.ownerId && targetPG.ownerId.toString() !== id) {
          throw new Error("PG_ALREADY_ASSIGNED");
        }
      }

      ownerDoc.pgId = pgId || null;
      await ownerDoc.save({ session });

      if (previousPgId && (!pgId || previousPgId.toString() !== pgId)) {
        await PG.findOneAndUpdate(
          { _id: previousPgId, ownerId: ownerDoc._id },
          { ownerId: null },
          { session }
        );
      }

      if (pgId) {
        const linkedPG = await PG.findOneAndUpdate(
          { _id: pgId, $or: [{ ownerId: null }, { ownerId: ownerDoc._id }] },
          { ownerId: ownerDoc._id },
          { new: true, session }
        ).lean();

        if (!linkedPG) {
          throw new Error("PG_ALREADY_ASSIGNED");
        }
      }

      return User.findById(id).select("-password").session(session).lean();
    });

    return res.status(200).json({ success: true, message: "Owner updated", data: owner });
  } catch (error) {
    if (error.message === "OWNER_NOT_FOUND") {
      return res.status(404).json({ success: false, message: "PG owner not found" });
    }
    if (error.message === "PG_NOT_FOUND") {
      return res.status(404).json({ success: false, message: "PG not found" });
    }
    if (error.message === "PG_ALREADY_ASSIGNED") {
      return res.status(409).json({ success: false, message: "PG already has an assigned owner" });
    }
    Logger.error("UPDATE_PG_OWNER_ERROR", { error: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// PATCH /api/admin/owners/:id/password
export const resetOwnerPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid owner ID" });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    const owner = await User.findOne({ _id: id, role: "pg_owner" });
    if (!owner) {
      return res.status(404).json({ success: false, message: "PG owner not found" });
    }

    owner.password = password;
    await owner.save();

    Logger.event("owner.passwordReset", { ownerId: id });

    return res.status(200).json({ success: true, message: "Password updated" });
  } catch (error) {
    Logger.error("RESET_OWNER_PASSWORD_ERROR", { error: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// GET /api/admin/pending-pgs
export const getPendingPGs = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [pgs, totalItems] = await Promise.all([
      PG.find({ verificationStatus: "pending_review" })
        .populate("ownerId", "name email")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      PG.countDocuments({ verificationStatus: "pending_review" }),
    ]);

    return res.status(200).json({
      success: true,
      data: pgs,
      pagination: {
        totalItems,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalItems / parseInt(limit)),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    Logger.error("GET_PENDING_PGS_ERROR", { error: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// PATCH /api/admin/pending-pgs/:id/approve
export const approvePG = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid PG ID" });
    }

    const pg = await PG.findOne({ _id: id, verificationStatus: "pending_review" });
    if (!pg) {
      return res.status(404).json({ success: false, message: "PG not found or not pending review" });
    }

    const updatedPG = await runInTransaction(async (session) => {
      pg.verificationStatus = "approved";
      pg.reviewedBy = req.user.id;
      pg.reviewedAt = new Date();
      pg.rejectionReason = null;
      pg.isActive = true;
      await pg.save({ session });

      if (pg.ownerId) {
        await User.findByIdAndUpdate(pg.ownerId, { onboardingStatus: "approved" }, { session });
      }

      return pg;
    });

    Logger.event("pg.approved", { pgId: id, reviewedBy: req.user.id });

    return res.status(200).json({
      success: true,
      message: "PG approved and is now publicly visible",
      data: updatedPG,
    });
  } catch (error) {
    Logger.error("APPROVE_PG_ERROR", { error: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// PATCH /api/admin/pending-pgs/:id/reject
export const rejectPG = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid PG ID" });
    }

    if (!reason || typeof reason !== "string" || reason.trim().length < 5) {
      return res.status(400).json({ success: false, message: "Rejection reason is required (min 5 characters)" });
    }

    const pg = await PG.findOne({ _id: id, verificationStatus: "pending_review" });
    if (!pg) {
      return res.status(404).json({ success: false, message: "PG not found or not pending review" });
    }

    const updatedPG = await runInTransaction(async (session) => {
      pg.verificationStatus = "rejected";
      pg.reviewedBy = req.user.id;
      pg.reviewedAt = new Date();
      pg.rejectionReason = reason.trim();
      pg.isActive = false;
      await pg.save({ session });

      if (pg.ownerId) {
        await User.findByIdAndUpdate(pg.ownerId, { onboardingStatus: "rejected" }, { session });
      }

      return pg;
    });

    Logger.event("pg.rejected", { pgId: id, reviewedBy: req.user.id, reason: reason.trim() });

    return res.status(200).json({
      success: true,
      message: "PG rejected",
      data: updatedPG,
    });
  } catch (error) {
    Logger.error("REJECT_PG_ERROR", { error: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
