import Complaint from "../models/Complaint.js";
import PG from "../models/pg.js";
import Logger from "../services/logger.service.js";
import mongoose from "mongoose";

// POST /api/complaints
export const createComplaint = async (req, res) => {
  try {
    const { pgId, type, description, image, isAnonymous } = req.body;

    if (!pgId || !type || !description) {
      return res.status(400).json({
        success: false,
        message: "pgId, type and description are required",
      });
    }

    if (!mongoose.isValidObjectId(pgId)) {
      return res.status(400).json({ success: false, message: "Invalid pgId format" });
    }

    const pg = await PG.findById(pgId).lean();
    if (!pg) {
      return res.status(404).json({ success: false, message: "PG not found or inactive" });
    }

    // Anti-spam: 15-minute cooldown per user per PG
    if (req.user && req.user.id) {
      const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
      const recentCount = await Complaint.countDocuments({
        pgId,
        createdBy: req.user.id,
        createdAt: { $gte: fifteenMinsAgo },
      });
      if (recentCount > 0) {
        return res.status(429).json({
          success: false,
          error: "TOO_MANY_REQUESTS",
          message: "Please wait 15 minutes before submitting another complaint for this PG to prevent flooding.",
        });
      }
    }

    const pgSnapshot = {
      name: pg.name,
      city: pg.location?.city,
      area: pg.location?.area,
      ownerName: pg.owner?.name,
    };

    const complaint = await Complaint.create({
      pgId,
      pgSnapshot,
      type,
      description,
      image,
      isAnonymous,
      createdBy: req.user.id,
      isVerifiedResident: true,
      status: "pending",
    });

    Logger.event("complaint.created", { complaintId: complaint._id, pgId: complaint.pgId });

    return res.status(201).json({
      success: true,
      message: "Complaint created successfully",
      data: complaint,
    });
  } catch (error) {
    Logger.error("CREATE_COMPLAINT_ERROR", { error: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// GET /api/complaints/mine — user gets their own complaints
export const getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ createdBy: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, data: complaints });
  } catch (error) {
    Logger.error("GET_MY_COMPLAINTS_ERROR", { error: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// GET /api/complaints — admin or pg_owner
export const getComplaints = async (req, res) => {
  try {
    const { status, pgId, verifiedOnly, page = 1, limit = 10 } = req.query;

    const filter = {};

    if (status) filter.status = status;

    // pg_owner always sees only their own PG; ignore pgId from query for them
    if (req.user.role === "pg_owner") {
      if (!req.user.pgId) {
        return res.status(400).json({ success: false, message: "No PG linked to this owner account" });
      }
      filter.pgId = req.user.pgId;
    } else if (pgId) {
      if (!mongoose.isValidObjectId(pgId)) {
        return res.status(400).json({ success: false, message: "Invalid pgId format" });
      }
      filter.pgId = pgId;
    }

    if (verifiedOnly === "true") {
      filter.isVerifiedResident = true;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [complaints, totalItems] = await Promise.all([
      Complaint.find(filter)
        .populate("pgId", "name location.address owner")
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Complaint.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Complaints fetched",
      data: complaints,
      pagination: {
        totalItems,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalItems / parseInt(limit)),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    Logger.error("GET_COMPLAINTS_ERROR", { error: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// PATCH /api/complaints/:id — pg_owner updates complaint status
export const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid complaint ID format" });
    }

    const validStatuses = Complaint.schema.path("status").enumValues;
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    if (!req.user.pgId || !complaint.pgId.equals(req.user.pgId)) {
      return res.status(403).json({ success: false, message: "Not authorized for this complaint" });
    }

    complaint.status = status;
    await complaint.save();

    return res.status(200).json({
      success: true,
      message: "Complaint updated",
      data: complaint,
    });
  } catch (error) {
    Logger.error("UPDATE_COMPLAINT_ERROR", { error: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
