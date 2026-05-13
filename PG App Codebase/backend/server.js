import "dotenv/config";
import app from "./app.js";
import connectDB from "./src/config/db.js";
import { runEscalationJob } from "./src/jobs/escalation.job.js";


if (!process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET is not set. Refusing to start.");
  process.exit(1);
}

connectDB().then(() => {
  // Run escalation job on startup and every hour
  runEscalationJob();
  setInterval(runEscalationJob, 60 * 60 * 1000);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
