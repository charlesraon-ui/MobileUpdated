import DirectMessage from "../models/DirectMessage.js";
import User from "../models/User.js";

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

export async function sendDMToUser(req, res) {
  try {
    const me = req.user?.userId || req.user?.id || req.user?._id;
    const other = req.params.userId;
    const text = String(req.body?.text || "").trim();
    if (!me) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!other) return res.status(400).json({ success: false, message: "userId is required" });
    if (!text) return res.status(400).json({ success: false, message: "Message text is required" });
    
    const msg = await DirectMessage.create({ senderId: me, recipientId: other, text });
    
    // Emit real-time message to both users
    const io = req.app.get('io');
    if (io) {
      const roomId = [me, other].sort().join('_');
      io.to(`dm_${roomId}`).emit('new_dm_message', {
        message: msg,
        senderId: me,
        recipientId: other
      });
      
      // Notify recipient
      io.to(`user_${other}`).emit('new_dm_notification', {
        senderId: me,
        message: msg
      });
    }
    
    res.status(201).json({ success: true, message: msg });
  } catch (e) {
    console.error("SEND_DM_ERROR:", e);
    res.status(500).json({ success: false, message: e?.message || "Server error" });
  }
}