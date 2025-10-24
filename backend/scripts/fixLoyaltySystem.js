// scripts/fixLoyaltySystem.js
// Script to diagnose and fix loyalty system issues

import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import User from "../models/User.js";
import Order from "../models/Order.js";
import LoyaltyReward from "../models/LoyaltyReward.js";
import { updateLoyaltyAfterPurchase } from "../controllers/loyaltyController.js";

async function connectDB() {
  try {
    const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/goagri";
    await mongoose.connect(uri, { maxPoolSize: 10 });
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err?.message || err);
    process.exit(1);
  }
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id;
}

async function diagnoseLoyaltySystem() {
  console.log("\n🔍 DIAGNOSING LOYALTY SYSTEM...\n");

  // 1. Check if loyalty models exist
  try {
    const loyaltyCount = await LoyaltyReward.countDocuments();
    console.log(`📊 Total loyalty records: ${loyaltyCount}`);
  } catch (error) {
    console.error("❌ Error accessing LoyaltyReward model:", error.message);
    return false;
  }

  // 2. Check order statuses
  try {
    const orderStatuses = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    console.log("📦 Order statuses:");
    orderStatuses.forEach(status => {
      console.log(`  ${status._id}: ${status.count} orders`);
    });
  } catch (error) {
    console.error("❌ Error checking order statuses:", error.message);
  }

  // 3. Check for valid vs invalid user IDs in orders
  try {
    const allOrders = await Order.find({}, 'userId status total createdAt').lean();
    const validOrders = allOrders.filter(order => isValidObjectId(order.userId));
    const invalidOrders = allOrders.filter(order => !isValidObjectId(order.userId));
    
    console.log(`📦 Total orders: ${allOrders.length}`);
    console.log(`✅ Orders with valid user IDs: ${validOrders.length}`);
    console.log(`❌ Orders with invalid user IDs: ${invalidOrders.length}`);
    
    if (invalidOrders.length > 0) {
      console.log("Invalid user IDs found:");
      invalidOrders.slice(0, 5).forEach(order => {
        console.log(`  Order ${order._id}: userId="${order.userId}" (${typeof order.userId})`);
      });
    }
  } catch (error) {
    console.error("❌ Error checking order user IDs:", error.message);
  }

  // 4. Check recent valid orders and their loyalty status
  try {
    const recentOrders = await Order.find({
      userId: { $type: "objectId" } // Only get orders with valid ObjectId userIds
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'name email');
    
    console.log(`📦 Recent valid orders: ${recentOrders.length}`);
    
    for (const order of recentOrders) {
      if (order.userId) {
        const loyalty = await LoyaltyReward.findOne({ userId: order.userId._id });
        console.log(`Order ${order._id}: ₱${order.total} - User: ${order.userId.name} - Points: ${loyalty?.points || 0}`);
      }
    }
  } catch (error) {
    console.error("❌ Error checking recent orders:", error.message);
    return false;
  }

  // 5. Check for users with orders but no loyalty records
  try {
    const usersWithOrders = await Order.distinct('userId', {
      userId: { $type: "objectId" }
    });
    const usersWithLoyalty = await LoyaltyReward.distinct('userId');
    
    const usersWithoutLoyalty = usersWithOrders.filter(
      userId => !usersWithLoyalty.some(loyaltyUserId => loyaltyUserId.toString() === userId.toString())
    );
    
    console.log(`👥 Users with valid orders: ${usersWithOrders.length}`);
    console.log(`🎯 Users with loyalty records: ${usersWithLoyalty.length}`);
    console.log(`⚠️  Users missing loyalty records: ${usersWithoutLoyalty.length}`);
    
    return usersWithoutLoyalty;
  } catch (error) {
    console.error("❌ Error checking user loyalty status:", error.message);
    return false;
  }
}

async function fixMissingLoyaltyRecords(usersWithoutLoyalty) {
  if (!usersWithoutLoyalty || usersWithoutLoyalty.length === 0) {
    console.log("✅ No missing loyalty records to fix");
    return;
  }

  console.log(`\n🔧 FIXING ${usersWithoutLoyalty.length} MISSING LOYALTY RECORDS...\n`);

  for (const userId of usersWithoutLoyalty) {
    try {
      // Get all orders for this user (any status since we want to award points for all purchases)
      const userOrders = await Order.find({
        userId,
        total: { $gt: 0 } // Only orders with positive total
      }).sort({ createdAt: 1 });

      if (userOrders.length === 0) continue;

      const user = await User.findById(userId, 'name email');
      console.log(`👤 Processing user ${user?.name || userId} with ${userOrders.length} orders`);

      // Process each order to award loyalty points
      for (const order of userOrders) {
        await updateLoyaltyAfterPurchase(order.userId, order.total, order._id);
        console.log(`  ✅ Processed order ${order._id}: ₱${order.total} (${order.status})`);
      }

      // Verify the loyalty record was created
      const loyalty = await LoyaltyReward.findOne({ userId });
      if (loyalty) {
        console.log(`  🎯 Final loyalty status: ${loyalty.points} points, ${loyalty.purchaseCount} purchases, ₱${loyalty.totalSpent} spent`);
      }
    } catch (error) {
      console.error(`❌ Error processing user ${userId}:`, error.message);
    }
  }
}

async function recalculateAllLoyaltyPoints() {
  console.log("\n🔄 RECALCULATING ALL LOYALTY POINTS...\n");

  try {
    // Get all users with valid orders
    const usersWithOrders = await Order.distinct('userId', {
      userId: { $type: "objectId" },
      total: { $gt: 0 }
    });
    
    console.log(`Found ${usersWithOrders.length} users with valid orders`);
    
    for (const userId of usersWithOrders) {
      try {
        // Reset loyalty record
        await LoyaltyReward.deleteOne({ userId });
        
        // Get all orders for this user
        const userOrders = await Order.find({
          userId,
          total: { $gt: 0 }
        }).sort({ createdAt: 1 });

        if (userOrders.length === 0) continue;

        const user = await User.findById(userId, 'name email');
        console.log(`👤 Recalculating for user ${user?.name || userId} with ${userOrders.length} orders`);

        // Process each order to award loyalty points
        for (const order of userOrders) {
          await updateLoyaltyAfterPurchase(order.userId, order.total, order._id);
        }

        // Verify the loyalty record
        const loyalty = await LoyaltyReward.findOne({ userId });
        if (loyalty) {
          console.log(`  🎯 Final: ${loyalty.points} points, ${loyalty.purchaseCount} purchases, ₱${loyalty.totalSpent} spent`);
        }
      } catch (error) {
        console.error(`❌ Error processing user ${userId}:`, error.message);
      }
    }
  } catch (error) {
    console.error("❌ Error recalculating loyalty points:", error.message);
  }
}

async function addTestPointsToUser(userEmail, points = 250) {
  console.log(`\n🎁 ADDING ${points} TEST POINTS TO USER: ${userEmail}\n`);

  try {
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      console.error(`❌ User not found: ${userEmail}`);
      return;
    }

    let loyalty = await LoyaltyReward.findOne({ userId: user._id });
    if (!loyalty) {
      loyalty = new LoyaltyReward({ userId: user._id });
    }

    loyalty.points += points;
    loyalty.pointsHistory.push({
      points: points,
      source: "admin_test_points",
      createdAt: new Date(),
    });

    loyalty.checkEligibility();
    await loyalty.save();

    console.log(`✅ Added ${points} points to ${userEmail}`);
    console.log(`🎯 Total points: ${loyalty.points}`);
  } catch (error) {
    console.error("❌ Error adding test points:", error.message);
  }
}

