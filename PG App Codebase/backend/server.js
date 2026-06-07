import "dotenv/config";
import app from "./app.js";
import connectDB from "./src/config/db.js";
import { runEscalationJob } from "./src/jobs/escalation.job.js";

const REQUIRED_ENV = ["MONGO_URI", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"];

for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`FATAL: ${key} is not set. Refusing to start.`);
    process.exit(1);
  }
}

connectDB().then(() => {
  runEscalationJob();
  setInterval(runEscalationJob, 60 * 60 * 1000);
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
