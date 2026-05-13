import mongoose from "mongoose";
import PGResidency from "../src/models/pgResidency.js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

await mongoose.connect(process.env.MONGO_URI);

const verifiedResult = await PGResidency.updateMany(
  { status: "verified" },
  { $set: { status: "admitted" } }
);
console.log(`Migrated ${verifiedResult.modifiedCount} 'verified' → 'admitted'`);

// Rename proofDocument to moveInNote for old documents that still have it
const renameResult = await PGResidency.updateMany(
  { proofDocument: { $exists: true } },
  { $rename: { proofDocument: "moveInNote" } }
);
console.log(`Renamed proofDocument → moveInNote on ${renameResult.modifiedCount} documents`);

console.log("Migration complete");
await mongoose.disconnect();
