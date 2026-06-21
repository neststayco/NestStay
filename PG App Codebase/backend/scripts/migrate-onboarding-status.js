import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../src/models/user.js";

dotenv.config();

const isDryRun = process.argv.includes("--dry-run");

async function run() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const filter = { role: "pg_owner", onboardingStatus: "not_started" };
  const matchedCount = await User.countDocuments(filter);
  let modifiedCount = 0;

  if (!isDryRun) {
    const result = await User.updateMany(
      filter,
      { $set: { onboardingStatus: "legacy" } }
    );
    modifiedCount = result.modifiedCount ?? result.nModified ?? 0;
  }

  console.log(
    JSON.stringify(
      {
        dryRun: isDryRun,
        matchedCount,
        modifiedCount,
      },
      null,
      2
    )
  );
}

run()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Migration failed:", error.message);
    try {
      await mongoose.disconnect();
    } catch {
      // ignore disconnect errors during failure handling
    }
    process.exit(1);
  });
