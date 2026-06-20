import Complaint from "../models/Complaint.js";
import PG from "../models/pg.js";
import PGResidency from "../models/pgResidency.js";
import User from "../models/user.js";
import mongoose from "mongoose";
import Logger from "../services/logger.service.js";

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

    const existing = await User.findOne({ email }).lean();
    if (existing) {
      return res.status(400).json({ success: false, message: "Email already in use" });
    }

    // Admin-provisioned accounts are pre-verified and active
    const owner = await User.create({
      name,
      email,
      password,
      role: "pg_owner",
      pgId,
      isVerified: true,
      isActive: true,
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
