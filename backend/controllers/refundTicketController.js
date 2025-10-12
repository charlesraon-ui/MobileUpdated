import Order from '../models/Order.js';
import RefundTicket from '../models/RefundTicket.js';
import { uploadBufferToCloudinary } from '../utils/uploadToCloudinary.js';

// ================================================================
// GET ORDER WITH REFUND STATUS
// ================================================================
export const getOrderWithRefundStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId)
      .populate('userId', 'name email')
      .populate('items.productId', 'name price imageUrl');

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    // Verify ownership
    // Note: Order.userId is stored as a String in the Order model,
    // so populating won't produce an object with _id. Compare as strings.
    if (String(order.userId) !== String(req.user._id)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized' 
      });
    }

    // Check for refund ticket
    const existingTicket = await RefundTicket.findOne({ 
      order: orderId,
      status: { $in: ['requested', 'under_review', 'approved', 'refunded'] }
    });

    res.json({
      success: true,
      order: {
        ...order.toObject(),
        hasRefundRequest: !!existingTicket,
        refundTicketId: existingTicket?._id || null,
        refundStatus: existingTicket?.status || null
      }
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch order',
      error: error.message 
    });
  }
};

// ================================================================
// UPLOAD REFUND IMAGES
// ================================================================
export const uploadRefundImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No files uploaded' 
      });
    }

    const uploadPromises = req.files.map((file) =>
      uploadBufferToCloudinary(file.buffer, {
        folder: process.env.CLOUDINARY_ROOT_FOLDER
          ? `${process.env.CLOUDINARY_ROOT_FOLDER}/refunds`
          : "refunds",
      })
    );

    const results = await Promise.all(uploadPromises);
    const urls = results.map(result => result.secure_url);

    res.json({
      success: true,
      urls,
      count: urls.length,
      message: `${urls.length} image(s) uploaded successfully`,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Upload failed',
      error: error.message 
    });
  }
};

// ================================================================
// CREATE REFUND TICKET
// ================================================================
export const createRefundTicket = async (req, res) => {
  try {
    const { orderId, reason, attachments } = req.body;

    // Validate required fields
    if (!orderId || !reason) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: orderId and reason' 
      });
    }

    // Validate reason length
    if (reason.trim().length < 10) {
      return res.status(400).json({ 
        success: false, 
        message: 'Reason must be at least 10 characters long' 
      });
    }

    // Get order
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    // Verify ownership
    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to request refund for this order' 
      });
    }

    // Check order status
    const allowedStatuses = ["pending", "confirmed", "completed", "delivered", "ready"]; // include READY for refund eligibility
    const orderStatus = String(order.status || "").toLowerCase();
    if (!allowedStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot request refund for orders with status: ${order.status}`,
      });
    }

    // Check if refund already exists
    const existingTicket = await RefundTicket.findOne({ 
      order: orderId,
      status: { $in: ['requested', 'under_review', 'approved'] }
    });

    if (existingTicket) {
      return res.status(400).json({ 
        success: false, 
        message: 'A refund request already exists for this order',
        ticketId: existingTicket._id
      });
    }

    // Create refund ticket
    const refundTicket = new RefundTicket({
      order: orderId,
      user: req.user._id,
      paymentId: order.paymentMethod === 'COD' 
        ? 'COD-Payment' 
        : (order.paymentId || 'N/A'),
      amount: order.total,
      currency: 'PHP',
      reason: reason.trim(),
      attachments: attachments || [],
      status: 'requested'
    });

    await refundTicket.save();

    // Populate references
    await refundTicket.populate('user', 'name email');
    await refundTicket.populate('order');

    res.status(201).json({
      success: true,
      message: 'Refund request submitted successfully',
      ticket: refundTicket
    });
  } catch (error) {
    console.error('Create refund ticket error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create refund ticket',
      error: error.message 
    });
  }
};

// ================================================================
// GET USER'S REFUND TICKETS
// ================================================================
export const getMyRefundTickets = async (req, res) => {
  try {
    const tickets = await RefundTicket.find({ user: req.user._id })
      .populate('order')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      tickets,
      total: tickets.length
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch tickets',
      error: error.message 
    });
  }
};

// ================================================================
// GET SINGLE REFUND TICKET
// ================================================================
export const getRefundTicketById = async (req, res) => {
  try {
    const ticket = await RefundTicket.findById(req.params.ticketId)
      .populate('user', 'name email')
      .populate('order')
      .populate('processedBy', 'name email');

    if (!ticket) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ticket not found' 
      });
    }

    // Users can only view their own tickets
    if (ticket.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to view this ticket' 
      });
    }

    res.json({
      success: true,
      ticket
    });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch ticket',
      error: error.message 
    });
  }
};