async function makeUserEligible(email) {
  console.log(`\n🎯 MAKING USER ELIGIBLE: ${email}\n`);

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.error(`❌ User not found: ${email}`);
      return;
    }

    // Find loyalty record
    const loyaltyRecord = await LoyaltyReward.findOne({ userId: user._id });
    if (!loyaltyRecord) {
      console.error(`❌ Loyalty record not found for: ${email}`);
      return;
    }

    // Make user eligible
    loyaltyRecord.isEligible = true;
    loyaltyRecord.cardIssued = true;
    loyaltyRecord.cardIssuedDate = new Date();
    loyaltyRecord.cardId = `LOYAL-${user._id.toString().slice(-6)}-${Date.now().toString().slice(-6)}`;
    
    // Set expiry date to 1 year from now
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    loyaltyRecord.expiryDate = expiryDate;

    await loyaltyRecord.save();
    console.log(`✅ User ${email} is now eligible for loyalty rewards`);
    console.log(`🎯 Points: ${loyaltyRecord.points}`);
    console.log(`🎯 Card ID: ${loyaltyRecord.cardId}`);

  } catch (error) {
    console.error("❌ Error making user eligible:", error.message);
  }
}

async function cleanInvalidOrders() {
  console.log("\n🧹 CLEANING INVALID ORDERS...\n");

  try {
    const invalidOrders = await Order.find({
      userId: { $not: { $type: "objectId" } }
    });

    console.log(`Found ${invalidOrders.length} orders with invalid user IDs`);

    for (const order of invalidOrders) {
      console.log(`Deleting order ${order._id} with invalid userId: ${order.userId}`);
      await Order.deleteOne({ _id: order._id });
    }

    console.log(`✅ Cleaned ${invalidOrders.length} invalid orders`);
  } catch (error) {
    console.error("❌ Error cleaning invalid orders:", error.message);
  }
}

async function main() {
  await connectDB();

  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'diagnose':
      await diagnoseLoyaltySystem();
      break;
    
    case 'fix':
      const usersWithoutLoyalty = await diagnoseLoyaltySystem();
      if (usersWithoutLoyalty) {
        await fixMissingLoyaltyRecords(usersWithoutLoyalty);
      }
      break;
    
    case 'recalculate':
      await recalculateAllLoyaltyPoints();
      break;
    
    case 'test-points':
      const email = args[1] || 'test@gmail.com';
      const points = parseInt(args[2]) || 250;
      await addTestPointsToUser(email, points);
      break;
    
    case 'clean':
      await cleanInvalidOrders();
      break;
    
    case 'make-eligible':
      const eligibleEmail = args[1] || 'test@gmail.com';
      await makeUserEligible(eligibleEmail);
      break;
    
    default:
      console.log(`
🔧 LOYALTY SYSTEM FIX SCRIPT

Usage:
  node scripts/fixLoyaltySystem.js diagnose          - Check loyalty system status
  node scripts/fixLoyaltySystem.js fix              - Fix missing loyalty records
  node scripts/fixLoyaltySystem.js recalculate      - Recalculate all loyalty points
  node scripts/fixLoyaltySystem.js test-points [email] [points] - Add test points to user
  node scripts/fixLoyaltySystem.js make-eligible [email] - Make user eligible for loyalty rewards
  node scripts/fixLoyaltySystem.js clean            - Remove orders with invalid user IDs

Examples:
  node scripts/fixLoyaltySystem.js diagnose
  node scripts/fixLoyaltySystem.js fix
  node scripts/fixLoyaltySystem.js test-points test@gmail.com 250
  node scripts/fixLoyaltySystem.js make-eligible test@gmail.com
  node scripts/fixLoyaltySystem.js clean
      `);
  }

  await mongoose.disconnect();
  console.log("\n✅ Script completed");
}

main().catch(console.error);