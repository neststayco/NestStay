import mongoose from "mongoose";
import PGResidency from "../src/models/pgResidency.js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

await mongoose.connect(process.env.MONGO_URI);
console.log("Connected to:", process.env.MONGO_URI);

const before = await PGResidency.countDocuments({ status: "admitted" });
console.log(`Found ${before} documents with status:"admitted"`);

const result = await PGResidency.updateMany(
  { status: "admitted" },
  { $set: { status: "approved", residentStatus: "active" } }
);

console.log(`Migrated ${result.modifiedCount} records: status:"admitted" → status:"approved" + residentStatus:"active"`);

const after = await PGResidency.countDocuments({ status: "approved", residentStatus: "active" });
console.log(`Verified: ${after} documents now have status:"approved" + residentStatus:"active"`);

console.log("Migration complete");
await mongoose.disconnect();
