import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import LoyaltyReward from "../models/LoyaltyReward.js";
import { markRewardsAsUsed } from "../controllers/loyaltyController.js";

dotenv.config();

const debugMarkRewards = async () => {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGO_URI;
    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB");

    // Find test user
    const testUser = await User.findOne({ email: "test@gmail.com" });
    if (!testUser) {
      console.log("❌ Test user not found");
      return;
    }
    console.log("✅ Found test user:", testUser._id);

    // Get loyalty record
    const loyaltyRecord = await LoyaltyReward.findOne({ userId: testUser._id });
    if (!loyaltyRecord) {
      console.log("❌ Loyalty record not found");
      return;
    }

    // Get reward entries
    const rewardEntries = loyaltyRecord.pointsHistory.filter(entry => entry.source === "reward_redeemed");
    console.log("🎁 Reward entries found:", rewardEntries.length);
    
    rewardEntries.forEach((entry, i) => {
      console.log(`   ${i+1}. ID: ${entry._id} (type: ${typeof entry._id})`);
      console.log(`       toString(): ${entry._id.toString()}`);
      console.log(`       Name: ${entry.rewardName}, Used: ${entry.used}`);
    });

    // Get reward IDs to mark
    const rewardIds = rewardEntries.map(entry => entry._id.toString());
    console.log("\n🎯 Reward IDs to mark:", rewardIds);
    console.log("   Types:", rewardIds.map(id => typeof id));

    // Test markRewardsAsUsed function with debug
    console.log("\n🔧 Testing markRewardsAsUsed function...");
    
    // Add debug logging to the function call
    const result = await markRewardsAsUsed(testUser._id, rewardIds);
    console.log("📤 Result:", result);

    // Verify the changes
    console.log("\n🔍 Verifying changes...");
    const updatedRecord = await LoyaltyReward.findOne({ userId: testUser._id });
    const updatedRewardEntries = updatedRecord.pointsHistory.filter(entry => entry.source === "reward_redeemed");
    
    console.log("   Updated reward entries:");
    updatedRewardEntries.forEach((entry, i) => {
      console.log(`     ${i+1}. ID: ${entry._id}, Name: ${entry.rewardName}, Used: ${entry.used}`);
    });

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected");
  }
};

debugMarkRewards();