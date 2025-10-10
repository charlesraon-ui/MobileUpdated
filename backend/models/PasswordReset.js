import mongoose from "mongoose";

const resetSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false },
}, { timestamps: true });

const PasswordReset = mongoose.model("PasswordReset", resetSchema);
export default PasswordReset;