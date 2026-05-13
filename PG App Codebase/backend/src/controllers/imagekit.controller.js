import imagekit from "../services/imagekit.service.js";
import Logger from "../services/logger.service.js";

// GET /api/imagekit/auth — returns signed upload params for frontend direct upload
export const getImageKitAuth = (req, res) => {
  try {
    const auth = imagekit.getAuthenticationParameters();
    return res.status(200).json({ success: true, ...auth });
  } catch (error) {
    Logger.error("IMAGEKIT_AUTH_ERROR", { error: error.message });
    return res.status(500).json({ success: false, message: "Failed to generate upload credentials" });
  }
};
