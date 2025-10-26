import mongoose from "mongoose";
import LoyaltyReward from "../models/LoyaltyReward.js";
import User from "../models/User.js";

async function checkDatabase() {
  try {
    const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/goagri";
    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB:", uri);

    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("📁 Collections:", collections.map(c => c.name));

    // Check users
    const users = await User.find({});
    console.log(`👥 Users: ${users.length}`);
    users.forEach(user => {
      console.log(`   - ${user.email} (ID: ${user._id})`);
    });

    // Check loyalty records
    const loyaltyRecords = await LoyaltyReward.find({});
    console.log(`📊 Loyalty records: ${loyaltyRecords.length}`);
    
    loyaltyRecords.forEach(record => {
      console.log(`   - UserID: ${record.userId}, Points: ${record.points}`);
      console.log(`     History entries: ${record.pointsHistory.length}`);
      
      const rewardEntries = record.pointsHistory.filter(entry => entry.source === "reward_redeemed");
      console.log(`     Reward entries: ${rewardEntries.length}`);
      
      rewardEntries.forEach((entry, i) => {
        console.log(`       ${i+1}. ID: ${entry._id}, Name: ${entry.rewardName}, Used: ${entry.used}`);
      });
    });

    // Clear all data and recreate
    console.log("\n🧹 Clearing all data...");
    await User.deleteMany({});
    await LoyaltyReward.deleteMany({});
    
    console.log("✅ Data cleared. Creating fresh test data...");
    
    // Create test user
    const testUser = new User({
      email: "test@gmail.com",
      name: "Test User",
      passwordHash: "hashedpassword"
    });
    await testUser.save();
    console.log("✅ Created test user");

    // Create loyalty record
    const loyaltyRecord = new LoyaltyReward({
      userId: testUser._id,
      points: 1000,
      purchaseCount: 5,
      totalSpent: 5000,
      pointsHistory: [
        {
          points: 500,
          source: "purchase",
          createdAt: new Date(Date.now() - 86400000)
        },
        {
          points: -25,
          source: "reward_redeemed",
          rewardName: "bonus-points",
          used: false,
          createdAt: new Date(Date.now() - 3600000)
        },
        {
          points: -50,
          source: "reward_redeemed", 
          rewardName: "discount-100",
          used: false,
          createdAt: new Date(Date.now() - 1800000)
        }
      ]
    });
    
    await loyaltyRecord.save();
    console.log("✅ Created fresh loyalty record");
    
    // Verify the new data
    const newLoyalty = await LoyaltyReward.findOne({ userId: testUser._id });
    console.log("\n🔍 Verification:");
    console.log(`   User ID: ${testUser._id}`);
    console.log(`   Points: ${newLoyalty.points}`);
    console.log(`   History entries: ${newLoyalty.pointsHistory.length}`);
    
    const newRewardEntries = newLoyalty.pointsHistory.filter(entry => entry.source === "reward_redeemed");
    console.log(`   Reward entries: ${newRewardEntries.length}`);
    newRewardEntries.forEach((entry, i) => {
      console.log(`     ${i+1}. ID: ${entry._id}, Name: ${entry.rewardName}, Used: ${entry.used}`);
    });

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected");
  }
}

checkDatabase();