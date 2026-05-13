import eventEmitter from "./eventEmitter.js";
import NotificationService from "../services/notification.service.js";
import Logger from "../services/logger.service.js";

/**
 * Initializes all system-wide event listeners
 */
export const initializeEventHandlers = () => {
  // Notify PG owner when a new complaint is submitted by a verified resident
  eventEmitter.on("complaint.new", async (complaint) => {
    try {
      Logger.event("complaint.new", { complaintId: complaint._id });
      await NotificationService.notifyPGOwner(complaint);
    } catch (err) {
      Logger.error("Action handler 'complaint.new' failed", { error: err.message, complaintId: complaint._id });
    }
  });

  console.log("✅ Event Listeners securely initialized");
};
