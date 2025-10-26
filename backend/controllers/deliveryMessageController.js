import DeliveryMessage from "../models/DeliveryMessage.js";
import Order from "../models/Order.js";
import Delivery from "../models/Delivery.js";
import User from "../models/User.js";

/**
 * Helper function to verify order ownership or admin access
 */
const verifyOrderAccess = async (orderId, userId, userRole) => {
  const order = await Order.findById(orderId).select("userId").lean();
  if (!order) {
    return { success: false, message: "Order not found", code: 404 };
  }
  
  // Admin can access any order, customer can only access their own
  if (userRole === "admin" || String(order.userId) === String(userId)) {
    return { success: true, order };
  }
  
  return { success: false, message: "Access denied", code: 403 };
};

/**
 * Helper function to get delivery for an order
 */
const getDeliveryForOrder = async (orderId) => {
  const delivery = await Delivery.findOne({ order: orderId }).lean();
  if (!delivery) {
    return { success: false, message: "Delivery not found for this order", code: 404 };
  }
  return { success: true, delivery };
};

/**
 * POST /api/delivery-messages/send
 * Send a message from admin to customer or vice versa
 */
export const sendDeliveryMessage = async (req, res) => {
  try {
    const senderId = req.user?._id || req.user?.id;
    const senderRole = req.user?.role || "customer";
    
    if (!senderId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { 
      orderId, 
      message, 
      messageType = "general",
      location,
      attachments = []
    } = req.body;

    if (!orderId || !message?.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: "Order ID and message are required" 
      });
    }

    // Verify access to the order
    const orderAccess = await verifyOrderAccess(orderId, senderId, senderRole);
    if (!orderAccess.success) {
      return res.status(orderAccess.code).json({ 
        success: false, 
        message: orderAccess.message 
      });
    }

    // Get delivery information
    const deliveryResult = await getDeliveryForOrder(orderId);
    if (!deliveryResult.success) {
      return res.status(deliveryResult.code).json({ 
        success: false, 
        message: deliveryResult.message 
      });
    }

    const delivery = deliveryResult.delivery;
    const customerId = orderAccess.order.userId;

    // Create the message
    const deliveryMessage = new DeliveryMessage({
      orderId,
      deliveryId: delivery._id,
      customerId,
      senderId,
      senderType: senderRole === "admin" ? "admin" : "customer",
      message: message.trim(),
      messageType,
      deliveryStatus: delivery.status,
      location: location || undefined,
      attachments: Array.isArray(attachments) ? attachments : []
    });

    await deliveryMessage.save();

    // Populate sender details for response
    await deliveryMessage.populate('senderDetails', 'name email role');

    // Emit real-time event via Socket.IO
    const io = req.app.get('io');
    if (io) {
      const messageData = {
        ...deliveryMessage.toObject(),
        orderId,
        senderType: senderRole === "admin" ? "admin" : "customer"
      };
      
      // Emit to delivery room for this order
      io.to(`delivery_${orderId}`).emit('delivery_message_received', messageData);
      
      // Also notify admin room if message is from customer
      if (senderRole === "customer") {
        io.to('admin_room').emit('new_customer_delivery_message', messageData);
      }
    }

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      deliveryMessage
    });

  } catch (error) {
    console.error("SEND_DELIVERY_MESSAGE_ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: error.message
    });
  }
};

/**
 * GET /api/delivery-messages/order/:orderId
 * Get all messages for a specific order
 */
export const getOrderMessages = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const userRole = req.user?.role || "customer";
    const { orderId } = req.params;
    const { limit = 50, page = 1 } = req.query;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Verify access to the order
    const orderAccess = await verifyOrderAccess(orderId, userId, userRole);
    if (!orderAccess.success) {
      return res.status(orderAccess.code).json({ 
        success: false, 
        message: orderAccess.message 
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get messages for the order
    const messages = await DeliveryMessage.find({ orderId })
      .populate('senderDetails', 'name email role')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    // Get total count for pagination
    const totalMessages = await DeliveryMessage.countDocuments({ orderId });

    // Mark messages as read if user is customer and messages are from admin
    if (userRole === "customer") {
      const unreadAdminMessages = messages
        .filter(msg => msg.senderType === "admin" && !msg.isRead)
        .map(msg => msg._id);
      
      if (unreadAdminMessages.length > 0) {
        await DeliveryMessage.markAsRead(unreadAdminMessages, userId);
      }
    }

    res.json({
      success: true,
      messages: messages.reverse(), // Return in chronological order
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalMessages / parseInt(limit)),
        totalMessages,
        hasMore: skip + messages.length < totalMessages
      }
    });

  } catch (error) {
    console.error("GET_ORDER_MESSAGES_ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve messages",
      error: error.message
    });
  }
};

