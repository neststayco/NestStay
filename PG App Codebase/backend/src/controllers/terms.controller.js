import Terms from "../models/terms.js";
import Logger from "../services/logger.service.js";

export const getTerms = async (req, res) => {
  try {
    const terms = await Terms.findOne().sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, data: terms || null });
  } catch (error) {
    Logger.error("GET_TERMS_ERROR", { message: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const updateTerms = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || typeof content !== "string" || content.trim().length < 10) {
      return res.status(400).json({ success: false, message: "content must be at least 10 characters" });
    }
    const terms = await Terms.create({ content: content.trim(), updatedBy: req.user.id });
    Logger.event("terms.updated", { adminId: req.user.id });
    return res.status(200).json({ success: true, message: "Terms updated", data: terms });
  } catch (error) {
    Logger.error("UPDATE_TERMS_ERROR", { message: error.message });
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
