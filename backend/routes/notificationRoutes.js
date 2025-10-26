import express from "express";
import { authMiddleware as requireAuth } from "../middleware/authMiddleware.js";
import { registerPushToken } from "../controllers/notificationController.js";
import notificationService from "../services/notificationService.js";

const router = express.Router();

router.use(requireAuth);
router.post("/register", registerPushToken);

// POST /api/notifications/register-token - Register FCM token for push notifications
router.post("/register-token", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ 
        success: false, 
        message: "FCM token is required" 
      });
    }

    const result = await notificationService.registerFCMToken(userId, fcmToken);
    
    res.json({
      success: result.success,
      message: result.success ? "FCM token registered successfully" : "Failed to register FCM token",
      error: result.error
    });
  } catch (error) {
    console.error("Register FCM token error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to register FCM token" 
    });
  }
});

// GET /api/notifications/history - Get notification history
router.get("/history", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;

    const notifications = await notificationService.getNotificationHistory(userId, limit);
    
    res.json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error("Get notification history error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to get notification history" 
    });
  }
});

// PUT /api/notifications/mark-read - Mark notifications as read
router.put("/mark-read", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationIds = [] } = req.body;

    const result = await notificationService.markNotificationsAsRead(userId, notificationIds);
    
    res.json({
      success: result.success,
      message: result.success ? "Notifications marked as read" : "Failed to mark notifications as read",
      error: result.error
    });
  } catch (error) {
    console.error("Mark notifications as read error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to mark notifications as read" 
    });
  }
});

// POST /api/notifications/test - Send test notification
router.post("/test", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await notificationService.sendTestNotification(userId);
    
    res.json({
      success: result.success,
      message: result.success ? "Test notification sent successfully" : "Failed to send test notification",
      messageId: result.messageId,
      error: result.error
    });
  } catch (error) {
    console.error("Send test notification error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to send test notification" 
    });
  }
});

export default router;