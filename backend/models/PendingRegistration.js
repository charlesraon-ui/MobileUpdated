import mongoose from "mongoose";

const pendingSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  name: { type: String, required: true },
  address: { type: String },
  passwordHash: { type: String, required: true },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

const PendingRegistration = mongoose.model("PendingRegistration", pendingSchema);
export default PendingRegistration;