import mongoose from "mongoose";

const termsSchema = new mongoose.Schema({
  content: { type: String, required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

export default mongoose.model("Terms", termsSchema);
