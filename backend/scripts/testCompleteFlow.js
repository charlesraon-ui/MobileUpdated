import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import LoyaltyReward from "../models/LoyaltyReward.js";
import { redeemReward, getUsableRewards } from "../controllers/loyaltyController.js";
import { markRewardsAsUsed } from "../controllers/loyaltyController.js";

dotenv.config();

const testCompleteFlow = async () => {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/goagri";
    await mongoose.connect(uri);
    console.log("✅ MongoDB connected");

    console.log("\n🧪 TESTING COMPLETE LOYALTY FLOW...\n");

    // Find test user
    const testUser = await User.findOne({ email: "test@gmail.com" });
    if (!testUser) {
      console.log("❌ Test user not found");
      return;
    }

    const loyaltyRecord = await LoyaltyReward.findOne({ userId: testUser._id });
    if (!loyaltyRecord) {
      console.log("❌ Loyalty record not found");
      return;
    }

    console.log(`👤 Found user: ${testUser._id}`);
    console.log(`💰 Current points: ${loyaltyRecord.points}`);

    // Check if user has any redeemed rewards
    const redeemedRewards = loyaltyRecord.pointsHistory.filter(entry => 
      entry.source === "reward_redeemed" && !entry.used
    );
    
    console.log(`🎁 Existing redeemed rewards: ${redeemedRewards.length}`);

    // Step 1: Get usable rewards
    console.log("\n📋 STEP 1: Getting usable rewards...");
    
    // Create mock req/res for getUsableRewards
    const mockReq = { user: { userId: testUser._id } };
    let usableRewards = [];
    const mockRes = {
      json: (data) => {
        if (data.success) {
          usableRewards = data.rewards;
        }
        console.log("📤 Usable rewards response:", data);
        return data;
      },
      status: (code) => ({
        json: (data) => {
          console.log(`📤 Usable rewards response (${code}):`, data);
          return data;
        }
      })
    };
    
    await getUsableRewards(mockReq, mockRes);
    console.log(`🎁 Usable rewards found: ${usableRewards.length}`);
    
    if (usableRewards.length > 0) {
      console.log("📝 Usable rewards:");
      usableRewards.forEach((reward, index) => {
        console.log(`  ${index + 1}. ID: ${reward.id}, Name: ${reward.name}, Type: ${reward.type}, Value: ${reward.value}`);
      });

      // Step 2: Test marking rewards as used
      console.log("\n🔄 STEP 2: Testing markRewardsAsUsed function...");
      const rewardIds = usableRewards.slice(0, 2).map(r => r.id.toString()); // Convert to string
      console.log(`🎯 Marking rewards as used: ${rewardIds.join(", ")}`);
      console.log(`🔍 Reward ID types:`, rewardIds.map(id => typeof id));
      
      const markResult = await markRewardsAsUsed(testUser._id, rewardIds);
      console.log(`📤 Mark result:`, markResult);

      // Step 3: Verify rewards are marked as used
      console.log("\n✅ STEP 3: Verifying rewards are marked as used...");
      let updatedUsableRewards = [];
      const mockRes2 = {
        json: (data) => {
          if (data.success) {
            updatedUsableRewards = data.rewards;
          }
          console.log("📤 Updated usable rewards response:", data);
          return data;
        },
        status: (code) => ({
          json: (data) => {
            console.log(`📤 Updated usable rewards response (${code}):`, data);
            return data;
          }
        })
      };
      
      await getUsableRewards(mockReq, mockRes2);
      console.log(`🎁 Usable rewards after marking: ${updatedUsableRewards.length}`);
      
      const markedRewards = usableRewards.filter(r => rewardIds.includes(r.id));
      const stillUsable = updatedUsableRewards.filter(r => rewardIds.includes(r.id));
      
      console.log(`🔍 Originally had ${markedRewards.length} rewards to mark`);
      console.log(`🔍 Still usable after marking: ${stillUsable.length}`);
      
      if (stillUsable.length === 0) {
        console.log("✅ SUCCESS: All marked rewards are no longer usable!");
      } else {
        console.log("⚠️ WARNING: Some rewards are still showing as usable");
      }
    } else {
      console.log("ℹ️ No usable rewards found. Let's redeem one first...");
      
      // Redeem a reward first
      console.log("\n🎁 STEP 1b: Redeeming a reward...");
      const redeemReq = {
        user: { userId: testUser._id },
        body: { rewardType: "bonus-points" }
      };
      
      const redeemRes = {
        json: (data) => {
          console.log("📤 Redemption response:", data);
          return data;
        },
        status: (code) => ({
          json: (data) => {
            console.log(`📤 Redemption response (${code}):`, data);
            return data;
          }
        })
      };
      
      await redeemReward(redeemReq, redeemRes);
      
      // Now get usable rewards again
      let newUsableRewards = [];
      const newMockRes = {
        json: (data) => {
          if (data.success) {
            newUsableRewards = data.rewards;
          }
          console.log("📤 New usable rewards response:", data);
          return data;
        },
        status: (code) => ({
          json: (data) => {
            console.log(`📤 New usable rewards response (${code}):`, data);
            return data;
          }
        })
      };
      
      await getUsableRewards(mockReq, newMockRes);
      console.log(`🎁 Usable rewards after redemption: ${newUsableRewards.length}`);
    }

    console.log("\n✅ Complete flow test finished");

  } catch (error) {
    console.error("❌ Test error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected");
  }
};

testCompleteFlow();