import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true },
  // New unified field used by authController
  passwordHash: { type: String, required: true },
  // Optional legacy field for backward compatibility (not required)
  password: { type: String },
  address: { type: String },
  role: { type: String, enum: ["admin", "superadmin", "user"], default: "user" },

  // Profile
  avatarUrl: { type: String },

  // Loyalty fields
  loyaltyPoints: { type: Number, default: 0 },
  loyaltyTier: {
    type: String,
    enum: ["Sprout", "Seedling", "Cultivator", "Bloom", "Harvester"],
    default: "Sprout",
  },
  loyaltyHistory: [
    {
      action: { type: String }, // "earned" | "redeemed"
      points: { type: Number },
      date: { type: Date, default: Date.now },
    },
  ],
});

const User = mongoose.model("User", userSchema)

export default User;
