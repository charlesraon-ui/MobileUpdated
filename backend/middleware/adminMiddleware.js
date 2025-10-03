// middleware/adminMiddleware.js
import User from "../models/User.js";

export const isAdmin = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required" 
      });
    }
    
    const user = await User.findById(userId);
    
    if (!user || user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        message: "Admin privileges required" 
      });
    }
    
    next();
  } catch (error) {
    console.error("ADMIN_MIDDLEWARE_ERROR:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};