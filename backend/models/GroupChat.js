import mongoose from "mongoose";

const groupChatSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: 100
    },
    description: { 
      type: String, 
      trim: true,
      maxlength: 500
    },
    participants: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    }],
    admin: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    lastMessage: {
      text: { type: String },
      senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      timestamp: { type: Date }
    },
    isActive: { 
      type: Boolean, 
      default: true 
    }
  },
  { timestamps: true }
);

// Index for efficient queries
groupChatSchema.index({ participants: 1 });
groupChatSchema.index({ admin: 1 });

export default mongoose.models.GroupChat || mongoose.model("GroupChat", groupChatSchema);