import PG from "../models/pg.js";
import User from "../models/user.js";
import Complaint from "../models/Complaint.js";
import PGResidency from "../models/pgResidency.js";
import mongoose from "mongoose";
import Logger from "../services/logger.service.js";
import { uploadToImageKit, deleteFromImageKit } from "../utils/uploadToImageKit.js";
import { runInTransaction } from "../utils/transaction.js";

export const createPG = async (req, res) => {
  try {
    let payload;
    try {
      payload = JSON.parse(req.body.data || "{}");
    } catch {
      return res.status(400).json({ success: false, message: "Invalid form data" });
    }

    const { name, slug, description, location, pricing, accommodation, foodType, amenities, separateKitchenAvailable, owner, isVerified, ownerAccount } = payload;

    if (!name || !slug || !description) {
      return res.status(400).json({ success: false, message: "Name, slug, and description are required" });
    }

    const files = req.files?.images || req.files || [];
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

    if (ownerAccount?.create) {
      if (!owner?.email) {
        return res.status(400).json({ success: false, message: "Owner email is required to create a login account" });
      }
      if (!ownerAccount.password || ownerAccount.password.length < 8) {
        return res.status(400).json({ success: false, message: "Owner password must be at least 8 characters" });
      }
      const emailTaken = await User.findOne({ email: owner.email }).lean();
      if (emailTaken) {
        return res.status(400).json({ success: false, message: "Owner email is already in use" });
      }
    }

    const uploadedImages = await Promise.all(files.map((f) => uploadToImageKit(f)));

    let uploadedVideo;
    const videoFile = req.files?.video?.[0];
    if (videoFile) {
      uploadedVideo = await uploadToImageKit(videoFile, "pg-videos");
    }

    const pgData = {
      name, slug, description, location, pricing, accommodation, foodType, amenities,
      separateKitchenAvailable: separateKitchenAvailable ?? false,
      images: uploadedImages,
      ...(uploadedVideo && { video: uploadedVideo }),
      owner, isVerified,
      createdBy: req.user.id,
    };

    let pg;

    if (ownerAccount?.create) {
      const { pg: createdPG } = await runInTransaction(async (session) => {
        const [newPG] = await PG.create([pgData], { session });

        const [newOwner] = await User.create([{
          name: owner.name,
          email: owner.email,
          password: ownerAccount.password,
          role: "pg_owner",
          pgId: newPG._id,
          onboardingStatus: "legacy",
          isVerified: true,
          isActive: true,
        }], { session });

        await PG.findByIdAndUpdate(newPG._id, { ownerId: newOwner._id }, { session });

        Logger.event("owner.created", { ownerId: newOwner._id, pgId: newPG._id });
        return { pg: newPG, owner: newOwner };
      });
      pg = createdPG;
    } else {
      pg = await PG.create(pgData);
    }

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

    const imageFiles = req.files?.images || (Array.isArray(req.files) ? req.files : []);
    const videoFile = req.files?.video?.[0];

    let updateData;
    if (imageFiles.length > 0 || videoFile || req.body.data) {
      // Multipart — parse text payload from `data` field
      let payload;
      try {
        payload = JSON.parse(req.body.data || "{}");
      } catch {
        return res.status(400).json({ success: false, message: "Invalid form data" });
      }

      if (imageFiles.length > 0) {
        if (imageFiles.length < 3) {
          return res.status(400).json({ success: false, message: "Minimum 3 images required" });
        }
        if (imageFiles.length > 10) {
          return res.status(400).json({ success: false, message: "Maximum 10 images allowed" });
        }
        const existing = await PG.findById(id).select("images video").lean();
        if (existing?.images?.length > 0) {
          await Promise.allSettled(
            existing.images.filter((img) => img.fileId).map((img) => deleteFromImageKit(img.fileId))
          );
        }
        payload.images = await Promise.all(imageFiles.map((f) => uploadToImageKit(f)));
      }

      if (videoFile) {
        const existing = await PG.findById(id).select("video").lean();
        if (existing?.video?.fileId) await deleteFromImageKit(existing.video.fileId).catch(() => {});
        payload.video = await uploadToImageKit(videoFile, "pg-videos");
      }

      updateData = payload;
    } else {
      // Pure JSON request (e.g. toggle verify)
      updateData = req.body;
    }

    const { name, slug, description, location, pricing, accommodation, foodType, amenities, separateKitchenAvailable: skA, images, video, owner, isVerified } = updateData;

    const pg = await PG.findByIdAndUpdate(
      id,
      { name, slug, description, location, pricing, accommodation, foodType, amenities, images, ...(video !== undefined && { video }), owner, isVerified, ...(skA !== undefined && { separateKitchenAvailable: skA }) },
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

export const toggleVerifyPG = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid PG ID" });
    }
    const pg = await PG.findById(id).select("isVerified").lean();
    if (!pg) {
      return res.status(404).json({ success: false, message: "PG not found" });
    }
    const updated = await PG.findByIdAndUpdate(id, { isVerified: !pg.isVerified }, { new: true });
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    Logger.error("TOGGLE_VERIFY_PG_ERROR", { error: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const deactivatePG = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid PG ID" });
    }

    const pg = await PG.findById(id).lean();
    if (!pg) {
      return res.status(404).json({ success: false, message: "PG not found" });
    }

    await PG.findByIdAndUpdate(id, { status: 'inactive' });

    if (pg.ownerId) {
      await User.findByIdAndUpdate(pg.ownerId, { isActive: false, refreshToken: null });
    }

    return res.status(200).json({ success: true, message: "PG deactivated successfully" });
  } catch (error) {
    Logger.error("DEACTIVATE_PG_ERROR", { message: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};


export const restorePG = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid PG ID" });
    }

    const pg = await PG.findById(id).lean();
    if (!pg) {
      return res.status(404).json({ success: false, message: "PG not found" });
    }

    if (pg.status === 'active') {
      return res.status(400).json({ success: false, message: "PG is already active" });
    }

    await PG.findByIdAndUpdate(id, { status: 'active' });

    if (pg.ownerId) {
      await User.findByIdAndUpdate(pg.ownerId, { isActive: true });
    }

    return res.status(200).json({ success: true, message: "PG restored successfully" });
  } catch (error) {
    Logger.error("RESTORE_PG_ERROR", { message: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getPGList = async (req, res) => {
  try {
    const { city, area, gender, foodType, minPrice, maxPrice, amenities, sortBy, search, status, page = 1, limit = 10 } = req.query;

    const isAdmin = req.user?.role === "admin";
    const matchFilter = {};

    if (!isAdmin) {
      matchFilter.status = 'active';
      matchFilter.verificationStatus = "approved";
    } else if (status) {
      matchFilter.status = status;
    }

    if (search && search.trim()) {
      matchFilter.$text = { $search: search.trim() };
    }

    if (city) matchFilter["location.city"] = { $regex: city.trim(), $options: "i" };
    if (area) matchFilter["location.area"] = { $regex: area.trim(), $options: "i" };
    if (gender) matchFilter["accommodation.gender"] = gender;
    if (foodType) matchFilter.foodType = foodType;

    if (minPrice || maxPrice) {
      matchFilter["pricing.rent"] = {};
      if (minPrice) matchFilter["pricing.rent"].$gte = Number(minPrice);
      if (maxPrice) matchFilter["pricing.rent"].$lte = Number(maxPrice);
    }

    if (amenities) {
      const amenitiesList = amenities.split(",").map(a => a.trim()).filter(Boolean);
      if (amenitiesList.length) matchFilter.amenities = { $all: amenitiesList };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let sortStage = { createdAt: -1 };
    if (sortBy === "price") {
      sortStage = { "pricing.rent": 1 };
    }

    const pipeline = [
      { $match: matchFilter },
      {
        $lookup: {
          from: "pgresidencies",
          let: { pgId: "$_id" },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$pgId", "$$pgId"] }, { $eq: ["$residentStatus", "active"] }] } } }
          ],
          as: "admittedResidents"
        }
      },
      {
        $addFields: {
          occupancy: { $size: "$admittedResidents" },
          likesCount: { $size: { $ifNull: ["$likes", []] } },
          remainingCapacity: {
            $cond: {
              if: { $ifNull: ["$accommodation.totalCapacity", false] },
              then: { $max: [0, { $subtract: ["$accommodation.totalCapacity", { $size: "$admittedResidents" }] }] },
              else: null
            }
          }
        }
      },
      {
        $project: {
          admittedResidents: 0,
          occupancy: 0,
          likes: 0,
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

    const [pg, activeResidentCount] = await Promise.all([
      PG.findOne({ _id: pgId, status: 'active', verificationStatus: "approved" })
        .select("-owner.phone -owner.email")
        .lean(),
      PGResidency.countDocuments({ pgId, residentStatus: "active" }),
    ]);

    if (!pg) {
      return res.status(404).json({ success: false, message: "PG not found or inactive" });
    }

    const remainingCapacity = pg.accommodation?.totalCapacity != null
      ? Math.max(0, pg.accommodation.totalCapacity - activeResidentCount)
      : null;

    let userContext = {
      isAdmitted: false,
      admissionStatus: null,
    };

    if (req.user && req.user.id) {
      const activeAdmission = await PGResidency.findOne({
        userId: req.user.id,
        pgId,
        status: { $in: ["pending", "approved"] },
        residentStatus: { $ne: "removed" },
      }).lean();
      if (activeAdmission) {
        userContext.admissionStatus = activeAdmission.status;
        userContext.isAdmitted = activeAdmission.residentStatus === "active";
      }

      const admissionElsewhere = activeAdmission
        ? null
        : await PGResidency.findOne({
            userId: req.user.id,
            status: { $in: ["pending", "approved"] },
            residentStatus: { $ne: "removed" },
          }).lean();
      userContext.hasActiveAdmissionElsewhere = Boolean(admissionElsewhere);
    }

    const likesCount = pg.likes?.length || 0;
    const isLiked = req.user ? (pg.likes || []).some((id) => id.toString() === req.user.id.toString()) : false;
    const { likes: _likes, ...pgData } = pg;

    return res.status(200).json({
      success: true,
      pg: { ...pgData, likesCount, isLiked },
      remainingCapacity,
      userContext,
    });
  } catch (error) {
    Logger.error("GET_PG_DETAILS_ERROR", { message: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// PATCH /api/pgs/my/video — pg_owner updates their PG's video
export const updateMyPGVideo = async (req, res) => {
  try {
    if (!req.user.pgId) {
      return res.status(400).json({ success: false, message: "No PG linked to this owner account" });
    }
    const { video } = req.body;
    const pg = await PG.findByIdAndUpdate(
      req.user.pgId,
      { video: video || null },
      { new: true }
    ).lean();
    if (!pg) return res.status(404).json({ success: false, message: "PG not found" });
    Logger.event("pg.video.updated", { pgId: pg._id });
    return res.status(200).json({ success: true, message: "Video updated", data: pg });
  } catch (error) {
    Logger.error("UPDATE_VIDEO_ERROR", { message: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// POST /api/pgs/:id/like — user toggles like on a PG
export const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid PG ID" });
    }
    const pg = await PG.findOne({ _id: id, status: "active" }).select("likesEnabled likes").lean();
    if (!pg) return res.status(404).json({ success: false, message: "PG not found" });
    if (!pg.likesEnabled) return res.status(403).json({ success: false, message: "Likes are disabled for this PG" });

    const userId = req.user.id;
    const alreadyLiked = pg.likes.some((l) => l.toString() === userId.toString());
    const update = alreadyLiked ? { $pull: { likes: userId } } : { $addToSet: { likes: userId } };
    const updated = await PG.findByIdAndUpdate(id, update, { new: true }).select("likes").lean();

    return res.status(200).json({
      success: true,
      liked: !alreadyLiked,
      likesCount: updated.likes.length,
    });
  } catch (error) {
    Logger.error("TOGGLE_LIKE_ERROR", { message: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// PATCH /api/pgs/:id/likes-enabled — admin enables/disables likes for a PG
export const setLikesEnabled = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid PG ID" });
    }
    const { enabled } = req.body;
    const pg = await PG.findByIdAndUpdate(
      id,
      { likesEnabled: Boolean(enabled) },
      { new: true }
    ).select("likesEnabled likes").lean();
    if (!pg) return res.status(404).json({ success: false, message: "PG not found" });
    return res.status(200).json({
      success: true,
      data: { likesEnabled: pg.likesEnabled, likesCount: pg.likes.length },
    });
  } catch (error) {
    Logger.error("SET_LIKES_ENABLED_ERROR", { message: error.message });
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

    const { description, pricing, amenities, foodType, separateKitchenAvailable } = req.body;
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

    if (foodType !== undefined) {
      if (!["veg", "non-veg", "both", null].includes(foodType)) {
        return res.status(400).json({ success: false, message: "foodType must be 'veg', 'non-veg', 'both', or null" });
      }
      update.foodType = foodType;
    }

    if (separateKitchenAvailable !== undefined) {
      update.separateKitchenAvailable = Boolean(separateKitchenAvailable);
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
