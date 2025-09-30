// models/Order.js
import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: String,
    price: { type: Number, min: 0 },
    imageUrl: String,
    quantity: { type: Number, default: 1, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    items: { type: [orderItemSchema], default: [] },
    total: { type: Number, min: 0, default: 0 },
    address: String,
    paymentMethod: String, // e.g., "cod" | "gcash"
    gcashNumber: String,
    status: { type: String, default: "pending" },

    paymentStatus: { 
      type: String, 
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending" 
    },
    paymentSourceId: String,
    paymentStatus: { type: String, default: "pending" }, // pending, paid, failed
    paidAt: Date,
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model("Order", orderSchema);
