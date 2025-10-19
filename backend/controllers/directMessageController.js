import DirectMessage from "../models/DirectMessage.js";
import User from "../models/User.js";
import { uploadBufferToCloudinary } from "../utils/uploadToCloudinary.js";

export async function listConversations(req, res) {
  try {
    const me = req.user?.userId || req.user?.id || req.user?._id;
    if (!me) return res.status(401).json({ success: false, message: "Unauthorized" });
    const msgs = await DirectMessage.find({ $or: [{ senderId: me }, { recipientId: me }] })
      .sort({ createdAt: -1 })
      .lean();

    const convMap = new Map();
    for (const m of msgs) {
      const otherId = String(m.senderId) === String(me) ? String(m.recipientId) : String(m.senderId);
      if (!convMap.has(otherId)) {
        convMap.set(otherId, { otherUserId: otherId, lastMessage: m, unreadCount: 0 });
      }
      if (String(m.recipientId) === String(me) && !m.read) {
        convMap.get(otherId).unreadCount += 1;
      }
    }

    const conversations = Array.from(convMap.values());
    const userIds = conversations.map((c) => c.otherUserId);
    const users = await User.find({ _id: { $in: userIds } }).select("name email avatarUrl").lean();
    const userMap = new Map(users.map((u) => [String(u._id), u]));
    const result = conversations.map((c) => ({ ...c, user: userMap.get(c.otherUserId) || null }));
    res.json({ success: true, conversations: result });
  } catch (e) {
    console.error("LIST_CONVERSATIONS_ERROR:", e);
    res.status(500).json({ success: false, message: e?.message || "Server error" });
  }
}

export async function getThreadWithUser(req, res) {
  try {
    const me = req.user?.userId || req.user?.id || req.user?._id;
    const other = req.params.userId;
    if (!me) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!other) return res.status(400).json({ success: false, message: "userId is required" });
    const thread = await DirectMessage.find({
      $or: [
        { senderId: me, recipientId: other },
        { senderId: other, recipientId: me },
      ],
    })
      .sort({ createdAt: 1 })
      .lean();

    // Mark messages to me as read
    await DirectMessage.updateMany({ recipientId: me, senderId: other, read: false }, { $set: { read: true } });
    res.json({ success: true, messages: thread });
  } catch (e) {
    console.error("GET_THREAD_ERROR:", e);
    res.status(500).json({ success: false, message: e?.message || "Server error" });
  }
}

/**
 * POST /api/direct-messages/upload
 * Upload an image for direct messages
 */
export async function uploadMessageImage(req, res) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const file = req.file;
    if (!file || !file.buffer) {
      return res.status(400).json({ success: false, message: "No image provided" });
    }

    const result = await uploadBufferToCloudinary(file.buffer, {
      folder: process.env.CLOUDINARY_ROOT_FOLDER
        ? `${process.env.CLOUDINARY_ROOT_FOLDER}/messages`
        : "messages",
      resource_type: "image",
      transformation: [{ fetch_format: "auto", quality: "auto" }],
    });

    const url = result.secure_url || result.url;
    if (!url) {
      return res.status(500).json({ success: false, message: "Upload failed" });
    }

    return res.json({ success: true, imageUrl: url });
  } catch (error) {
    console.error("UPLOAD_MESSAGE_IMAGE_ERROR:", error);
    return res.status(500).json({ success: false, message: error?.message || "Server error" });
  }
}

export async function sendDMToUser(req, res) {
  try {
    const { recipientId, text, imageUrl } = req.body;
    const senderId = req.user.userId;

    if (!recipientId) {
      return res.status(400).json({ success: false, message: "Recipient is required" });
    }

    // Validate that either text or imageUrl is provided
    if (!text?.trim() && !imageUrl?.trim()) {
      return res.status(400).json({ success: false, message: "Either text or image is required" });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ success: false, message: "Recipient not found" });
    }

    const messageData = {
      senderId,
      recipientId,
    };

    // Add text if provided
    if (text?.trim()) {
      messageData.text = text.trim();
    }

    // Add imageUrl if provided
    if (imageUrl?.trim()) {
      messageData.imageUrl = imageUrl.trim();
    }

    const message = new DirectMessage(messageData);
    await message.save();

    // Populate sender info for real-time emission
    await message.populate("senderId", "name email avatarUrl");

    // Emit to recipient if they're online
    const io = req.app.get("io");
    if (io) {
      io.to(`user_${recipientId}`).emit("new_direct_message", {
        _id: message._id,
        senderId: message.senderId,
        recipientId: message.recipientId,
        text: message.text,
        imageUrl: message.imageUrl,
        read: message.read,
        createdAt: message.createdAt,
        updatedAt: message.updatedAt,
      });
    }

    res.json({ success: true, message });
  } catch (error) {
    console.error("SEND_DM_ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}