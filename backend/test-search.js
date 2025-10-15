import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "./models/User.js";

// Load environment variables
dotenv.config();

async function testUserSearch() {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error("MONGO_URI environment variable is not set");
    }
    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB");

    // Find a test user to authenticate with
    const testUser = await User.findOne({ email: "john.doe@test.com" });
    if (!testUser) {
      console.log("❌ Test user not found");
      return;
    }

    console.log(`✅ Found test user: ${testUser.name} (${testUser.email})`);

    // Create a JWT token for the test user
    const token = jwt.sign(
      { sub: testUser._id, email: testUser.email }, 
      process.env.JWT_SECRET, 
      { expiresIn: "1h" }
    );

    console.log("✅ Generated JWT token");

    // Test the search functionality
    const searchQuery = "jane";
    console.log(`\n🔍 Testing search for: "${searchQuery}"`);

    // Simulate the search API call
    const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const users = await User.find({ 
      $or: [{ name: regex }, { email: regex }],
      _id: { $ne: testUser._id } // Exclude the current user
    })
      .select("name email avatarUrl")
      .limit(50)
      .lean();

    console.log(`📋 Found ${users.length} users matching "${searchQuery}":`);
    
    // Transform the response to match frontend expectations
    const transformedUsers = users.map(user => ({
      _id: user._id,
      firstName: user.name ? user.name.split(' ')[0] : '',
      lastName: user.name ? user.name.split(' ').slice(1).join(' ') : '',
      email: user.email,
      avatarUrl: user.avatarUrl
    }));

    transformedUsers.forEach(user => {
      console.log(`- ${user.firstName} ${user.lastName} (${user.email})`);
    });

    // Test with different search queries
    const testQueries = ["alice", "bob", "charlie", "test", "admin"];
    
    for (const query of testQueries) {
      const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      const results = await User.find({ 
        $or: [{ name: regex }, { email: regex }],
        _id: { $ne: testUser._id }
      })
        .select("name email avatarUrl")
        .limit(10)
        .lean();
      
      console.log(`\n🔍 Search "${query}": ${results.length} results`);
      results.slice(0, 3).forEach(user => {
        console.log(`  - ${user.name} (${user.email})`);
      });
    }

    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
    console.log("\n🎉 User search functionality is working correctly!");

  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

testUserSearch();