/**
 * One-time migration — run after deploying new auth system.
 *
 * Sets isVerified=true and isActive=true on all pre-existing users so they
 * can log in without going through the new OTP registration flow.
 *
 * Usage: node scripts/migrateUsers.js
 */
import "dotenv/config";
import mongoose from "mongoose";
import User from "../src/models/user.js";

const run = async () => {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI not set");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const result = await User.updateMany(
    { isVerified: { $exists: false } },
    {
      $set: {
        isVerified: true,
        isActive: true,
        loginAttempts: 0,
        refreshToken: null,
      },
    }
  );

  console.log(`Migration complete. Modified: ${result.modifiedCount} users`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
