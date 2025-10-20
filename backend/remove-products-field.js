import mongoose from 'mongoose';
import Bundle from './models/Bundle.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connect to MongoDB Atlas
const mongoUri = process.env.MONGO_URI || 'mongodb+srv://levymarcelo555:xtsr8gqeaq1brvBZ@cluster0.lyyf48t.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function removeProductsField() {
  try {
    await mongoose.connect(mongoUri);
    console.log('🔧 Connected to MongoDB');

    // Use MongoDB's $unset operator to remove the products field from all bundles
    const result = await Bundle.updateMany(
      {}, // Match all bundles
      { $unset: { products: "" } } // Remove the products field
    );

    console.log(`✅ Removed 'products' field from ${result.modifiedCount} bundles`);

    // Verify the change
    const sampleBundle = await Bundle.findOne().lean();
    console.log('\n📋 Sample bundle after cleanup:');
    console.log('Fields present:', Object.keys(sampleBundle));
    console.log('Has products field:', 'products' in sampleBundle);
    console.log('Has items field:', 'items' in sampleBundle);
    console.log('Items count:', sampleBundle.items?.length || 0);

    mongoose.disconnect();
    console.log('\n🎉 Products field removal completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.disconnect();
  }
}

removeProductsField();