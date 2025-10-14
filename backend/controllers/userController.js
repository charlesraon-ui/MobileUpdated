import User from "../models/User.js";
import { uploadBufferToCloudinary } from "../utils/uploadToCloudinary.js";

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

/**
 * POST /api/users/profile/upload
 * Accepts single image file field `image` and sets the user's avatarUrl.
 */
export async function uploadProfileImage(req, res) {
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
        ? `${process.env.CLOUDINARY_ROOT_FOLDER}/avatars`
        : "avatars",
      resource_type: "image",
      transformation: [{ fetch_format: "auto", quality: "auto" }],
    });

    const url = result.secure_url || result.url;
    if (!url) {
      return res.status(500).json({ success: false, message: "Upload failed" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: { avatarUrl: url } },
      { new: true }
    ).select("name email avatarUrl");

    return res.json({ success: true, url, user });
  } catch (e) {
    console.error("UPLOAD_PROFILE_IMAGE_ERROR:", e);
    return res.status(500).json({ success: false, message: e?.message || "Server error" });
  }
}