import PGResidency from "../models/pgResidency.js";
import Logger from "../services/logger.service.js";
import NotificationService from "../services/notification.service.js";

export async function runEscalationJob() {
  try {
    const thresholdHours = parseInt(process.env.ESCALATION_THRESHOLD_HOURS, 10) || 120;
    const thresholdDate = new Date(Date.now() - thresholdHours * 60 * 60 * 1000);

    const toEscalate = await PGResidency.find(
      { status: "pending", escalatedAt: null, createdAt: { $lte: thresholdDate } },
      { _id: 1, pgId: 1, userId: 1, createdAt: 1 }
    ).lean();

    if (toEscalate.length === 0) {
      console.log("[EscalationJob] No pending admissions require escalation.");
      return;
    }

    await PGResidency.updateMany(
      { _id: { $in: toEscalate.map(r => r._id) } },
      { $set: { escalatedAt: new Date() } }
    );

    for (const r of toEscalate) {
      const ageHours = Math.round((Date.now() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60));
      console.log(`[EscalationJob] Escalated admission ${r._id} | PG: ${r.pgId} | User: ${r.userId} | Age: ${ageHours}h`);
      await NotificationService.notifyAdminEscalation(r);
    }

    console.log(`[EscalationJob] Total escalated: ${toEscalate.length}`);
  } catch (error) {
    Logger.error("ESCALATION_JOB_ERROR", { error: error.message });
  }
}
