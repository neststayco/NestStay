import Visit from "../models/visit.js";
import PG from "../models/pg.js";
import Logger from "../services/logger.service.js";

export const createVisit = async (req, res) => {
  try {
    const { pgId, visitDate, visitTime } = req.body;
    if (!pgId || !visitDate || !visitTime) {
      return res.status(400).json({ success: false, message: "pgId, visitDate, and visitTime are required" });
    }
    const pg = await PG.findById(pgId).select("status ownerId").lean();
    if (!pg || pg.status !== "active") {
      return res.status(404).json({ success: false, message: "PG not found" });
    }
    if (!pg.ownerId) {
      return res.status(400).json({ success: false, message: "This PG has no owner assigned" });
    }
    const visit = await Visit.create({
      userId: req.user.id,
      pgId,
      ownerId: pg.ownerId,
      visitDate,
      visitTime,
    });
    Logger.event("visit.created", { visitId: visit._id, pgId });
    return res.status(201).json({ success: true, message: "Visit request submitted", data: visit });
  } catch (error) {
    Logger.error("CREATE_VISIT_ERROR", { message: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getOwnerVisits = async (req, res) => {
  try {
    const visits = await Visit.find({ ownerId: req.user.id })
      .populate("userId", "name phoneNumber email")
      .populate("pgId", "name")
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ success: true, data: visits });
  } catch (error) {
    Logger.error("GET_OWNER_VISITS_ERROR", { message: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
