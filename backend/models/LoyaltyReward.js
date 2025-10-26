// models/LoyaltyReward.js
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const loyaltyRewardSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true 
    },
    
    // Criteria tracking
    purchaseCount: { 
      type: Number, 
      default: 0,
      min: 0 
    },
    totalSpent: { 
      type: Number, 
      default: 0,
      min: 0 
    },
    points: {
      type: Number,
      default: 0,
    },
    tier: {
      type: String,
      enum: ["Sprout", "Seedling", "Cultivator", "Bloom", "Harvester", ""],
      default: "",
    },
    pointsHistory: [{
      points: Number,
      source: String,
      orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order"
      },
      rewardName: String, // For reward redemptions
      used: { type: Boolean, default: false }, // Track if reward has been used
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    
    // Card status
    isEligible: { 
      type: Boolean, 
      default: false 
    },
    cardIssued: { 
      type: Boolean, 
      default: false 
    },
    cardIssuedDate: { 
      type: Date 
    },
    
    // Card details
    cardId: { 
      type: String 
    },
    cardType: { 
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum'],
      default: 'bronze'
    },
    
    // Benefits
    discountAmount: { 
      type: Number, 
      default: 0,
      min: 0
    },
    
    // Expiration
    expiryDate: { 
      type: Date 
    },
    isActive: { 
      type: Boolean, 
      default: true 
    }
  },
  { timestamps: true }
);

// Define criteria for loyalty card eligibility
loyaltyRewardSchema.statics.CRITERIA = {
  PURCHASE_COUNT: 5,
  TOTAL_SPENT: 5000
};

// Check if user is eligible for loyalty card
loyaltyRewardSchema.methods.checkEligibility = function() {
  const criteria = this.constructor.CRITERIA;
  
  if (this.purchaseCount >= criteria.PURCHASE_COUNT || 
      this.totalSpent >= criteria.TOTAL_SPENT) {
    this.isEligible = true;
  }
  
  return this.isEligible;
};

// Issue a loyalty card to eligible user
loyaltyRewardSchema.methods.issueCard = function() {
  if (!this.isEligible) {
    return false;
  }
  
  if (!this.cardIssued) {
    this.cardIssued = true;
    this.cardIssuedDate = new Date();
    this.cardId = `LOYAL-${this.userId.slice(-6)}-${Date.now().toString().slice(-6)}`;
    
    // Set expiry date to 1 year from now
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    this.expiryDate = expiryDate;
  }
  
  return true;
};

const LoyaltyReward = mongoose.model("LoyaltyReward", loyaltyRewardSchema);

export default LoyaltyReward;