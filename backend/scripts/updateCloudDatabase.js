import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import LoyaltyReward from "../models/LoyaltyReward.js";

dotenv.config();

const updateCloudDatabase = async () => {
  try {
    // Connect to the cloud MongoDB (using MONGO_URI from .env)
    const uri = process.env.MONGO_URI;
    await mongoose.connect(uri);
    console.log("✅ Connected to cloud MongoDB");

    // Find the test user
    const testUser = await User.findOne({ email: "test@gmail.com" });
    if (!testUser) {
      console.log("❌ Test user not found in cloud database");
      return;
    }
    console.log("✅ Found test user:", testUser._id);

    // Find the loyalty record
    const loyaltyRecord = await LoyaltyReward.findOne({ userId: testUser._id });
    if (!loyaltyRecord) {
      console.log("❌ Loyalty record not found");
      return;
    }

    console.log("📊 Current loyalty record:");
    console.log("   Points:", loyaltyRecord.points);
    console.log("   History entries:", loyaltyRecord.pointsHistory.length);
    
    // Find reward redemption entries
    const rewardEntries = loyaltyRecord.pointsHistory.filter(entry => entry.source === "reward_redeemed");
    console.log("   Reward entries:", rewardEntries.length);
    rewardEntries.forEach((entry, i) => {
      console.log(`     ${i+1}. ID: ${entry._id}, Name: ${entry.rewardName}, Used: ${entry.used}`);
    });

    // Update the reward entries to have proper reward names
    console.log("\n🔧 Updating reward entries...");
    let updated = false;
    
    loyaltyRecord.pointsHistory.forEach(entry => {
      if (entry.source === "reward_redeemed") {
        if (!entry.rewardName || entry.rewardName === undefined) {
          // Assign reward names based on points deducted
          if (entry.points === -25) {
            entry.rewardName = "bonus-points";
            console.log(`   Updated entry ${entry._id} to bonus-points`);
            updated = true;
          } else if (entry.points === -50) {
            entry.rewardName = "discount-100";
            console.log(`   Updated entry ${entry._id} to discount-100`);
            updated = true;
          } else if (entry.points === -100) {
            entry.rewardName = "discount-200";
            console.log(`   Updated entry ${entry._id} to discount-200`);
            updated = true;
          }
        }
        
        // Reset used field to false for testing
        if (entry.used !== false) {
          entry.used = false;
          console.log(`   Reset used=false for entry ${entry._id}`);
          updated = true;
        }
      }
    });

    if (updated) {
      await loyaltyRecord.save();
      console.log("✅ Loyalty record updated successfully");
    } else {
      console.log("ℹ️ No updates needed");
    }

    // Verify the updates
    console.log("\n🔍 Verification after update:");
    const updatedRecord = await LoyaltyReward.findOne({ userId: testUser._id });
    const updatedRewardEntries = updatedRecord.pointsHistory.filter(entry => entry.source === "reward_redeemed");
    console.log("   Updated reward entries:", updatedRewardEntries.length);
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

updateCloudDatabase();