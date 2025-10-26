// models/LoyaltyTier.js
import mongoose from "mongoose";

const loyaltyTierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      enum: ["Sprout", "Seedling", "Cultivator", "Bloom", "Harvester"],
    },
    pointThreshold: {
      type: Number,
      required: true,
    },
    discountAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    benefits: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      required: true,
    }
  },
  { timestamps: true }
);

const LoyaltyTier = mongoose.model("LoyaltyTier", loyaltyTierSchema);

export default LoyaltyTier;