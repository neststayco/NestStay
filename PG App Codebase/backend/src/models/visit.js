import mongoose from "mongoose";

const visitSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  pgId:   { type: mongoose.Schema.Types.ObjectId, ref: "PG",   required: true },
  ownerId:{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  visitDate: { type: String, required: true },
  visitTime: { type: String, required: true },
}, { timestamps: true });

visitSchema.index({ ownerId: 1, createdAt: -1 });

export default mongoose.model("Visit", visitSchema);
