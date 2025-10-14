import User from "../models/User.js";

export async function searchUsers(req, res) {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) return res.json([]);
    // Case-insensitive partial match on name or email
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const users = await User.find({ $or: [{ name: regex }, { email: regex }] })
      .select("name email")
      .limit(50)
      .lean();
    res.json(users);
  } catch (e) {
    console.error("SEARCH_USERS_ERROR:", e);
    res.status(500).json({ success: false, message: e?.message || "Server error" });
  }
}