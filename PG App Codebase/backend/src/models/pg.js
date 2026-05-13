import mongoose from "mongoose";

const pgSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, unique: true, required: true },
    description: { type: String, required: true },
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
      gender: String,
      roomTypes: [String],
      totalCapacity: Number,
    },
    foodType: { type: String, enum: ['veg', 'non-veg', 'both'], default: null },
    amenities: [String],
    images: [String],
    owner: {
      name: String,
      phone: String,
      email: String,
      isVerified: Boolean,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Search indexes
pgSchema.index({ "location.city": 1, "location.area": 1 });
pgSchema.index({ "pricing.rent": 1 });
pgSchema.index({ isActive: 1 });

export default mongoose.model("PG", pgSchema);
