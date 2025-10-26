import express from "express";
import {
  sendDeliveryMessage,
  getOrderMessages,
  getDeliveryConversations,
  getUnreadCount,
  markMessageAsRead,
  markMessagesAsRead
} from "../controllers/deliveryMessageController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * POST /api/delivery-messages/send
 * Send a message from admin to customer or vice versa
 * Body: { orderId, message, messageType?, location?, attachments? }
 */
router.post("/send", sendDeliveryMessage);

/**
 * GET /api/delivery-messages/order/:orderId
 * Get all messages for a specific order
 * Query params: limit?, page?
 */
router.get("/order/:orderId", getOrderMessages);

/**
 * GET /api/delivery-messages/conversations
 * Get all delivery conversations for admin (list of orders with messages)
 * Admin only endpoint
 */
router.get("/conversations", getDeliveryConversations);

/**
 * GET /api/delivery-messages/unread-count
 * Get unread message count for the current user
 */
router.get("/unread-count", getUnreadCount);

/**
 * PUT /api/delivery-messages/:messageId/read
 * Mark a specific message as read
 */
router.put("/:messageId/read", markMessageAsRead);

/**
 * POST /api/delivery-messages/bulk-read
 * Mark multiple messages as read
 * Body: { messageIds: [string] }
 */
router.post("/bulk-read", markMessagesAsRead);

export default router;