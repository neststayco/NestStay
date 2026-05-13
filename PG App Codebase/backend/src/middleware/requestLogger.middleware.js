import Logger from "../services/logger.service.js";

/**
 * Middleware to log HTTP requests
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const { method, originalUrl } = req;
    const { statusCode } = res;

    const logMetadata = {
      method,
      url: originalUrl,
      status: statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    };

    if (statusCode >= 500) {
      Logger.error(`HTTP ${method} ${originalUrl}`, logMetadata);
    } else if (statusCode >= 400) {
      Logger.warn(`HTTP ${method} ${originalUrl}`, logMetadata);
    } else {
      Logger.info(`HTTP ${method} ${originalUrl}`, logMetadata);
    }
  });

  next();
};

export default requestLogger;
