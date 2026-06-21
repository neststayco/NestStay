import PG from "../models/pg.js";
import User from "../models/user.js";
import mongoose from "mongoose";
import Logger from "../services/logger.service.js";
import { runInTransaction } from "../utils/transaction.js";

const ALLOWED_PATCH_FIELDS = new Set([
  "name",
  "description",
  "location",
  "pricing",
  "accommodation",
  "amenities",
  "foodType",
  "gender",
]);

const ensurePlainObject = (value) => (
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value)
);

const rejectUnknownFields = (body, allowedFields) => {
  const keys = Object.keys(body || {});
  const unknown = keys.filter((key) => !allowedFields.has(key));
  return unknown;
};

const validateNestedObject = (value, allowedKeys, label) => {
  if (!ensurePlainObject(value)) {
    return `${label} must be an object`;
  }

  const unknown = Object.keys(value).filter((key) => !allowedKeys.includes(key));
  if (unknown.length > 0) {
    return `Unsupported ${label} field(s): ${unknown.join(", ")}`;
  }

  return null;
};

// POST /api/onboarding/create-pg
export const createOnboardingPG = async (req, res) => {
  try {
    if (req.user.pgId) {
      return res.status(400).json({ success: false, message: "You already have a PG linked to your account" });
    }

    const existing = await PG.findOne({
      ownerId: req.user.id,
      verificationStatus: { $in: ["draft", "pending_review", "approved"] },
    }).lean();

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Owner already has an active listing",
      });
    }

    const { name, description } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ success: false, message: "name is required" });
    }

    const suffix = Math.floor(1000 + Math.random() * 9000);
    const slug = `${name.trim().toLowerCase().replace(/\s+/g, "-")}-${suffix}`;

    const pg = await runInTransaction(async (session) => {
      const [createdPG] = await PG.create([{
        name: name.trim(),
        slug,
        description: description?.trim() || "",
        verificationStatus: "draft",
        ownerId: req.user.id,
        createdBy: req.user.id,
        isActive: false,
      }], { session });

      const updatedOwner = await User.findOneAndUpdate(
        { _id: req.user.id, pgId: null },
        { pgId: createdPG._id },
        { new: true, session }
      ).lean();

      if (!updatedOwner) {
        throw new Error("OWNER_ALREADY_LINKED");
      }

      return createdPG;
    });

    Logger.event("onboarding.pg.created", { pgId: pg._id, ownerId: req.user.id });

    return res.status(201).json({ success: true, message: "PG created successfully", data: pg });
  } catch (error) {
    if (error.message === "OWNER_ALREADY_LINKED") {
      return res.status(400).json({ success: false, message: "You already have a PG linked to your account" });
    }
    Logger.error("CREATE_ONBOARDING_PG_ERROR", { message: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// PATCH /api/onboarding/:id
export const updateOnboardingPG = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid PG ID" });
    }

    const pg = await PG.findById(id);

    if (!pg) {
      return res.status(404).json({ success: false, message: "PG not found" });
    }

    if (!pg.ownerId.equals(req.user.id)) {
      return res.status(403).json({ success: false, message: "You are not authorised to edit this PG" });
    }

    if (!["draft", "rejected"].includes(pg.verificationStatus)) {
      return res.status(400).json({
        success: false,
        message: "PG can only be edited when it is in draft or rejected status",
      });
    }

    if (!ensurePlainObject(req.body)) {
      return res.status(400).json({ success: false, message: "Invalid request body" });
    }

    const unknownFields = rejectUnknownFields(req.body, ALLOWED_PATCH_FIELDS);
    if (unknownFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Unsupported field(s): ${unknownFields.join(", ")}`,
      });
    }

    const { name, description, location, pricing, accommodation, amenities, foodType, gender } = req.body;
    const update = {};

    if (name !== undefined) update.name = name;
    if (description !== undefined) update.description = description;
    if (location !== undefined) {
      const locationError = validateNestedObject(location, [
        "country",
        "state",
        "city",
        "area",
        "address",
        "coordinates",
      ], "location");
      if (locationError) {
        return res.status(400).json({ success: false, message: locationError });
      }
      if (location.coordinates !== undefined) {
        const coordinateError = validateNestedObject(location.coordinates, ["lat", "lng"], "location.coordinates");
        if (coordinateError) {
          return res.status(400).json({ success: false, message: coordinateError });
        }
      }
      update.location = location;
    }
    if (pricing !== undefined) {
      const pricingError = validateNestedObject(pricing, ["rent", "deposit", "maintenance"], "pricing");
      if (pricingError) {
        return res.status(400).json({ success: false, message: pricingError });
      }
      update.pricing = pricing;
    }
    if (accommodation !== undefined) {
      const accommodationError = validateNestedObject(accommodation, ["gender", "roomTypes", "totalCapacity"], "accommodation");
      if (accommodationError) {
        return res.status(400).json({ success: false, message: accommodationError });
      }
      update.accommodation = accommodation;
    }
    if (amenities !== undefined) update.amenities = amenities;
    if (foodType !== undefined) update.foodType = foodType;
    if (gender !== undefined) {
      update.accommodation = { ...(update.accommodation || pg.accommodation?.toObject?.() || pg.accommodation || {}), gender };
    }

    const updated = await PG.findByIdAndUpdate(id, update, { new: true, runValidators: true });

    Logger.event("onboarding.pg.updated", { pgId: id, ownerId: req.user.id });

    return res.status(200).json({ success: true, message: "PG updated successfully", data: updated });
  } catch (error) {
    Logger.error("UPDATE_ONBOARDING_PG_ERROR", { message: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// GET /api/onboarding/my-pg
export const getMyOnboardingPG = async (req, res) => {
  try {
    const pg = await PG.findOne({ ownerId: req.user.id }).lean();

    if (!pg) {
      return res.status(404).json({ success: false, message: "No PG found for your account" });
    }

    return res.status(200).json({ success: true, message: "PG fetched successfully", data: pg });
  } catch (error) {
    Logger.error("GET_MY_ONBOARDING_PG_ERROR", { message: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// POST /api/onboarding/submit
export const submitOnboardingPG = async (req, res) => {
  try {
    const pg = await PG.findOne({ ownerId: req.user.id });

    if (!pg) {
      return res.status(404).json({ success: false, message: "No PG found for your account" });
    }

    if (!["draft", "rejected"].includes(pg.verificationStatus)) {
      return res.status(400).json({
        success: false,
        message: "PG can only be submitted for review when it is in draft or rejected status",
      });
    }

    if (!pg.name) {
      return res.status(400).json({ success: false, message: "PG name is required before submitting" });
    }

    if (!pg.description || pg.description.trim().length < 20) {
      return res.status(400).json({
        success: false,
        message: "A description of at least 20 characters is required before submitting",
      });
    }

    if (!pg.location?.city || !pg.location?.area) {
      return res.status(400).json({
        success: false,
        message: "location.city and location.area are required before submitting",
      });
    }

    if (!pg.pricing?.rent || pg.pricing.rent <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid rent (greater than 0) is required before submitting",
      });
    }

    await runInTransaction(async (session) => {
      await PG.findByIdAndUpdate(
        pg._id,
        { verificationStatus: "pending_review" },
        { session }
      );
      await User.findByIdAndUpdate(
        req.user.id,
        { onboardingStatus: "pending_review" },
        { session }
      );
    });

    Logger.event("onboarding.pg.submitted", { pgId: pg._id, ownerId: req.user.id });

    return res.status(200).json({ success: true, message: "PG submitted for review" });
  } catch (error) {
    Logger.error("SUBMIT_ONBOARDING_PG_ERROR", { message: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
