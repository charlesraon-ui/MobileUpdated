import admin from 'firebase-admin';
import User from '../models/User.js';

// Initialize Firebase Admin SDK (you'll need to add your service account key)
let firebaseInitialized = false;

const initializeFirebase = () => {
  if (firebaseInitialized) return;
  
  try {
    // For now, we'll use a mock implementation
    // In production, you would initialize with your Firebase service account:
    /*
    const serviceAccount = require('../config/firebase-service-account.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    */
    
    console.log('📱 Firebase Admin SDK initialized (mock mode)');
    firebaseInitialized = true;
  } catch (error) {
    console.error('❌ Error initializing Firebase:', error);
  }
};

class NotificationService {
  constructor() {
    initializeFirebase();
  }

  // Send push notification to a user
  async sendPushNotification(user, notification) {
    try {
      // For now, we'll log the notification instead of actually sending it
      // In production, you would send actual push notifications
      
      console.log(`📱 PUSH NOTIFICATION for ${user.email}:`);
      console.log(`   Title: ${notification.title}`);
      console.log(`   Body: ${notification.body}`);
      console.log(`   Data:`, notification.data);
      
      // Mock implementation - in production you would do:
      /*
      if (user.fcmToken) {
        const message = {
          notification: {
            title: notification.title,
            body: notification.body,
          },
          data: notification.data || {},
          token: user.fcmToken,
        };

        const response = await admin.messaging().send(message);
        console.log('Successfully sent message:', response);
        return { success: true, messageId: response };
      } else {
        console.log('User has no FCM token, cannot send push notification');
        return { success: false, error: 'No FCM token' };
      }
      */
      
      // For demo purposes, we'll also store the notification in the user's notification history
      await this.saveNotificationToHistory(user._id, notification);
      
      return { success: true, messageId: 'mock_' + Date.now() };
    } catch (error) {
      console.error('❌ Error sending push notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Send notification to multiple users
  async sendBulkNotifications(users, notification) {
    const results = [];
    
    for (const user of users) {
      try {
        const result = await this.sendPushNotification(user, notification);
        results.push({ userId: user._id, ...result });
      } catch (error) {
        results.push({ userId: user._id, success: false, error: error.message });
      }
    }
    
    return results;
  }

  // Save notification to user's history for in-app display
  async saveNotificationToHistory(userId, notification) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      // Initialize notifications array if it doesn't exist
      if (!user.notifications) {
        user.notifications = [];
      }

      // Add new notification
      user.notifications.unshift({
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        createdAt: new Date(),
        read: false
      });

      // Keep only last 50 notifications
      if (user.notifications.length > 50) {
        user.notifications = user.notifications.slice(0, 50);
      }

      await user.save();
      console.log(`💾 Notification saved to history for user ${user.email}`);
    } catch (error) {
      console.error('❌ Error saving notification to history:', error);
    }
  }

  // Send price drop notification
  async sendPriceDropAlert(userId, product, oldPrice, newPrice) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

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

      return await this.sendPushNotification(user, notification);
    } catch (error) {
      console.error('❌ Error sending price drop alert:', error);
      return { success: false, error: error.message };
    }
  }

  // Send stock available notification
  async sendStockAlert(userId, product) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      const notification = {
        title: '📦 Back in Stock!',
        body: `${product.name} is now available! Get it before it's gone again.`,
        data: {
          type: 'stock_available',
          productId: product._id.toString(),
          stock: (product.stock || 0).toString(),
          deepLink: `/product/${product._id}`
        }
      };

      return await this.sendPushNotification(user, notification);
    } catch (error) {
      console.error('❌ Error sending stock alert:', error);
      return { success: false, error: error.message };
    }
  }

  // Register FCM token for a user
  async registerFCMToken(userId, fcmToken) {
    try {
      await User.findByIdAndUpdate(userId, { fcmToken });
      console.log(`📱 FCM token registered for user ${userId}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error registering FCM token:', error);
      return { success: false, error: error.message };
    }
  }

  // Get notification history for a user
  async getNotificationHistory(userId, limit = 20) {
    try {
      const user = await User.findById(userId).select('notifications');
      if (!user || !user.notifications) {
        return [];
      }

      return user.notifications.slice(0, limit);
    } catch (error) {
      console.error('❌ Error getting notification history:', error);
      return [];
    }
  }

  // Mark notifications as read
  async markNotificationsAsRead(userId, notificationIds = []) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.notifications) return;

      if (notificationIds.length === 0) {
        // Mark all as read
        user.notifications.forEach(notification => {
          notification.read = true;
        });
      } else {
        // Mark specific notifications as read
        user.notifications.forEach(notification => {
          if (notificationIds.includes(notification._id.toString())) {
            notification.read = true;
          }
        });
      }

      await user.save();
      return { success: true };
    } catch (error) {
      console.error('❌ Error marking notifications as read:', error);
      return { success: false, error: error.message };
    }
  }

  // Test notification (for development)
  async sendTestNotification(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return { success: false, error: 'User not found' };

      const notification = {
        title: '🧪 Test Notification',
        body: 'This is a test notification from the price monitoring service.',
        data: {
          type: 'test',
          timestamp: new Date().toISOString()
        }
      };

      return await this.sendPushNotification(user, notification);
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();

// Export both the class and the main function for backward compatibility
export default notificationService;
export const sendPushNotification = (user, notification) => notificationService.sendPushNotification(user, notification);