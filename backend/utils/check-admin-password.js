// check-admin-password.js
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

// Import User model
import User from './models/User.js';

async function checkAdminPassword() {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/goagri";
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    // Find the admin user
    const adminUser = await User.findOne({ email: 'admin@gmail.com' });
    
    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('👤 Admin user found:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   Password hash: ${adminUser.password ? 'Present' : 'Missing'}`);

    // Test common passwords
    const testPasswords = ['admin123', 'password', 'admin', '123456', 'admin@123'];
    
    console.log('\n🔍 Testing common passwords...');
    
    for (const password of testPasswords) {
      try {
        const isMatch = await bcrypt.compare(password, adminUser.password);
        if (isMatch) {
          console.log(`✅ Password found: "${password}"`);
          
          // Update the test script
          console.log('\n📝 Update your test script with:');
          console.log(`   email: '${adminUser.email}'`);
          console.log(`   password: '${password}'`);
          
          await mongoose.disconnect();
          return;
        }
      } catch (error) {
        console.log(`❌ Error testing password "${password}":`, error.message);
      }
    }

    console.log('❌ None of the common passwords worked');
    
    // Reset password to a known value
    console.log('\n🔧 Resetting admin password to "admin123"...');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('admin123', saltRounds);
    
    await User.findByIdAndUpdate(adminUser._id, { password: hashedPassword });
    console.log('✅ Password reset successfully');
    console.log('   New password: admin123');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
  }
}

checkAdminPassword();