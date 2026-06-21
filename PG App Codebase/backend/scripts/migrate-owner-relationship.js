import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

import User from "../src/models/user.js";
import PG from "../src/models/pg.js";

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const owners = await User.find({ role: "pg_owner", pgId: { $ne: null } }).lean();
  console.log(`Found ${owners.length} pg_owner accounts with pgId`);

  let updated = 0;
  for (const owner of owners) {
    const result = await PG.findByIdAndUpdate(
      owner.pgId,
      { $set: { ownerId: owner._id } },
      { new: true }
    );
    if (result) {
      updated++;
      console.log(`  PG "${result.name}" → ownerId set to ${owner._id}`);
    }
  }

  console.log(`Migration complete. Updated ${updated} PGs.`);
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
