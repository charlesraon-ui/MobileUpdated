import mongoose from "mongoose";

const PromotionSchema = new mongoose.Schema(
  {
    code: { 
      type: String, 
      required: true, 
      unique: true, 
      uppercase: true,
      trim: true,
      maxlength: 20
    },
    name: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: 100
    },
    type: { 
      type: String, 
      enum: ["Percentage", "Fixed Amount", "Free Shipping"], 
      required: true 
    },
    value: { 
      type: Number, 
      default: 0,
      min: 0
    },
    minSpend: { 
      type: Number, 
      default: 0,
      min: 0
    },
    maxDiscount: { 
      type: Number, 
      default: 0,
      min: 0
    },
    used: { 
      type: Number, 
      default: 0,
      min: 0
    },
    limit: { 
      type: Number, 
      default: 0,
      min: 0
    },
    status: { 
      type: String, 
      enum: ["Active", "Paused", "Scheduled"], 
      default: "Active" 
    },
    startsAt: { 
      type: Date, 
      default: null 
    },
    endsAt: { 
      type: Date, 
      default: null 
    }
  },
  { 
    timestamps: true 
  }
);

// Indexes for better query performance
PromotionSchema.index({ code: 1 });
PromotionSchema.index({ status: 1 });
PromotionSchema.index({ startsAt: 1, endsAt: 1 });

// Validation middleware
PromotionSchema.pre('save', function(next) {
  // Ensure percentage values are between 0-100
  if (this.type === 'Percentage' && this.value > 100) {
    this.value = 100;
  }
  
  // Ensure dates are valid
  if (this.startsAt && this.endsAt && this.startsAt >= this.endsAt) {
    return next(new Error('Start date must be before end date'));
  }
  
  next();
});

export default mongoose.model("Promotion", PromotionSchema);