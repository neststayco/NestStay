import mongoose from "mongoose";

const pgSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, unique: true, required: true },
    description: { type: String, default: "" },
    location: {
      country: String,
      state: String,
      city: { type: String, index: true },
      area: { type: String, index: true },
      address: String,
      coordinates: { lat: Number, lng: Number },
    },
    pricing: { rent: Number, deposit: Number, maintenance: Number },
    accommodation: {
      gender: { type: String, enum: ['male', 'female', 'other'] },
      roomTypes: [String],
      totalCapacity: Number,
    },
    foodType: { type: String, enum: ['veg', 'non-veg', 'both'], default: null },
    amenities: [String],
    images: [
      {
        url: { type: String, required: true },
        fileId: { type: String },
      }
    ],
    video: {
      url: { type: String },
      fileId: { type: String },
    },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    likesEnabled: { type: Boolean, default: true },
    separateKitchenAvailable: { type: Boolean, default: false },
    owner: {
      name: String,
      phone: String,
      email: String,
      isVerified: Boolean,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    isVerified: { type: Boolean, default: false },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    verificationStatus: {
      type: String,
      enum: ["draft", "pending_review", "approved", "rejected", "suspended"],
      default: "approved",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    uniqueViewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

pgSchema.index({ "location.city": 1, "location.area": 1 });
pgSchema.index({ "pricing.rent": 1 });
pgSchema.index({ status: 1 });
pgSchema.index({ name: "text", description: "text", amenities: "text", "location.area": "text" }, { name: "pg_text_search" });

export default mongoose.model("PG", pgSchema);
