import mongoose from "mongoose";

const pgResidencySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    pgId:   { type: mongoose.Schema.Types.ObjectId, ref: "PG",   required: true },

    // Admission lifecycle — never reverts once approved
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "withdrawn"],
      default: "pending",
    },

    // Residency lifecycle — independent from admission status
    residentStatus: {
      type: String,
      enum: ["active", "removed", null],
      default: null,
    },

    residentRemovedAt: { type: Date, default: null },

    // Who processed the admission: "owner" | "admin"
    processedBy: {
      role:   { type: String, enum: ["owner", "admin"], default: null },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    },

    moveInNote: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

pgResidencySchema.index({ userId: 1, pgId: 1 });
pgResidencySchema.index({ pgId: 1, status: 1 });
pgResidencySchema.index({ userId: 1, status: 1 });
pgResidencySchema.index({ pgId: 1, residentStatus: 1 });

const PGResidency = mongoose.model("PGResidency", pgResidencySchema);
export default PGResidency;
