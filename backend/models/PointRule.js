// models/PointRule.js
import mongoose from "mongoose";

const pointRuleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["purchase_amount", "product_specific", "category_specific"],
      required: true,
    },
    pointsPerUnit: {
      type: Number,
      required: true,
    },
    unitAmount: {
      type: Number,
      default: 1,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    }
  },
  { timestamps: true }
);

const PointRule = mongoose.model("PointRule", pointRuleSchema);

export default PointRule;