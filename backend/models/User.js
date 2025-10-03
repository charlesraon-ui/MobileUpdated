// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "admin", "driver"], default: "user" },
    pushToken: { type: String, default: null },
  },
  { timestamps: true }
);

userSchema.set("toJSON", {
  transform(_doc, ret) {
    delete ret.passwordHash;
    return ret;
  },
});

export default mongoose.models.User || mongoose.model("User", userSchema);

