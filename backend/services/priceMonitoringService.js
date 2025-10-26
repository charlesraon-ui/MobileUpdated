import cron from 'node-cron';
import User from '../models/User.js';
import Product from '../models/Products.js';
import PriceAlert from '../models/PriceAlert.js';
import { sendPushNotification } from './notificationService.js';

class PriceMonitoringService {
  constructor() {
    this.isRunning = false;
    this.cronJob = null;
  }

  // Start the price monitoring service
  start() {
    if (this.isRunning) {
      console.log('Price monitoring service is already running');
      return;
    }

    console.log('🔍 Starting price monitoring service...');
    
    // Schedule daily price checks at 9:00 AM
    this.cronJob = cron.schedule('0 9 * * *', async () => {
      console.log('🔍 Running daily price monitoring check...');
      await this.checkAllWishlistPrices();
    }, {
      scheduled: true,
      timezone: "America/New_York" // Adjust timezone as needed
    });

    // Also run immediate stock checks every 30 minutes
    this.stockCronJob = cron.schedule('*/30 * * * *', async () => {
      console.log('📦 Running stock monitoring check...');
      await this.checkStockStatus();
    }, {
      scheduled: true,
      timezone: "America/New_York"
    });

    this.isRunning = true;
    console.log('✅ Price monitoring service started successfully');
    
    // Run initial check
    setTimeout(() => {
      this.checkAllWishlistPrices();
      this.checkStockStatus();
    }, 5000); // Wait 5 seconds after startup
  }

  // Stop the price monitoring service
  stop() {
    if (!this.isRunning) {
      console.log('Price monitoring service is not running');
      return;
    }

    console.log('🛑 Stopping price monitoring service...');
    
    if (this.cronJob) {
      this.cronJob.destroy();
      this.cronJob = null;
    }
    
    if (this.stockCronJob) {
      this.stockCronJob.destroy();
      this.stockCronJob = null;
    }

    this.isRunning = false;
    console.log('✅ Price monitoring service stopped');
  }

  // Check prices for all wishlist items
  async checkAllWishlistPrices() {
    try {
      console.log('🔍 Starting comprehensive price check...');
      
      // Get all users with wishlist items
      const users = await User.find({ 
        wishlist: { $exists: true, $not: { $size: 0 } } 
      }).populate('wishlist');

      let totalChecked = 0;
      let alertsSent = 0;

      for (const user of users) {
        if (!user.wishlist || user.wishlist.length === 0) continue;

        console.log(`👤 Checking wishlist for user: ${user.email} (${user.wishlist.length} items)`);

        for (const product of user.wishlist) {
          try {
            const result = await this.checkProductPrice(user._id, product);
            totalChecked++;
            
            if (result.alertSent) {
              alertsSent++;
            }
          } catch (error) {
            console.error(`❌ Error checking price for product ${product._id}:`, error.message);
          }
        }
      }

      console.log(`✅ Price check completed. Checked: ${totalChecked}, Alerts sent: ${alertsSent}`);
    } catch (error) {
      console.error('❌ Error in checkAllWishlistPrices:', error);
    }
  }

  // Check price for a specific product for a specific user
  async checkProductPrice(userId, product) {
    try {
      // Find or create price alert record
      let priceAlert = await PriceAlert.findOne({ userId, productId: product._id });
      
      if (!priceAlert) {
        // Create new price alert record
        priceAlert = new PriceAlert({
          userId,
          productId: product._id,
          originalPrice: product.price,
          currentPrice: product.price,
          lowestPrice: product.price,
          originalStock: product.stock || 0,
          currentStock: product.stock || 0,
          priceHistory: [{
            price: product.price,
            date: new Date()
          }]
        });
      } else {
        // Update existing record with new price
        priceAlert.addPricePoint(product.price);
      }

      // Check if we should send a price drop alert
      const shouldAlert = priceAlert.shouldSendPriceAlert();
      let alertSent = false;

      if (shouldAlert) {
        await this.sendPriceDropNotification(userId, product, priceAlert);
        priceAlert.lastPriceNotification = new Date();
        alertSent = true;
      }

      await priceAlert.save();

      return { alertSent, priceAlert };
    } catch (error) {
      console.error(`Error checking price for product ${product._id}:`, error);
      throw error;
    }
  }

