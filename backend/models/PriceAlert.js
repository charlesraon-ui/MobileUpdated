import mongoose from "mongoose";

const priceAlertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
    index: true
  },
  // Price tracking
  originalPrice: {
    type: Number,
    required: true
  },
  currentPrice: {
    type: Number,
    required: true
  },
  lowestPrice: {
    type: Number,
    required: true
  },
  priceHistory: [{
    price: Number,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  // Stock tracking
  originalStock: {
    type: Number,
    default: 0
  },
  currentStock: {
    type: Number,
    default: 0
  },
  wasOutOfStock: {
    type: Boolean,
    default: false
  },
  // Notification settings
  priceDropThreshold: {
    type: Number,
    default: 0.05, // 5% price drop by default
    min: 0.01,
    max: 0.5
  },
  notificationsEnabled: {
    type: Boolean,
    default: true
  },
  lastPriceNotification: {
    type: Date,
    default: null
  },
  lastStockNotification: {
    type: Date,
    default: null
  },
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for efficient queries
priceAlertSchema.index({ userId: 1, productId: 1 }, { unique: true });
priceAlertSchema.index({ notificationsEnabled: 1, updatedAt: 1 });

// Update the updatedAt field before saving
priceAlertSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance methods
priceAlertSchema.methods.addPricePoint = function(newPrice) {
  this.priceHistory.push({
    price: newPrice,
    date: new Date()
  });
  
  // Keep only last 30 price points to avoid bloating
  if (this.priceHistory.length > 30) {
    this.priceHistory = this.priceHistory.slice(-30);
  }
  
  this.currentPrice = newPrice;
  
  // Update lowest price if this is lower
  if (newPrice < this.lowestPrice) {
    this.lowestPrice = newPrice;
  }
};

priceAlertSchema.methods.updateStock = function(newStock) {
  this.currentStock = newStock;
  
  // Track if item was out of stock and is now back in stock
  if (this.wasOutOfStock && newStock > 0) {
    this.wasOutOfStock = false;
    return true; // Indicates stock status changed from out to in stock
  } else if (!this.wasOutOfStock && newStock === 0) {
    this.wasOutOfStock = true;
  }
  
  return false;
};

priceAlertSchema.methods.shouldSendPriceAlert = function() {
  if (!this.notificationsEnabled) return false;
  
  const priceDropPercentage = (this.originalPrice - this.currentPrice) / this.originalPrice;
  const hasSignificantDrop = priceDropPercentage >= this.priceDropThreshold;
  
  // Don't send notification if we sent one in the last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentlyNotified = this.lastPriceNotification && this.lastPriceNotification > oneDayAgo;
  
  return hasSignificantDrop && !recentlyNotified;
};

priceAlertSchema.methods.shouldSendStockAlert = function() {
  if (!this.notificationsEnabled) return false;
  
  // Don't send notification if we sent one in the last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentlyNotified = this.lastStockNotification && this.lastStockNotification > oneHourAgo;
  
  return !recentlyNotified;
};

const PriceAlert = mongoose.model("PriceAlert", priceAlertSchema);

export default PriceAlert;