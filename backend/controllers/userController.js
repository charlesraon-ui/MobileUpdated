import User from "../models/User.js";
import { uploadBufferToCloudinary } from "../utils/uploadToCloudinary.js";

export async function searchUsers(req, res) {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) return res.json({ data: { users: [] } });
    // Case-insensitive partial match on name or email
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const users = await User.find({ $or: [{ name: regex }, { email: regex }] })
      .select("name email avatarUrl")
      .limit(50)
      .lean();
    
    // Transform the response to match frontend expectations
    const transformedUsers = users.map(user => ({
      _id: user._id,
      name: user.name,
      firstName: user.name ? user.name.split(' ')[0] : '',
      lastName: user.name ? user.name.split(' ').slice(1).join(' ') : '',
      email: user.email,
      avatarUrl: user.avatarUrl
    }));
    
    res.json({ data: { users: transformedUsers } });
  } catch (e) {
    console.error("SEARCH_USERS_ERROR:", e);
    res.status(500).json({ success: false, message: e?.message || "Server error" });
  }
}

export async function getUserById(req, res) {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ success: false, message: "userId is required" });
    
    const user = await User.findById(userId)
      .select("name email avatarUrl")
      .lean();
    
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    
    res.json({ success: true, user });
  } catch (e) {
    console.error("GET_USER_BY_ID_ERROR:", e);
    res.status(500).json({ success: false, message: e?.message || "Server error" });
  }
}

export async function getAdminUsers(req, res) {
  try {
    // Get all users with admin or superadmin role
    const adminUsers = await User.find({ 
      role: { $in: ["admin", "superadmin"] } 
    })
      .select("name email avatarUrl role")
      .limit(20)
      .lean();
    
    // Transform the response to match frontend expectations
    const transformedUsers = adminUsers.map(user => ({
      _id: user._id,
      name: user.name || user.email,
      firstName: user.name ? user.name.split(' ')[0] : '',
      lastName: user.name ? user.name.split(' ').slice(1).join(' ') : '',
      email: user.email,
      avatarUrl: user.avatarUrl,
      role: user.role
    }));
    
    res.json({ success: true, data: { users: transformedUsers } });
  } catch (e) {
    console.error("GET_ADMIN_USERS_ERROR:", e);
    res.status(500).json({ success: false, message: e?.message || "Server error" });
  }
}

/**
 * POST /api/users/profile/upload
 * Accepts single image file field `image` and sets the user's avatarUrl.
 */
/**
 * PUT /api/users/profile
 * Updates user profile information (name, email)
 */
export async function updateProfile(req, res) {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { name, email } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email is already taken by another user
    const existingUser = await User.findOne({ 
      email: normalizedEmail, 
      _id: { $ne: req.user.userId } 
    });
    
    if (existingUser) {
      return res.status(409).json({ success: false, message: "Email is already taken" });
    }

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { 
        $set: { 
          name: name.trim(), 
          email: normalizedEmail 
        } 
      },
      { new: true }
    ).select("name email avatarUrl");

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({ 
      success: true, 
      message: "Profile updated successfully",
      user: updatedUser 
    });
  } catch (e) {
    console.error("UPDATE_PROFILE_ERROR:", e);
    return res.status(500).json({ success: false, message: e?.message || "Server error" });
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