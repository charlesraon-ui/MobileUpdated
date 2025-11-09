import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import LoyaltyReward from "../models/LoyaltyReward.js";
import PendingRegistration from "../models/PendingRegistration.js";
import PasswordReset from "../models/PasswordReset.js";

dotenv.config();

async function deleteUserByEmail(emailArg) {
  const email = (emailArg || "").trim().toLowerCase();
  if (!email) {
    console.error("❌ Please provide an email: node deleteUserByEmail.js <email>");
    process.exit(1);
  }

  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/goagri";
  console.log("🔗 Connecting to:", uri);
  await mongoose.connect(uri, { maxPoolSize: 10 });
  console.log("✅ MongoDB connected");

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`ℹ️ No user found with email: ${email}`);
    } else {
      const userId = user._id;
      await User.deleteOne({ _id: userId });
      console.log(`🗑️ Deleted user: ${email} (${userId})`);

      const lrRes = await LoyaltyReward.deleteMany({ userId });
      console.log(`🗑️ Deleted loyalty records: ${lrRes.deletedCount}`);
    }

    const prRes = await PendingRegistration.deleteMany({ email });
    console.log(`🗑️ Deleted pending registrations: ${prRes.deletedCount}`);

    const pwRes = await PasswordReset.deleteMany({ email });
    console.log(`🗑️ Deleted password reset tokens: ${pwRes.deletedCount}`);

    console.log("✅ Cleanup complete");
  } catch (err) {
    console.error("❌ Error while deleting user:", err?.message || err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected");
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  deleteUserByEmail(process.argv[2]);
}

export default deleteUserByEmail;