/**
 * GET /api/delivery-messages/conversations
 * Get all delivery conversations for admin (list of orders with messages)
 */
export const getDeliveryConversations = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const userRole = req.user?.role || "customer";

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (userRole !== "admin") {
      return res.status(403).json({ 
        success: false, 
        message: "Admin access required" 
      });
    }

    // Get all orders that have delivery messages
    const conversations = await DeliveryMessage.aggregate([
      {
        $group: {
          _id: "$orderId",
          lastMessage: { $last: "$message" },
          lastMessageAt: { $last: "$createdAt" },
          lastSenderType: { $last: "$senderType" },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$senderType", "customer"] }, { $eq: ["$isRead", false] }] },
                1,
                0
              ]
            }
          },
          totalMessages: { $sum: 1 },
          customerId: { $first: "$customerId" },
          deliveryId: { $first: "$deliveryId" }
        }
      },
      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "_id",
          as: "orderDetails"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "customerId",
          foreignField: "_id",
          as: "customerDetails"
        }
      },
      {
        $lookup: {
          from: "deliveries",
          localField: "deliveryId",
          foreignField: "_id",
          as: "deliveryDetails"
        }
      },
      {
        $project: {
          orderId: "$_id",
          lastMessage: 1,
          lastMessageAt: 1,
          lastSenderType: 1,
          unreadCount: 1,
          totalMessages: 1,
          orderDetails: { $arrayElemAt: ["$orderDetails", 0] },
          customerDetails: { 
            $arrayElemAt: [
              {
                $map: {
                  input: "$customerDetails",
                  as: "customer",
                  in: {
                    _id: "$$customer._id",
                    name: "$$customer.name",
                    email: "$$customer.email"
                  }
                }
              },
              0
            ]
          },
          deliveryDetails: { $arrayElemAt: ["$deliveryDetails", 0] }
        }
      },
      {
        $sort: { lastMessageAt: -1 }
      }
    ]);

    res.json({
      success: true,
      conversations
    });

  } catch (error) {
    console.error("GET_DELIVERY_CONVERSATIONS_ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve conversations",
      error: error.message
    });
  }
};

/**
 * GET /api/delivery-messages/unread-count
 * Get unread message count for the current user
 */
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const userRole = req.user?.role || "customer";

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    let unreadCount = 0;

    if (userRole === "customer") {
      // For customers, count unread messages from admin
      unreadCount = await DeliveryMessage.getUnreadCount(userId);
    } else if (userRole === "admin") {
      // For admin, count unread messages from all customers
      unreadCount = await DeliveryMessage.countDocuments({
        senderType: "customer",
        isRead: false
      });
    }

    res.json({
      success: true,
      unreadCount
    });

  } catch (error) {
    console.error("GET_UNREAD_COUNT_ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get unread count",
      error: error.message
    });
  }
};

/**
 * PUT /api/delivery-messages/:messageId/read
 * Mark a specific message as read
 */
export const markMessageAsRead = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const userRole = req.user?.role || "customer";
    const { messageId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const message = await DeliveryMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ 
        success: false, 
        message: "Message not found" 
      });
    }

    // Verify access - customers can only mark their own messages as read
    if (userRole === "customer" && String(message.customerId) !== String(userId)) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied" 
      });
    }

    // Admin can mark any message as read
    if (userRole === "admin" || String(message.customerId) === String(userId)) {
      await message.markAsRead();
      
      res.json({
        success: true,
        message: "Message marked as read"
      });
    } else {
      res.status(403).json({ 
        success: false, 
        message: "Access denied" 
      });
    }

  } catch (error) {
    console.error("MARK_MESSAGE_READ_ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark message as read",
      error: error.message
    });
  }
};

/**
 * POST /api/delivery-messages/bulk-read
 * Mark multiple messages as read
 */
export const markMessagesAsRead = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const userRole = req.user?.role || "customer";
    const { messageIds } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Message IDs array is required" 
      });
    }

    let result;
    
    if (userRole === "customer") {
      // Customers can only mark their own messages as read
      result = await DeliveryMessage.markAsRead(messageIds, userId);
    } else if (userRole === "admin") {
      // Admin can mark any messages as read
      result = await DeliveryMessage.updateMany(
        { _id: { $in: messageIds }, isRead: false },
        { isRead: true, readAt: new Date() }
      );
    } else {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied" 
      });
    }

    res.json({
      success: true,
      message: `${result.modifiedCount} messages marked as read`
    });

  } catch (error) {
    console.error("MARK_MESSAGES_READ_ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark messages as read",
      error: error.message
    });
  }
};