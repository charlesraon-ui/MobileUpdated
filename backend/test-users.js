import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import User from "./models/User.js";

// Load environment variables
dotenv.config();

const testUsers = [
  {
    name: "John Doe",
    email: "john.doe@test.com",
    password: "password123"
  },
  {
    name: "Jane Smith",
    email: "jane.smith@test.com", 
    password: "password123"
  },
  {
    name: "Bob Johnson",
    email: "bob.johnson@test.com",
    password: "password123"
  },
  {
    name: "Alice Brown",
    email: "alice.brown@test.com",
    password: "password123"
  },
  {
    name: "Charlie Wilson",
    email: "charlie.wilson@test.com",
    password: "password123"
  }
];

async function createTestUsers() {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error("MONGO_URI environment variable is not set");
    }
    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB");

    // Check if users already exist
    const existingUsers = await User.find({});
    console.log(`Found ${existingUsers.length} existing users`);

    // Create test users if they don't exist
    for (const userData of testUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const user = new User({
          name: userData.name,
          email: userData.email,
          passwordHash: hashedPassword
        });
        await user.save();
        console.log(`✅ Created user: ${userData.name} (${userData.email})`);
      } else {
        console.log(`⚠️ User already exists: ${userData.email}`);
      }
    }

    // List all users
    const allUsers = await User.find({}).select("name email");
    console.log("\n📋 All users in database:");
    allUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email})`);
    });

    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

createTestUsers();