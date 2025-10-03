import axios from "axios";
import User from "../models/User.js";

export const registerPushToken = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { pushToken } = req.body || {};
    if (!pushToken) return res.status(400).json({ success: false, message: "pushToken required" });

    await User.findByIdAndUpdate(userId, { pushToken }, { new: true });
    res.json({ success: true });
  } catch (e) {
    console.error("REGISTER_PUSH_TOKEN_ERROR:", e);
    res.status(500).json({ success: false, message: e?.message || "Server error" });
  }
};

export const sendPush = async ({ to, title, body, data = {} }) => {
  if (!to) return { ok: false, error: "Missing 'to' token" };
  try {
    const { data: resp } = await axios.post("https://exp.host/--/api/v2/push/send", {
      to,
      title,
      body,
      data,
    }, {
      headers: { "Content-Type": "application/json" },
      timeout: 10000,
    });
    return { ok: true, resp };
  } catch (e) {
    console.error("SEND_PUSH_ERROR:", e?.message || e);
    return { ok: false, error: e?.message || String(e) };
  }
};