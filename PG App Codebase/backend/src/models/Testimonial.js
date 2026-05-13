import mongoose from "mongoose";

const testimonialSchema = new mongoose.Schema(
  {
    pgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PG",
      required: true,
      index: true,
    },
    pgSnapshot: {
      name: String,
      city: String,
      area: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: [10, "Testimonial too short"],
      maxlength: [1000, "Testimonial too long"],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    isVerifiedResident: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    isVisible: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

testimonialSchema.index({ pgId: 1, status: 1, isVisible: 1 });
testimonialSchema.index({ pgId: 1, createdBy: 1 }, { unique: true });

export default mongoose.model("Testimonial", testimonialSchema);
