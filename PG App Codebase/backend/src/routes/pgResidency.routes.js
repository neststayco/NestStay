import express from "express";

const router = express.Router();

// Deprecated: replaced by /api/admissions. Returns 410 for stale clients.
router.all('/*path', (req, res) => {
  res.status(410).json({
    status: 'gone',
    message: 'This endpoint has been deprecated and is no longer available.',
    deprecatedAt: '2025-01-01',
  });
});

export default router;
