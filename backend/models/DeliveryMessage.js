import mongoose from "mongoose";

const deliveryMessageSchema = new mongoose.Schema({
  // Reference to the order this message is about
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
    index: true
  },
  
  // Reference to the delivery this message is about
  deliveryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Delivery",
    required: true,
    index: true
  },
  
  // Customer information
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  
  // Sender information
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  
  // Sender type: 'customer' or 'admin'
  senderType: {
    type: String,
    enum: ["customer", "admin"],
    required: true
  },
  
  // Message content
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  
  // Message type for different kinds of delivery updates
  messageType: {
    type: String,
    enum: ["general", "status_update", "location_update", "delivery_issue", "delivery_complete"],
    default: "general"
  },
  
  // Read status
  isRead: {
    type: Boolean,
    default: false
  },
  
  // Read timestamp
  readAt: {
    type: Date,
    default: null
  },
  
  // Delivery status at the time of message (for context)
  deliveryStatus: {
    type: String,
    enum: ["pending", "assigned", "picked_up", "in_transit", "delivered", "cancelled"],
    default: "pending"
  },
  
  // Optional: Attach location data for location updates
  location: {
    latitude: {
      type: Number,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180
    },
    address: {
      type: String,
      trim: true
    }
  },
  
  // Optional: Attach image URLs for delivery proof or issues
  attachments: [{
    type: String, // URL to image/file
    trim: true
  }],
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient querying
deliveryMessageSchema.index({ orderId: 1, createdAt: -1 });
deliveryMessageSchema.index({ deliveryId: 1, createdAt: -1 });
deliveryMessageSchema.index({ customerId: 1, createdAt: -1 });
deliveryMessageSchema.index({ senderId: 1, createdAt: -1 });
deliveryMessageSchema.index({ isRead: 1, customerId: 1 });

// Virtual for sender details
deliveryMessageSchema.virtual('senderDetails', {
  ref: 'User',
  localField: 'senderId',
  foreignField: '_id',
  justOne: true
});

// Virtual for order details
deliveryMessageSchema.virtual('orderDetails', {
  ref: 'Order',
  localField: 'orderId',
  foreignField: '_id',
  justOne: true
});

// Virtual for delivery details
deliveryMessageSchema.virtual('deliveryDetails', {
  ref: 'Delivery',
  localField: 'deliveryId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware to update timestamps
deliveryMessageSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to get conversation for an order
deliveryMessageSchema.statics.getOrderConversation = function(orderId, limit = 50) {
  return this.find({ orderId })
    .populate('senderDetails', 'name email role')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get unread messages count for a customer
deliveryMessageSchema.statics.getUnreadCount = function(customerId) {
  return this.countDocuments({ 
    customerId, 
    isRead: false, 
    senderType: 'admin' 
  });
};

// Static method to mark messages as read
deliveryMessageSchema.statics.markAsRead = function(messageIds, userId) {
  return this.updateMany(
    { 
      _id: { $in: messageIds }, 
      customerId: userId,
      isRead: false 
    },
    { 
      isRead: true, 
      readAt: new Date() 
    }
  );
};

// Instance method to mark single message as read
deliveryMessageSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

const DeliveryMessage = mongoose.model("DeliveryMessage", deliveryMessageSchema);

export default DeliveryMessage;