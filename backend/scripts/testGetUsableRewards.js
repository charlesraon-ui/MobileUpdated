import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import LoyaltyReward from "../models/LoyaltyReward.js";
import { getUsableRewards } from "../controllers/loyaltyController.js";

dotenv.config();

const testGetUsableRewards = async () => {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/goagri";
    await mongoose.connect(uri);
    console.log("✅ MongoDB connected to:", uri);

    // Find test user
    const testUser = await User.findOne({ email: "test@gmail.com" });
    if (!testUser) {
      console.log("❌ Test user not found");
      return;
    }
    console.log("✅ Found test user:", testUser._id);

    // Get loyalty record directly from database
    const loyaltyRecord = await LoyaltyReward.findOne({ userId: testUser._id });
    if (!loyaltyRecord) {
      console.log("❌ Loyalty record not found");
      return;
    }
    
    console.log("✅ Found loyalty record:");
    console.log("   Points:", loyaltyRecord.points);
    console.log("   History entries:", loyaltyRecord.pointsHistory.length);
    
    const rewardEntries = loyaltyRecord.pointsHistory.filter(entry => entry.source === "reward_redeemed");
    console.log("   Reward entries:", rewardEntries.length);
    rewardEntries.forEach((entry, i) => {
      console.log(`     ${i+1}. ID: ${entry._id}, Name: ${entry.rewardName}, Used: ${entry.used}`);
    });

    // Test getUsableRewards function
    console.log("\n🧪 Testing getUsableRewards function...");
    
    const mockReq = {
      user: { userId: testUser._id }
    };
    
    const mockRes = {
      json: (data) => {
        console.log("📤 getUsableRewards response:", JSON.stringify(data, null, 2));
        return mockRes;
      },
      status: (code) => {
        console.log("📤 Status code:", code);
        return mockRes;
      }
    };

    await getUsableRewards(mockReq, mockRes);

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected");
  }
};

testGetUsableRewards();