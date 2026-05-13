import mongoose from "mongoose";

const pgResidencySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    pgId:   { type: mongoose.Schema.Types.ObjectId, ref: "PG",   required: true },

    status: {
      type: String,
      enum: ["pending", "admitted", "rejected"],
      default: "pending",
    },

    // Who approved/rejected: "owner" | "admin"
    processedBy: {
      role:   { type: String, enum: ["owner", "admin"], default: null },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    },

    // Move-in note submitted by user (replaces old proofDocument URL)
    moveInNote: { type: String, trim: true, default: "" },

    // Set when owner hasn't acted and request escalates to software admin
    escalatedAt: { type: Date, default: null },

    // Set when admission is revoked (user moves out)
    revokedAt: { type: Date, default: null },
    revokedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

pgResidencySchema.index({ userId: 1, pgId: 1 });
pgResidencySchema.index({ pgId: 1, status: 1 });
pgResidencySchema.index({ userId: 1, status: 1 });

const PGResidency = mongoose.model("PGResidency", pgResidencySchema);
export default PGResidency;
