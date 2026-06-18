import PG from "../models/pg.js";
import Complaint from "../models/Complaint.js";
import PGResidency from "../models/pgResidency.js";
import mongoose from "mongoose";
import Logger from "../services/logger.service.js";
import { uploadToImageKit, deleteFromImageKit } from "../utils/uploadToImageKit.js";
import { calculateTrustScore } from "../utils/calculateTrustScore.js";

export const createPG = async (req, res) => {
  try {
    let payload;
    try {
      payload = JSON.parse(req.body.data || "{}");
    } catch {
      return res.status(400).json({ success: false, message: "Invalid form data" });
    }

    const { name, slug, description, location, pricing, accommodation, foodType, amenities, owner, isVerified } = payload;

    if (!name || !slug || !description) {
      return res.status(400).json({ success: false, message: "Name, slug, and description are required" });
    }

    const files = req.files || [];
    if (files.length < 3) {
      return res.status(400).json({ success: false, message: "Minimum 3 images required" });
    }
    if (files.length > 10) {
      return res.status(400).json({ success: false, message: "Maximum 10 images allowed" });
    }

    const existingPG = await PG.findOne({ slug });
    if (existingPG) {
      return res.status(400).json({ success: false, message: "A PG with this slug already exists" });
    }

    const uploadedImages = await Promise.all(files.map((f) => uploadToImageKit(f)));

    const pg = await PG.create({
      name, slug, description, location, pricing, accommodation, foodType, amenities,
      images: uploadedImages,
      owner, isVerified,
      createdBy: req.user.id,
    });

    return res.status(201).json({ success: true, message: "PG created successfully", data: pg });
  } catch (error) {
    Logger.error("CREATE_PG_ERROR", { message: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const updatePG = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid PG ID" });
    }

    let updateData;
    const files = req.files;

    if (files && files.length > 0) {
      // Multipart with new images — parse text payload from `data` field
      let payload;
      try {
        payload = JSON.parse(req.body.data || "{}");
      } catch {
        return res.status(400).json({ success: false, message: "Invalid form data" });
      }

      if (files.length < 3) {
        return res.status(400).json({ success: false, message: "Minimum 3 images required" });
      }
      if (files.length > 10) {
        return res.status(400).json({ success: false, message: "Maximum 10 images allowed" });
      }

      // Delete old images from ImageKit before replacing
      const existing = await PG.findById(id).select("images").lean();
      if (existing?.images?.length > 0) {
        await Promise.allSettled(
          existing.images.filter((img) => img.fileId).map((img) => deleteFromImageKit(img.fileId))
        );
      }

      const uploadedImages = await Promise.all(files.map((f) => uploadToImageKit(f)));
      updateData = { ...payload, images: uploadedImages };
    } else if (req.body.data) {
      // Multipart without new images — keep existing images from payload
      try {
        updateData = JSON.parse(req.body.data);
      } catch {
        return res.status(400).json({ success: false, message: "Invalid form data" });
      }
    } else {
      // Pure JSON request (e.g. toggle verify)
      updateData = req.body;
    }

    const { name, slug, description, location, pricing, accommodation, foodType, amenities, images, owner, isVerified } = updateData;

    const pg = await PG.findByIdAndUpdate(
      id,
      { name, slug, description, location, pricing, accommodation, foodType, amenities, images, owner, isVerified },
      { new: true, runValidators: true }
    );

    if (!pg) {
      return res.status(404).json({ success: false, message: "PG not found" });
    }

    return res.status(200).json({ success: true, message: "PG updated successfully", data: pg });
  } catch (error) {
    Logger.error("UPDATE_PG_ERROR", { message: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const deletePG = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid PG ID" });
    }

    const pg = await PG.findById(id).lean();
    if (!pg) {
      return res.status(404).json({ success: false, message: "PG not found" });
    }

    // Clean up images from ImageKit
    if (pg.images?.length > 0) {
      await Promise.allSettled(
        pg.images.filter((img) => img.fileId).map((img) => deleteFromImageKit(img.fileId))
      );
    }

    await PG.findByIdAndUpdate(id, { isActive: false });

    return res.status(200).json({ success: true, message: "PG deactivated successfully" });
  } catch (error) {
    Logger.error("DELETE_PG_ERROR", { message: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getPGList = async (req, res) => {
  try {
    const { city, area, gender, foodType, minPrice, maxPrice, amenities, sortBy, search, page = 1, limit = 10 } = req.query;

    const matchFilter = { isActive: true };

    if (search && search.trim()) {
      matchFilter.$text = { $search: search.trim() };
    }

    if (city) matchFilter["location.city"] = city;
    if (area) matchFilter["location.area"] = area;
    if (gender) matchFilter["accommodation.gender"] = gender;
    if (foodType) matchFilter.foodType = foodType;

    if (minPrice || maxPrice) {
      matchFilter["pricing.rent"] = {};
      if (minPrice) matchFilter["pricing.rent"].$gte = Number(minPrice);
      if (maxPrice) matchFilter["pricing.rent"].$lte = Number(maxPrice);
    }

    if (amenities) {
      const amenitiesList = amenities.split(",");
      matchFilter.amenities = { $all: amenitiesList };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let sortStage = { createdAt: -1 };
    if (sortBy === "trustScore") {
      sortStage = { "meta.trustScore": -1 };
    } else if (sortBy === "complaints") {
      sortStage = { "meta.complaintCount": -1 };
    } else if (sortBy === "price") {
      sortStage = { "pricing.rent": 1 };
    }

    const pipeline = [
      { $match: matchFilter },
      {
        $lookup: {
          from: "complaints",
          localField: "_id",
          foreignField: "pgId",
          as: "complaints"
        }
      },
      {
        $lookup: {
          from: "pgresidencies",
          let: { pgId: "$_id" },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$pgId", "$$pgId"] }, { $eq: ["$status", "admitted"] }] } } }
          ],
          as: "admittedResidents"
        }
      },
      {
        $addFields: {
          complaintCount: { $size: "$complaints" },
          verifiedComplaints: {
            $size: {
              $filter: {
                input: "$complaints",
                as: "c",
                cond: { $eq: ["$$c.isVerifiedResident", true] }
              }
            }
          },
          occupancy: { $size: "$admittedResidents" }
        }
      },
      {
        $addFields: {
          unverifiedComplaints: { $subtract: ["$complaintCount", "$verifiedComplaints"] },
          remainingCapacity: {
            $cond: {
              if: { $ifNull: ["$accommodation.totalCapacity", false] },
              then: { $max: [0, { $subtract: ["$accommodation.totalCapacity", "$occupancy"] }] },
              else: null
            }
          }
        }
      },
      {
        $addFields: {
          "meta.complaintCount": "$complaintCount",
          "meta.trustScore": {
            $max: [
              0,
              { $subtract: [{ $multiply: ["$verifiedComplaints", 2] }, "$unverifiedComplaints"] }
            ]
          }
        }
      },
      {
        $project: {
          complaints: 0,
          admittedResidents: 0,
          verifiedComplaints: 0,
          unverifiedComplaints: 0,
          complaintCount: 0,
          occupancy: 0
        }
      },
      { $sort: sortStage },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ];

    const pgs = await PG.aggregate(pipeline);
    const totalItems = await PG.countDocuments(matchFilter);

    return res.status(200).json({
      success: true,
      message: "PGs fetched successfully",
      data: pgs,
      pagination: {
        totalItems,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalItems / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    Logger.error("GET_PG_LIST_ERROR", { message: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getPGDetails = async (req, res) => {
  try {
    const pgId = req.params.id;

    if (!mongoose.isValidObjectId(pgId)) {
      return res.status(400).json({ success: false, message: "Invalid PG ID format" });
    }

    const [pg, complaintStats, verifiedResidentsCount] = await Promise.all([
      PG.findOne({ _id: pgId, isActive: true })
        .select("-owner.phone -owner.email")
        .lean(),

      Complaint.aggregate([
        { $match: { pgId: new mongoose.Types.ObjectId(pgId) } },
        {
          $group: {
            _id: null,
            totalComplaints: { $sum: 1 },
            verifiedComplaints: {
              $sum: { $cond: [{ $eq: ["$isVerifiedResident", true] }, 1, 0] }
            }
          }
        }
      ]),

      PGResidency.countDocuments({ pgId, status: "admitted" })
    ]);

    if (!pg) {
      return res.status(404).json({ success: false, message: "PG not found or inactive" });
    }

    const tComplaints = complaintStats[0]?.totalComplaints || 0;
    const vComplaints = complaintStats[0]?.verifiedComplaints || 0;

    const trustMetrics = {
      verifiedResidentsCount,
      totalComplaints: tComplaints,
      verifiedComplaints: vComplaints,
      unverifiedComplaints: tComplaints - vComplaints,
      trustScore: calculateTrustScore(vComplaints, tComplaints - vComplaints),
    };

    const remainingCapacity = pg.accommodation?.totalCapacity != null
      ? Math.max(0, pg.accommodation.totalCapacity - verifiedResidentsCount)
      : null;

    let userContext = {
      isAdmitted: false,
      admissionStatus: null,
    };

    if (req.user && req.user.id) {
      const activeAdmission = await PGResidency.findOne({
        userId: req.user.id,
        pgId,
        status: { $in: ["pending", "admitted"] },
      }).lean();
      if (activeAdmission) {
        userContext.admissionStatus = activeAdmission.status;
        userContext.isAdmitted = activeAdmission.status === "admitted";
      }

      const admissionElsewhere = activeAdmission
        ? null
        : await PGResidency.findOne({
            userId: req.user.id,
            status: { $in: ["pending", "admitted"] },
          }).lean();
      userContext.hasActiveAdmissionElsewhere = Boolean(admissionElsewhere);
    }

    return res.status(200).json({
      success: true,
      pg,
      trust: trustMetrics,
      remainingCapacity,
      userContext
    });
  } catch (error) {
    Logger.error("GET_PG_DETAILS_ERROR", { message: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// PATCH /api/pgs/my/images — pg_owner replaces their PG's images array
export const updateMyPGImages = async (req, res) => {
  try {
    if (!req.user.pgId) {
      return res.status(400).json({ success: false, message: "No PG linked to this owner account" });
    }
    const { images } = req.body;
    if (!Array.isArray(images)) {
      return res.status(400).json({ success: false, message: "images must be an array of URLs" });
    }
    const pg = await PG.findByIdAndUpdate(
      req.user.pgId,
      { images },
      { new: true }
    ).lean();
    if (!pg) {
      return res.status(404).json({ success: false, message: "PG not found" });
    }
    Logger.event("pg.images.updated", { pgId: pg._id, count: images.length });
    return res.status(200).json({ success: true, message: "Images updated", data: pg });
  } catch (error) {
    Logger.error("UPDATE_IMAGES_ERROR", { message: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// PATCH /api/pgs/my/location — pg_owner updates their PG's map coordinates
export const updateMyPGLocation = async (req, res) => {
  try {
    if (!req.user.pgId) {
      return res.status(400).json({ success: false, message: "No PG linked to this owner account" });
    }
    const { lat, lng } = req.body;
    if (lat === undefined || lng === undefined || isNaN(Number(lat)) || isNaN(Number(lng))) {
      return res.status(400).json({ success: false, message: "lat and lng are required numbers" });
    }
    const pg = await PG.findByIdAndUpdate(
      req.user.pgId,
      { "location.coordinates": { lat: Number(lat), lng: Number(lng) } },
      { new: true }
    ).lean();
    if (!pg) {
      return res.status(404).json({ success: false, message: "PG not found" });
    }
    Logger.event("pg.location.updated", { pgId: pg._id });
    return res.status(200).json({ success: true, message: "Location updated", data: pg });
  } catch (error) {
    Logger.error("UPDATE_LOCATION_ERROR", { message: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// PATCH /api/pgs/my/details — pg_owner updates description, pricing, amenities
export const updateMyPGDetails = async (req, res) => {
  try {
    if (!req.user.pgId) {
      return res.status(400).json({ success: false, message: "No PG linked to this owner account" });
    }

    const { description, pricing, amenities } = req.body;
    const update = {};

    if (description !== undefined) {
      if (typeof description !== "string" || description.trim().length < 10) {
        return res.status(400).json({ success: false, message: "Description must be at least 10 characters" });
      }
      update.description = description.trim();
    }

    if (pricing !== undefined) {
      const { rent, deposit, maintenance } = pricing;
      if (rent !== undefined && (isNaN(Number(rent)) || Number(rent) < 0)) {
        return res.status(400).json({ success: false, message: "pricing.rent must be a non-negative number" });
      }
      if (deposit !== undefined && (isNaN(Number(deposit)) || Number(deposit) < 0)) {
        return res.status(400).json({ success: false, message: "pricing.deposit must be a non-negative number" });
      }
      if (maintenance !== undefined && (isNaN(Number(maintenance)) || Number(maintenance) < 0)) {
        return res.status(400).json({ success: false, message: "pricing.maintenance must be a non-negative number" });
      }
      if (rent !== undefined) update["pricing.rent"] = Number(rent);
      if (deposit !== undefined) update["pricing.deposit"] = Number(deposit);
      if (maintenance !== undefined) update["pricing.maintenance"] = Number(maintenance);
    }

    if (amenities !== undefined) {
      if (!Array.isArray(amenities)) {
        return res.status(400).json({ success: false, message: "amenities must be an array of strings" });
      }
      update.amenities = amenities.map(a => String(a).trim()).filter(Boolean);
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ success: false, message: "No valid fields to update" });
    }

    const pg = await PG.findByIdAndUpdate(req.user.pgId, update, { new: true, runValidators: true }).lean();
    if (!pg) {
      return res.status(404).json({ success: false, message: "PG not found" });
    }

    Logger.event("pg.details.updated", { pgId: pg._id });
    return res.status(200).json({ success: true, message: "Details updated", data: pg });
  } catch (error) {
    Logger.error("UPDATE_PG_DETAILS_ERROR", { message: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// PATCH /api/pgs/my/capacity — pg_owner updates their PG's total capacity
export const updateMyPGCapacity = async (req, res) => {
  try {
    if (!req.user.pgId) {
      return res.status(400).json({ success: false, message: "No PG linked to this owner account" });
    }
    const { totalCapacity } = req.body;
    if (totalCapacity === undefined || isNaN(Number(totalCapacity)) || Number(totalCapacity) < 0) {
      return res.status(400).json({ success: false, message: "totalCapacity must be a non-negative number" });
    }
    const pg = await PG.findByIdAndUpdate(
      req.user.pgId,
      { "accommodation.totalCapacity": Number(totalCapacity) },
      { new: true }
    ).lean();
    if (!pg) {
      return res.status(404).json({ success: false, message: "PG not found" });
    }
    Logger.event("pg.capacity.updated", { pgId: pg._id, totalCapacity: pg.accommodation.totalCapacity });
    return res.status(200).json({ success: true, message: "Capacity updated", data: pg });
  } catch (error) {
    Logger.error("UPDATE_CAPACITY_ERROR", { message: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
