import Lead from "../models/lead.js";
import PG from "../models/pg.js";
import Logger from "../services/logger.service.js";

// POST /api/leads/view — authenticated user records interest after 5s on PG detail page
export const recordView = async (req, res) => {
  try {
    const { pgId } = req.body;
    if (!pgId) {
      return res.status(400).json({ success: false, message: "pgId is required" });
    }

    const pg = await PG.findById(pgId).select("ownerId status").lean();
    if (!pg || pg.status !== "active") {
      return res.status(404).json({ success: false, message: "PG not found" });
    }

    const existing = await Lead.findOne({ userId: req.user.id, pgId });

    if (existing) {
      await Lead.findByIdAndUpdate(existing._id, {
        $inc: { visitCount: 1 },
        $set: { lastViewedAt: new Date() },
      });
    } else {
      await Lead.create({
        userId: req.user.id,
        pgId,
        ownerId: pg.ownerId,
        firstViewedAt: new Date(),
        lastViewedAt: new Date(),
        visitCount: 1,
      });
      await PG.findByIdAndUpdate(pgId, { $inc: { uniqueViewCount: 1 } });
      Logger.event("lead.created", { userId: req.user.id, pgId });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    // Swallow duplicate key race conditions silently
    if (error.code === 11000) return res.status(200).json({ success: true });
    Logger.error("RECORD_VIEW_ERROR", { message: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// GET /api/leads/owner — pg_owner fetches their interested leads
export const getOwnerLeads = async (req, res) => {
  try {
    const leads = await Lead.find({ ownerId: req.user.id })
      .populate("userId", "name phoneNumber email")
      .populate("pgId", "name")
      .sort({ lastViewedAt: -1 })
      .lean();
    return res.status(200).json({ success: true, data: leads });
  } catch (error) {
    Logger.error("GET_OWNER_LEADS_ERROR", { message: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
