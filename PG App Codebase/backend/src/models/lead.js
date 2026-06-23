import mongoose from "mongoose";

const leadSchema = new mongoose.Schema({
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  pgId:         { type: mongoose.Schema.Types.ObjectId, ref: "PG",   required: true },
  ownerId:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  firstViewedAt:{ type: Date, default: Date.now },
  lastViewedAt: { type: Date, default: Date.now },
  visitCount:   { type: Number, default: 1 },
}, { timestamps: true });

leadSchema.index({ userId: 1, pgId: 1 }, { unique: true });
leadSchema.index({ ownerId: 1, lastViewedAt: -1 });

export default mongoose.model("Lead", leadSchema);
