// Test script to verify loyalty points system
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import LoyaltyReward from './models/LoyaltyReward.js';
import Order from './models/Order.js';
import User from './models/User.js';
import { updateLoyaltyAfterPurchase } from './controllers/loyaltyController.js';

dotenv.config();

async function testLoyaltySystem() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find a test user (first user in database)
    const testUser = await User.findOne().limit(1);
    if (!testUser) {
      console.log('❌ No users found in database');
      return;
    }

    console.log(`🧪 Testing loyalty system for user: ${testUser.name} (${testUser._id})`);

    // Check current loyalty status
    let loyalty = await LoyaltyReward.findOne({ userId: testUser._id });
    console.log('📊 Current loyalty status:', {
      points: loyalty?.points || 0,
      purchaseCount: loyalty?.purchaseCount || 0,
      totalSpent: loyalty?.totalSpent || 0,
      tier: loyalty?.tier || 'none'
    });

    // Check recent orders
    const recentOrders = await Order.find({ 
      userId: testUser._id,
      $or: [
        { status: "completed" },
        { status: "confirmed", paymentStatus: "paid" }
      ]
    }).sort({ createdAt: -1 }).limit(5);

    console.log(`📦 Found ${recentOrders.length} completed/confirmed orders:`);
    recentOrders.forEach((order, index) => {
      console.log(`  ${index + 1}. Order ${order._id}: ₱${order.total} - ${order.status} (${order.paymentStatus || 'N/A'})`);
    });

    // Test awarding points for a recent order
    if (recentOrders.length > 0) {
      const testOrder = recentOrders[0];
      console.log(`\n🎯 Testing point award for order: ${testOrder._id} (₱${testOrder.total})`);
      
      const result = await updateLoyaltyAfterPurchase(testUser._id, testOrder.total, testOrder._id);
      
      if (result) {
        console.log('✅ Points awarded successfully');
        console.log('📊 Updated loyalty status:', {
          points: result.points,
          purchaseCount: result.purchaseCount,
          totalSpent: result.totalSpent,
          tier: result.tier
        });
      } else {
        console.log('❌ Failed to award points');
      }
    }

    // Check final loyalty status
    loyalty = await LoyaltyReward.findOne({ userId: testUser._id });
    console.log('\n📊 Final loyalty status:', {
      points: loyalty?.points || 0,
      purchaseCount: loyalty?.purchaseCount || 0,
      totalSpent: loyalty?.totalSpent || 0,
      tier: loyalty?.tier || 'none',
      isEligible: loyalty?.isEligible || false,
      cardIssued: loyalty?.cardIssued || false
    });

    // Show points history
    if (loyalty?.pointsHistory?.length > 0) {
      console.log('\n📈 Points history:');
      loyalty.pointsHistory.slice(-5).forEach((entry, index) => {
        console.log(`  ${index + 1}. ${entry.points} points from ${entry.source} on ${entry.createdAt.toLocaleDateString()}`);
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testLoyaltySystem();