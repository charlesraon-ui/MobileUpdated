import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

if (!MONGO_URI) {
  console.error("MONGO_URI environment variable is not set");
  process.exit(1);
}

if (!JWT_SECRET) {
  console.error("JWT_SECRET environment variable is not set");
  process.exit(1);
}

async function getValidToken() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Find a test user
    const testUser = await User.findOne({ email: "john.doe@test.com" });
    
    if (!testUser) {
      console.error("Test user not found");
      process.exit(1);
    }

    // Generate a JWT token
    const token = jwt.sign(
      { 
        userId: testUser._id, 
        email: testUser.email 
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    console.log("Valid token for testing:");
    console.log(token);
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");

  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

getValidToken();