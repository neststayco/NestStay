import Testimonial from "../models/Testimonial.js";
import PG from "../models/pg.js";
import mongoose from "mongoose";
import Logger from "../services/logger.service.js";

// POST /api/testimonials — verified resident submits a testimonial
export const createTestimonial = async (req, res) => {
  try {
    const { pgId, content, rating } = req.body;

    if (!pgId || !content || !rating) {
      return res.status(400).json({ success: false, message: "pgId, content and rating are required" });
    }

    if (!mongoose.isValidObjectId(pgId)) {
      return res.status(400).json({ success: false, message: "Invalid pgId format" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
    }

    const pg = await PG.findById(pgId).lean();
    if (!pg) {
      return res.status(404).json({ success: false, message: "PG not found" });
    }

    // One testimonial per user per PG (enforced by unique index too)
    const existing = await Testimonial.findOne({ pgId, createdBy: req.user.id }).lean();
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "You have already submitted a testimonial for this PG",
      });
    }

    const pgSnapshot = { name: pg.name, city: pg.location?.city, area: pg.location?.area };

    const testimonial = await Testimonial.create({
      pgId,
      pgSnapshot,
      createdBy: req.user.id,
      content,
      rating: Number(rating),
      isVerifiedResident: true,
    });

    const populatedTestimonial = await Testimonial.findById(testimonial._id)
      .populate("pgId", "name location images slug")
      .populate("createdBy", "name")
      .lean();

    Logger.event("testimonial.created", { testimonialId: testimonial._id, pgId });
    return res.status(201).json({ success: true, message: "Testimonial submitted for owner review", data: populatedTestimonial });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "You have already submitted a testimonial for this PG" });
    }
    Logger.error("CREATE_TESTIMONIAL_ERROR", { error: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// GET /api/testimonials/featured — public, top-rated approved+visible across all PGs (for landing page)
export const getFeaturedTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ status: "approved", isVisible: true })
      .populate("createdBy", "name")
      .sort({ rating: -1, createdAt: -1 })
      .limit(6)
      .lean();

    return res.status(200).json({ success: true, data: testimonials });
  } catch (error) {
    Logger.error("GET_FEATURED_TESTIMONIALS_ERROR", { error: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// GET /api/testimonials?pgId= — public, returns approved + visible testimonials
export const getPublicTestimonials = async (req, res) => {
  try {
    const { pgId } = req.query;

    if (!pgId || !mongoose.isValidObjectId(pgId)) {
      return res.status(400).json({ success: false, message: "Valid pgId is required" });
    }

    const testimonials = await Testimonial.find({ pgId, status: "approved", isVisible: true })
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, data: testimonials });
  } catch (error) {
    Logger.error("GET_PUBLIC_TESTIMONIALS_ERROR", { error: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// GET /api/testimonials/mine — user sees their own testimonial(s)
export const getMyTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ createdBy: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, data: testimonials });
  } catch (error) {
    Logger.error("GET_MY_TESTIMONIALS_ERROR", { error: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// GET /api/testimonials/pg — pg_owner sees all testimonials for their PG
export const getOwnerTestimonials = async (req, res) => {
  try {
    if (!req.user.pgId) {
      return res.status(400).json({ success: false, message: "No PG linked to this owner account" });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const filter = { pgId: req.user.pgId };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [testimonials, totalItems] = await Promise.all([
      Testimonial.find(filter)
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Testimonial.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: testimonials,
      pagination: {
        totalItems,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalItems / parseInt(limit)),
      },
    });
  } catch (error) {
    Logger.error("GET_OWNER_TESTIMONIALS_ERROR", { error: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// PATCH /api/testimonials/:id — pg_owner updates status and/or visibility
export const updateTestimonial = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid testimonial ID" });
    }

    const testimonial = await Testimonial.findById(id);
    if (!testimonial) {
      return res.status(404).json({ success: false, message: "Testimonial not found" });
    }

    // pg_owner can only act on their own PG's testimonials
    if (req.user.role === "pg_owner") {
      if (!req.user.pgId || !testimonial.pgId.equals(req.user.pgId)) {
        return res.status(403).json({ success: false, message: "Not authorized for this testimonial" });
      }
    }

    const { status, isVisible } = req.body;

    if (status !== undefined) {
      const validStatuses = ["pending", "approved", "rejected"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status" });
      }
      testimonial.status = status;
      // Auto-hide if rejected
      if (status === "rejected") testimonial.isVisible = false;
    }

    if (isVisible !== undefined) {
      // Can only make visible if approved
      if (isVisible && testimonial.status !== "approved") {
        return res.status(400).json({ success: false, message: "Only approved testimonials can be made visible" });
      }
      testimonial.isVisible = Boolean(isVisible);
    }

    await testimonial.save();
    return res.status(200).json({ success: true, message: "Testimonial updated", data: testimonial });
  } catch (error) {
    Logger.error("UPDATE_TESTIMONIAL_ERROR", { error: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// GET /api/testimonials/admin — admin sees all testimonials across all PGs
export const getAdminTestimonials = async (req, res) => {
  try {
    const { pgId, status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (pgId && mongoose.isValidObjectId(pgId)) filter.pgId = pgId;
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [testimonials, totalItems] = await Promise.all([
      Testimonial.find(filter)
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Testimonial.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: testimonials,
      pagination: { totalItems, currentPage: parseInt(page), totalPages: Math.ceil(totalItems / parseInt(limit)) },
    });
  } catch (error) {
    Logger.error("GET_ADMIN_TESTIMONIALS_ERROR", { error: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