  // Check stock status for all wishlist items
  async checkStockStatus() {
    try {
      console.log('📦 Starting stock status check...');
      
      // Get all price alerts where items were out of stock
      const outOfStockAlerts = await PriceAlert.find({ 
        wasOutOfStock: true,
        notificationsEnabled: true 
      }).populate('userId').populate('productId');

      let stockAlertsChecked = 0;
      let stockAlertsSent = 0;

      for (const alert of outOfStockAlerts) {
        try {
          if (!alert.productId || !alert.userId) continue;

          // Refresh product data
          const product = await Product.findById(alert.productId._id);
          if (!product) continue;

          const stockChanged = alert.updateStock(product.stock || 0);
          
          if (stockChanged && alert.shouldSendStockAlert()) {
            await this.sendStockAvailableNotification(alert.userId._id, product, alert);
            alert.lastStockNotification = new Date();
            stockAlertsSent++;
          }

          await alert.save();
          stockAlertsChecked++;
        } catch (error) {
          console.error(`❌ Error checking stock for alert ${alert._id}:`, error.message);
        }
      }

      console.log(`✅ Stock check completed. Checked: ${stockAlertsChecked}, Alerts sent: ${stockAlertsSent}`);
    } catch (error) {
      console.error('❌ Error in checkStockStatus:', error);
    }
  }

  // Send price drop notification
  async sendPriceDropNotification(userId, product, priceAlert) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      const oldPrice = priceAlert.originalPrice;
      const newPrice = priceAlert.currentPrice;
      const savings = oldPrice - newPrice;
      const percentageOff = Math.round((savings / oldPrice) * 100);

      const notification = {
        title: '💰 Price Drop Alert!',
        body: `${product.name} is now $${newPrice.toFixed(2)} (was $${oldPrice.toFixed(2)}) - Save ${percentageOff}%!`,
        data: {
          type: 'price_drop',
          productId: product._id.toString(),
          oldPrice: oldPrice.toString(),
          newPrice: newPrice.toString(),
          savings: savings.toString(),
          deepLink: `/product/${product._id}`
        }
      };

      await sendPushNotification(user, notification);
      console.log(`💰 Price drop notification sent to ${user.email} for ${product.name}`);
    } catch (error) {
      console.error('Error sending price drop notification:', error);
    }
  }

  // Send stock available notification
  async sendStockAvailableNotification(userId, product, priceAlert) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      const notification = {
        title: '📦 Back in Stock!',
        body: `${product.name} is now available! Get it before it's gone again.`,
        data: {
          type: 'stock_available',
          productId: product._id.toString(),
          stock: product.stock.toString(),
          deepLink: `/product/${product._id}`
        }
      };

      await sendPushNotification(user, notification);
      console.log(`📦 Stock available notification sent to ${user.email} for ${product.name}`);
    } catch (error) {
      console.error('Error sending stock available notification:', error);
    }
  }

  // Manual trigger for testing
  async runManualCheck() {
    console.log('🔧 Running manual price and stock check...');
    await Promise.all([
      this.checkAllWishlistPrices(),
      this.checkStockStatus()
    ]);
    console.log('✅ Manual check completed');
  }

  // Get service status
  getStatus() {
    return {
      isRunning: this.isRunning,
      cronJobActive: this.cronJob ? this.cronJob.running : false,
      stockCronJobActive: this.stockCronJob ? this.stockCronJob.running : false
    };
  }
}

// Create singleton instance
const priceMonitoringService = new PriceMonitoringService();

export default priceMonitoringService;