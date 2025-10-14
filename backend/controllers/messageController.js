import Message from "../models/Message.js";

export async function getMyMessages(req, res) {
  try {
    const userId = req.user?.userId || req.user?.id || req.user?._id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const messages = await Message.find({ userId }).sort({ createdAt: 1 });
    res.json({ success: true, messages });
  } catch (e) {
    console.error("GET_MESSAGES_ERROR:", e);
    res.status(500).json({ success: false, message: e?.message || "Server error" });
  }
}

export async function sendMessage(req, res) {
  try {
    const userId = req.user?.userId || req.user?.id || req.user?._id;
    const text = String(req.body?.text || "").trim();
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!text) return res.status(400).json({ success: false, message: "Message text is required" });

    const msg = await Message.create({ userId, senderRole: "customer", text });
    res.status(201).json({ success: true, message: msg });
  } catch (e) {
    console.error("SEND_MESSAGE_ERROR:", e);
    res.status(500).json({ success: false, message: e?.message || "Server error" });
  }
}