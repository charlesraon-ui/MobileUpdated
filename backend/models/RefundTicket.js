import mongoose from "mongoose";

const RefundTicketSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  paymentId: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: "PHP" },
  reason: { type: String, required: true },
  attachments: [{ type: String }],
  status: {
    type: String,
    enum: ["requested","under_review","approved","rejected","refunded","closed"],
    default: "requested"
  },
  adminNote: { type: String, default: "" },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  processedAt: { type: Date, default: null },
  paymongoRefundId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

RefundTicketSchema.pre("save", function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model("RefundTicket", RefundTicketSchema);