// scripts/testRedemption.js
// Script to test reward redemption functionality

import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import User from "../models/User.js";
import LoyaltyReward from "../models/LoyaltyReward.js";
import { redeemReward } from "../controllers/loyaltyController.js";

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

async function testRedemption() {
  console.log("\n🧪 TESTING REWARD REDEMPTION...\n");

  try {
    // Check all loyalty records
    const allLoyalty = await LoyaltyReward.find({});
    console.log(`📊 Total loyalty records: ${allLoyalty.length}`);
    
    if (allLoyalty.length > 0) {
      console.log("💰 Loyalty records:");
      allLoyalty.forEach((record, index) => {
        console.log(`  ${index + 1}. User ID: ${record.userId}, Points: ${record.points}`);
      });
    }

    // Find a user with loyalty points and valid user reference
    let loyaltyRecord = null;
    const loyaltyRecords = await LoyaltyReward.find({ points: { $gt: 0 } });
    
    for (const record of loyaltyRecords) {
      const user = await User.findById(record.userId);
      if (user) {
        loyaltyRecord = record;
        loyaltyRecord.userId = user;
        break;
      }
    }
    
    if (!loyaltyRecord) {
      console.log("❌ No users with loyalty points found");
      // Let's create a test user with points
      const testUser = await User.findOne({});
      if (testUser) {
        console.log("🔧 Creating test loyalty record...");
        const newLoyalty = new LoyaltyReward({
          userId: testUser._id,
          points: 100,
          tier: 'Bronze',
          cardIssued: true,
          isActive: true
        });
        await newLoyalty.save();
        console.log(`✅ Created loyalty record for user: ${testUser.email} with 100 points`);
        
        // Use this new record for testing
        loyaltyRecord = newLoyalty;
        loyaltyRecord.userId = testUser;
      } else {
        console.log("❌ No users found in database");
        return;
      }
    }

    console.log(`👤 Testing with user: ${loyaltyRecord.userId.email || loyaltyRecord.userId._id}`);
    console.log(`💰 Current points: ${loyaltyRecord.points}`);

    // Test redemption with the cheapest reward
    const rewardName = "bonus-points"; // 25 points - cheapest reward
    
    console.log(`🎁 Attempting to redeem: ${rewardName}`);

    // Create a mock request object
    const mockReq = {
      user: {
        userId: loyaltyRecord.userId._id,
        id: loyaltyRecord.userId._id,
        _id: loyaltyRecord.userId._id
      },
      body: {
        rewardName: rewardName
      }
    };

    // Create a mock response object
    const mockRes = {
      json: (data) => {
        console.log("📤 Response:", JSON.stringify(data, null, 2));
        return mockRes;
      },
      status: (code) => {
        console.log(`📊 Status Code: ${code}`);
        return mockRes;
      }
    };

    // Test the redemption
    await redeemReward(mockReq, mockRes);

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error(error.stack);
  }
}

async function main() {
  await connectDB();
  await testRedemption();
  await mongoose.disconnect();
  console.log("\n✅ Test completed");
}

main().catch(console.error);