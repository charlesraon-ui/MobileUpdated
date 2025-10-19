import mongoose from "mongoose";

const directMessageSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: false }, // Made optional to allow image-only messages
    imageUrl: { type: String, required: false }, // URL to uploaded image
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Validation: Either text or imageUrl must be present
directMessageSchema.pre('validate', function() {
  if (!this.text && !this.imageUrl) {
    this.invalidate('text', 'Either text or imageUrl must be provided');
  }
});

export default mongoose.models.DirectMessage || mongoose.model("DirectMessage", directMessageSchema);