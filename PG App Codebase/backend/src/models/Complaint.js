import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema(
  {
    pgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PG",
      required: [true, "PG ID is required"],
      index: true
    },

    pgSnapshot: {
      name: String,
      city: String,
      area: String,
      ownerName: String
    },

    isVerifiedResident: {
      type: Boolean,
      default: false
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    type: {
      type: String,
      required: [true, "Complaint type is required"],
      enum: {
        values: ["food", "cleanliness", "security", "management", "other"],
        message: "Invalid complaint type"
      }
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [5, "Description too short"]
    },

    image: {
      type: String,
      default: null
    },

    isAnonymous: {
      type: Boolean,
      default: false
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true
    },

    adminRemark: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// 🔥 Optional: prevent spam (same user spamming same PG quickly)
complaintSchema.index({ pgId: 1, createdBy: 1, createdAt: -1 });

// Performance index for frequent queries
complaintSchema.index({ pgId: 1, status: 1 });

export default mongoose.model("Complaint", complaintSchema);