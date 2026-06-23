import multer from "multer";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

const storage = multer.memoryStorage();

const mediaUpload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "images") {
      if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        return cb(new Error(`Invalid image type "${file.mimetype}". Only JPG, PNG, WEBP allowed.`), false);
      }
    } else if (file.fieldname === "video") {
      if (!ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
        return cb(new Error(`Invalid video type. Only MP4, MOV, WebM allowed.`), false);
      }
    }
    cb(null, true);
  },
});

const _uploadMedia = mediaUpload.fields([
  { name: "images", maxCount: 10 },
  { name: "video", maxCount: 1 },
]);

export function uploadMedia(req, res, next) {
  _uploadMedia(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ success: false, message: "File too large." });
      }
      if (err.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({ success: false, message: "Maximum 10 images allowed." });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    return res.status(400).json({ success: false, message: err.message });
  });
}

// kept for backward compatibility
const _uploadArray = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new Error(`Invalid file type "${file.mimetype}". Only JPG, PNG, WEBP allowed.`), false);
  },
}).array("images", 10);

export function uploadImages(req, res, next) {
  _uploadArray(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ success: false, message: "File too large. Maximum 5 MB per image." });
      }
      if (err.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({ success: false, message: "Maximum 10 images allowed." });
      }
      return res.status(400).json({ success: false, message: err.message });
    }
    return res.status(400).json({ success: false, message: err.message });
  });
}
