import mongoose from "mongoose";
import User from "../models/user.js";
import PG from "../models/pg.js";
import PGResidency from "../models/pgResidency.js";
import Logger from "../services/logger.service.js";

// GET /api/user/interactions — return saved PG ID list
export const getUserInteractions = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("savedPGs").lean();
    return res.json({
      success: true,
      data: {
        savedPGs: (user?.savedPGs || []).map(id => id.toString()),
      },
    });
  } catch (error) {
    Logger.error("GET_USER_INTERACTIONS_ERROR", { error: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// POST /api/user/pgs/:pgId/save — toggle save (atomic)
export const toggleSave = async (req, res) => {
  try {
    const { pgId } = req.params;

    if (!mongoose.isValidObjectId(pgId)) {
      return res.status(400).json({ success: false, message: "Invalid PG ID" });
    }

    const pgExists = await PG.exists({ _id: pgId, status: 'active' });
    if (!pgExists) {
      return res.status(404).json({ success: false, message: "PG not found" });
    }

    const pgObjectId = new mongoose.Types.ObjectId(pgId);
    const user = await User.findById(req.user.id).select("savedPGs").lean();
    const isSaved = (user?.savedPGs || []).some(id => id.equals(pgObjectId));

    if (isSaved) {
      await User.findByIdAndUpdate(req.user.id, { $pull: { savedPGs: pgObjectId } });
    } else {
      await User.findByIdAndUpdate(req.user.id, { $addToSet: { savedPGs: pgObjectId } });
    }

    return res.json({ success: true, data: { saved: !isSaved } });
  } catch (error) {
    Logger.error("TOGGLE_SAVE_ERROR", { error: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// GET /api/user/saved — return saved PGs with meta + remainingCapacity
export const getSavedPGs = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("savedPGs").lean();
    const savedIds = (user?.savedPGs || []).map(id => new mongoose.Types.ObjectId(id));

    if (!savedIds.length) {
      return res.json({ success: true, data: [] });
    }

    const pgs = await PG.aggregate([
      { $match: { _id: { $in: savedIds }, status: 'active' } },
      {
        $lookup: {
          from: "pgresidencies",
          let: { pgId: "$_id" },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$pgId", "$$pgId"] }, { $eq: ["$residentStatus", "active"] }] } } },
          ],
          as: "activeResidents",
        },
      },
      {
        $addFields: {
          occupancy: { $size: "$activeResidents" },
          remainingCapacity: {
            $cond: {
              if: { $ifNull: ["$accommodation.totalCapacity", false] },
              then: { $max: [0, { $subtract: ["$accommodation.totalCapacity", { $size: "$activeResidents" }] }] },
              else: null,
            },
          },
        },
      },
      {
        $project: {
          activeResidents: 0, occupancy: 0,
          "owner.phone": 0, "owner.email": 0,
        },
      },
    ]);

    // preserve saved order
    const ordered = savedIds
      .map(id => pgs.find(p => p._id.equals(id)))
      .filter(Boolean)
      .reverse();

    return res.json({ success: true, data: ordered });
  } catch (error) {
    Logger.error("GET_SAVED_PGS_ERROR", { error: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
