// scripts/createTestUser.js
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../models/User.js";

async function createTestUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect("mongodb://127.0.0.1:27017/goagri");
    console.log("✅ Connected to MongoDB");

    // Check if test user already exists
    const existingUser = await User.findOne({ email: "test@gmail.com" });
    if (existingUser) {
      console.log("🔄 Test user already exists, updating password...");
      // Update with proper bcrypt hash
      const hashedPassword = await bcrypt.hash("password123", 10);
      existingUser.passwordHash = hashedPassword;
      await existingUser.save();
      console.log("✅ Updated test user password");
    } else {
      // Create new test user
      const hashedPassword = await bcrypt.hash("password123", 10);
      const testUser = new User({
        email: "test@gmail.com",
        name: "Test User",
        passwordHash: hashedPassword
      });
      await testUser.save();
      console.log("✅ Created new test user");
    }

    console.log("\n📋 Test User Credentials:");
    console.log("   Email: test@gmail.com");
    console.log("   Password: password123");
    
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

createTestUser();