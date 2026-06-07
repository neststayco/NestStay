import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  hashedOtp: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["REGISTER", "FORGOT_PASSWORD"],
    required: true,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Fast lookup by email + type
otpSchema.index({ email: 1, type: 1 });

// MongoDB auto-deletes expired documents (TTL index on expiresAt)
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("OTP", otpSchema);
