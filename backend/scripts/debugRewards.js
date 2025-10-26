import mongoose from "mongoose";
import LoyaltyReward from "../models/LoyaltyReward.js";
import User from "../models/User.js";

async function debugRewards() {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/goagri";
    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB");
    console.log("🔗 Connected to:", uri);

    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("📁 Collections in database:");
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });

    // Check users collection
    const allUsers = await User.find({});
    console.log(`👥 Total users: ${allUsers.length}`);
    
    // Find any user with reward redemptions
    const allLoyaltyRecords = await LoyaltyReward.find({});
    console.log(`📊 Total loyalty records: ${allLoyaltyRecords.length}`);

    if (allLoyaltyRecords.length === 0) {
      console.log("❌ No loyalty records found. Creating test data...");
      
      // Create a test user if none exists
      let testUser = allUsers.find(u => u.email === "test@gmail.com");
      if (!testUser) {
        testUser = new User({
          email: "test@gmail.com",
          name: "Test User",
          passwordHash: "hashedpassword"
        });
        await testUser.save();
        console.log("✅ Created test user");
      }

      // Create loyalty record with some test data
      const loyaltyRecord = new LoyaltyReward({
        userId: testUser._id,
        points: 1000,
        purchaseCount: 5,
        totalSpent: 5000,
        pointsHistory: [
          {
            points: 500,
            source: "purchase",
            createdAt: new Date(Date.now() - 86400000) // 1 day ago
          },
          {
            points: 500,
            source: "purchase", 
            createdAt: new Date(Date.now() - 43200000) // 12 hours ago
          },
          {
            points: -25,
            source: "reward_redeemed",
            rewardName: "bonus-points",
            createdAt: new Date(Date.now() - 3600000), // 1 hour ago
            used: false
          }
        ]
      });
      
      await loyaltyRecord.save();
      console.log("✅ Created test loyalty record with reward redemption");
      
      // Now find the test user
      const testLoyalty = await LoyaltyReward.findOne({ userId: testUser._id });
      console.log("🎁 Test loyalty record created with points:", testLoyalty.points);
      console.log("📝 Points history entries:", testLoyalty.pointsHistory.length);
      
      return;
    }

    // Find user with reward redemptions
    const testUser = allLoyaltyRecords.find(user => 
      user.pointsHistory.some(entry => entry.source === "reward_redeemed")
    );

    if (!testUser) {
      console.log("❌ No user found with reward redemptions");
      // Show first user for debugging
      if (allLoyaltyRecords.length > 0) {
        const firstUser = allLoyaltyRecords[0];
        console.log("🔍 First loyalty record for reference:");
        console.log("   UserID:", firstUser.userId);
        console.log("   Points history entries:", firstUser.pointsHistory.length);
        console.log("   Recent entries:");
        firstUser.pointsHistory.slice(-3).forEach((entry, i) => {
          console.log(`     ${i+1}. Source: ${entry.source}, Points: ${entry.points}`);
        });
      }
      return;
    }

    console.log("👤 Found user:", testUser.userId);
    console.log("📊 Total points history entries:", testUser.pointsHistory.length);

    // Show all reward_redeemed entries
    const rewardEntries = testUser.pointsHistory.filter(entry => 
      entry.source === "reward_redeemed"
    );

    console.log("\n🎁 Reward redemption entries:");
    rewardEntries.forEach((entry, index) => {
      console.log(`  ${index + 1}. ID: ${entry._id}`);
      console.log(`     Source: ${entry.source}`);
      console.log(`     RewardName: ${entry.rewardName}`);
      console.log(`     Points: ${entry.points}`);
      console.log(`     Used: ${entry.used}`);
      console.log(`     Created: ${entry.createdAt}`);
      console.log("");
    });

    // Show recent entries
    console.log("\n📝 Recent 5 entries:");
    const recentEntries = testUser.pointsHistory.slice(-5);
    recentEntries.forEach((entry, index) => {
      console.log(`  ${index + 1}. Source: ${entry.source}, Points: ${entry.points}, RewardName: ${entry.rewardName || 'N/A'}`);
    });

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected");
  }
}

debugRewards();