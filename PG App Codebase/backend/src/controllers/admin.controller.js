import Complaint from "../models/Complaint.js";
import PG from "../models/pg.js";
import PGResidency from "../models/pgResidency.js";
import User from "../models/user.js";
import mongoose from "mongoose";
import Logger from "../services/logger.service.js";

// GET /api/admin/complaints/stats
export const getGlobalStats = async (req, res) => {
  try {
    const [stats, totalAdmitted, totalPending, escalated] = await Promise.all([
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
      PGResidency.countDocuments({ status: "admitted" }),
      PGResidency.countDocuments({ status: "pending" }),
      PGResidency.countDocuments({ status: "pending", escalatedAt: { $ne: null } }),
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
        escalatedAdmissions: escalated,
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

    const existing = await User.findOne({ email }).lean();
    if (existing) {
      return res.status(400).json({ success: false, message: "Email already in use" });
    }

    const owner = await User.create({ name, email, password, role: "pg_owner", pgId });

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
    Logger.error("CREATE_PG_OWNER_ERROR", { error: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// GET /api/admin/owners
export const getAllPGOwners = async (req, res) => {
  try {
    const owners = await User.find({ role: "pg_owner" })
      .select("-password")
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

    const owner = await User.findOneAndUpdate(
      { _id: id, role: "pg_owner" },
      { pgId: pgId || null },
      { new: true }
    ).select("-password").lean();

    if (!owner) {
      return res.status(404).json({ success: false, message: "PG owner not found" });
    }

    return res.status(200).json({ success: true, message: "Owner updated", data: owner });
  } catch (error) {
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
