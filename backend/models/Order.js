import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: { type: String, required: true },
    imageUrl: String,
    // store PRICES IN PESOS in DB
    price: { type: Number, required: true, min: 0 },   // e.g., 1150 for ₱1,150.00
    quantity: { type: Number, required: true, min: 1, default: 1 },
    weightKg: { type: Number, min: 0, default: 0 },    // weight per item in kg
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: { 
      type: String, 
      required: true 
    },

    items: { type: [orderItemSchema], default: [] },

    // keep totals in PESOS; compute in a pre-save if not provided
    subtotal: { type: Number, min: 0, default: 0 },     // items sum (pesos)
    deliveryFee: { type: Number, min: 0, default: 0 },  // pesos
    total: { type: Number, min: 0, default: 0 },        // pesos = subtotal + deliveryFee
    totalWeightKg: { type: Number, min: 0, default: 0 }, // total weight in kg

    address: { type: String, default: "" },
    deliveryType: {
      type: String,
      enum: ["pickup", "in-house", "third-party"],
      default: "in-house",
    },

    paymentMethod: {
      type: String,
      enum: ["COD", "E-Payment"],
      default: "COD",
    },

    status: { type: String, default: "pending" },

    // Promo code information
    promoCode: {
      code: { type: String },
      discount: { type: Number, min: 0, default: 0 },
      freeShipping: { type: Boolean, default: false }
    },

    // Loyalty reward information
    loyaltyReward: {
      rewardId: { type: String },
      name: { type: String },
      type: { type: String }, // 'discount', 'shipping', etc.
      value: { type: Number, min: 0, default: 0 }, // percentage or fixed amount
      discount: { type: Number, min: 0, default: 0 }, // calculated discount amount
      freeShipping: { type: Boolean, default: false }
    },

    // PayMongo tracking
    paymongoSessionId: { type: String },
    paymongoPaymentId: { type: String },
  },
  { timestamps: true }
);

// Keep totals consistent if caller forgot to compute
orderSchema.pre("save", function (next) {
  const items = this.items || [];
  
  // Calculate subtotal
  const subtotal = items.reduce(
    (sum, it) => sum + Number(it.price || 0) * Number(it.quantity || 0),
    0
  );
  
  // Calculate total weight
  const totalWeight = items.reduce(
    (sum, it) => sum + Number(it.weightKg || 0) * Number(it.quantity || 0),
    0
  );
  
  this.subtotal = Math.round((Number(this.subtotal) || subtotal) * 100) / 100;
  this.deliveryFee = Math.round((Number(this.deliveryFee) || 0) * 100) / 100;
  this.total = Math.round((this.subtotal + this.deliveryFee) * 100) / 100;
  this.totalWeightKg = Math.round(totalWeight * 100) / 100; // round to 2 decimal places
  
  next();
});

export default mongoose.models.Order || mongoose.model("Order", orderSchema);