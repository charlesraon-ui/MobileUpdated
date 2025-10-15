import mongoose from "mongoose";

const groupMessageSchema = new mongoose.Schema(
  {
    groupChatId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "GroupChat", 
      required: true 
    },
    senderId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    text: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: 1000
    },
    messageType: {
      type: String,
      enum: ["text", "system"],
      default: "text"
    },
    readBy: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      readAt: { type: Date, default: Date.now }
    }],
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

// Indexes for efficient queries
groupMessageSchema.index({ groupChatId: 1, createdAt: -1 });
groupMessageSchema.index({ senderId: 1 });

export default mongoose.models.GroupMessage || mongoose.model("GroupMessage", groupMessageSchema);