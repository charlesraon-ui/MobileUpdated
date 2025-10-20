// check-admin-users.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Import User model
import User from './models/User.js';

async function checkAdminUsers() {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/goagri";
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    // Find all admin users
    const adminUsers = await User.find({ role: 'admin' }).select('email role createdAt');
    
    console.log('\n👥 Admin Users Found:');
    if (adminUsers.length === 0) {
      console.log('❌ No admin users found in the database');
      
      // Create a test admin user
      console.log('\n🔧 Creating a test admin user...');
      const testAdmin = new User({
        email: 'admin@goagritrading.com',
        password: 'admin123', // This will be hashed by the User model
        role: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        phoneNumber: '09123456789'
      });
      
      await testAdmin.save();
      console.log('✅ Test admin user created:');
      console.log('   Email: admin@goagritrading.com');
      console.log('   Password: admin123');
      
    } else {
      adminUsers.forEach((admin, index) => {
        console.log(`${index + 1}. Email: ${admin.email}`);
        console.log(`   Role: ${admin.role}`);
        console.log(`   Created: ${admin.createdAt}`);
        console.log('');
      });
    }

    // Also check for superadmin users
    const superAdminUsers = await User.find({ role: 'superadmin' }).select('email role createdAt');
    
    if (superAdminUsers.length > 0) {
      console.log('\n👑 Super Admin Users Found:');
      superAdminUsers.forEach((admin, index) => {
        console.log(`${index + 1}. Email: ${admin.email}`);
        console.log(`   Role: ${admin.role}`);
        console.log(`   Created: ${admin.createdAt}`);
        console.log('');
      });
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
  }
}

checkAdminUsers();