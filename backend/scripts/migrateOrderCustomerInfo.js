import dotenv from 'dotenv';

import mongoose from 'mongoose';
import Order from '../models/Order.js';
import User from '../models/User.js';
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/goagri";
    await mongoose.connect(uri, { maxPoolSize: 10 });
    console.log('✅ MongoDB connected for migration');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Migration function to populate customer info in existing orders
const migrateOrderCustomerInfo = async () => {
  try {
    console.log('Starting migration: Populating customer info in existing orders...');
    
    // Find all orders that don't have customer information
    const ordersToUpdate = await Order.find({
      $or: [
        { customerName: { $exists: false } },
        { customerName: "" },
        { customerEmail: { $exists: false } },
        { customerEmail: "" }
      ]
    }).select('_id userId');

    console.log(`Found ${ordersToUpdate.length} orders to update`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const order of ordersToUpdate) {
      try {
        // Fetch user information
        const user = await User.findById(order.userId).select('name email address').lean();
        
        if (user) {
          // Update the order with customer information
          await Order.findByIdAndUpdate(order._id, {
            customerName: user.name || "",
            customerEmail: user.email || "",
            customerPhone: user.address || "" // Using address field as phone for now
          });
          
          updatedCount++;
          
          if (updatedCount % 100 === 0) {
            console.log(`Updated ${updatedCount} orders...`);
          }
        } else {
          console.warn(`User not found for order ${order._id} with userId ${order.userId}`);
          errorCount++;
        }
      } catch (error) {
        console.error(`Error updating order ${order._id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`Migration completed!`);
    console.log(`- Successfully updated: ${updatedCount} orders`);
    console.log(`- Errors encountered: ${errorCount} orders`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
};

// Run the migration
const runMigration = async () => {
  await connectDB();
  await migrateOrderCustomerInfo();
  await mongoose.connection.close();
  console.log('Migration script completed. Database connection closed.');
  process.exit(0);
};

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration();
}

export { migrateOrderCustomerInfo };