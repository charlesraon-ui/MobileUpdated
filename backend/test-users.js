import mongoose from "mongoose";
import User from "./models/User.js";
import dotenv from "dotenv";

dotenv.config();

async function testUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
    
    const userCount = await User.countDocuments();
    console.log(`Total users in database: ${userCount}`);
    
    if (userCount > 0) {
      const users = await User.find({}).select("name email role createdAt").limit(10);
      console.log("Sample users:");
      users.forEach(user => {
        console.log(`- ${user.name || 'No name'} (${user.email}) - Role: ${user.role}`);
      });
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error);
  }
}

testUsers();