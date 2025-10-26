import express from "express";
import { authMiddleware as authenticateToken } from "../middleware/authMiddleware.js";
import PriceAlert from "../models/PriceAlert.js";
import Product from "../models/Products.js";
import priceMonitoringService from "../services/priceMonitoringService.js";
import notificationService from "../services/notificationService.js";

const router = express.Router();

// GET /api/price-alerts - Get user's price alerts
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const priceAlerts = await PriceAlert.find({ userId })
      .populate('productId', 'name price images imageUrl stock')
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      priceAlerts: priceAlerts.map(alert => ({
        id: alert._id,
        product: alert.productId,
        originalPrice: alert.originalPrice,
        currentPrice: alert.currentPrice,
        lowestPrice: alert.lowestPrice,
        priceDropThreshold: alert.priceDropThreshold,
        notificationsEnabled: alert.notificationsEnabled,
        wasOutOfStock: alert.wasOutOfStock,
        currentStock: alert.currentStock,
        lastPriceNotification: alert.lastPriceNotification,
        lastStockNotification: alert.lastStockNotification,
        createdAt: alert.createdAt,
        updatedAt: alert.updatedAt
      }))
    });
  } catch (error) {
    console.error("Get price alerts error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to get price alerts" 
    });
  }
});

// POST /api/price-alerts/create - Create or update price alert for a product
router.post("/create", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, priceDropThreshold = 0.05 } = req.body;

    if (!productId) {
      return res.status(400).json({ 
        success: false, 
        message: "Product ID is required" 
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: "Product not found" 
      });
    }

    // Find existing alert or create new one
    let priceAlert = await PriceAlert.findOne({ userId, productId });
    
    if (priceAlert) {
      // Update existing alert
      priceAlert.priceDropThreshold = priceDropThreshold;
      priceAlert.notificationsEnabled = true;
      priceAlert.currentPrice = product.price;
      priceAlert.currentStock = product.stock || 0;
      
      if (product.stock === 0) {
        priceAlert.wasOutOfStock = true;
      }
    } else {
      // Create new alert
      priceAlert = new PriceAlert({
        userId,
        productId,
        originalPrice: product.price,
        currentPrice: product.price,
        lowestPrice: product.price,
        originalStock: product.stock || 0,
        currentStock: product.stock || 0,
        priceDropThreshold,
        wasOutOfStock: product.stock === 0,
        priceHistory: [{
          price: product.price,
          date: new Date()
        }]
      });
    }

    await priceAlert.save();

    res.json({
      success: true,
      message: "Price alert created successfully",
      priceAlert: {
        id: priceAlert._id,
        productId: priceAlert.productId,
        originalPrice: priceAlert.originalPrice,
        currentPrice: priceAlert.currentPrice,
        priceDropThreshold: priceAlert.priceDropThreshold,
        notificationsEnabled: priceAlert.notificationsEnabled
      }
    });
  } catch (error) {
    console.error("Create price alert error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to create price alert" 
    });
  }
});

// PUT /api/price-alerts/:id/settings - Update price alert settings
router.put("/:id/settings", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const alertId = req.params.id;
    const { priceDropThreshold, notificationsEnabled } = req.body;

    const priceAlert = await PriceAlert.findOne({ _id: alertId, userId });
    
    if (!priceAlert) {
      return res.status(404).json({ 
        success: false, 
        message: "Price alert not found" 
      });
    }

    // Update settings
    if (priceDropThreshold !== undefined) {
      priceAlert.priceDropThreshold = Math.max(0.01, Math.min(0.5, priceDropThreshold));
    }
    
    if (notificationsEnabled !== undefined) {
      priceAlert.notificationsEnabled = notificationsEnabled;
    }

    await priceAlert.save();

    res.json({
      success: true,
      message: "Price alert settings updated",
      priceAlert: {
        id: priceAlert._id,
        priceDropThreshold: priceAlert.priceDropThreshold,
        notificationsEnabled: priceAlert.notificationsEnabled
      }
    });
  } catch (error) {
    console.error("Update price alert settings error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update price alert settings" 
    });
  }
});

// DELETE /api/price-alerts/:id - Delete price alert
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const alertId = req.params.id;

    const result = await PriceAlert.deleteOne({ _id: alertId, userId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Price alert not found" 
      });
    }

    res.json({
      success: true,
      message: "Price alert deleted successfully"
    });
  } catch (error) {
    console.error("Delete price alert error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete price alert" 
    });
  }
});

// POST /api/price-alerts/manual-check - Trigger manual price check (admin only)
router.post("/manual-check", authenticateToken, async (req, res) => {
  try {
    // For demo purposes, allow any authenticated user to trigger manual check
    // In production, you might want to restrict this to admin users
    
    console.log(`Manual price check triggered by user: ${req.user.email}`);
    
    // Run manual check in background
    priceMonitoringService.runManualCheck().catch(error => {
      console.error("Manual check error:", error);
    });

    res.json({
      success: true,
      message: "Manual price check initiated"
    });
  } catch (error) {
    console.error("Manual check trigger error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to trigger manual check" 
    });
  }
});

// GET /api/price-alerts/service-status - Get monitoring service status
router.get("/service-status", authenticateToken, async (req, res) => {
  try {
    const status = priceMonitoringService.getStatus();
    
    res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error("Get service status error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to get service status" 
    });
  }
});

// POST /api/price-alerts/test-notification - Send test notification
router.post("/test-notification", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await notificationService.sendTestNotification(userId);
    
    res.json({
      success: result.success,
      message: result.success ? "Test notification sent" : "Failed to send test notification",
      error: result.error
    });
  } catch (error) {
    console.error("Test notification error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to send test notification" 
    });
  }
});

export default router;