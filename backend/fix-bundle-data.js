import mongoose from 'mongoose';
import Bundle from './models/Bundle.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connect to MongoDB Atlas
const mongoUri = process.env.MONGO_URI || 'mongodb+srv://levymarcelo555:xtsr8gqeaq1brvBZ@cluster0.lyyf48t.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoUri);

async function fixBundleData() {
  try {
    console.log('🔧 Fixing bundle data inconsistencies...');
    
    // Get all bundles
    const bundles = await Bundle.find({});
    console.log(`Found ${bundles.length} bundles to fix`);
    
    for (const bundle of bundles) {
      console.log(`\nFixing bundle: ${bundle.name}`);
      
      // Remove the products field if it exists
      if (bundle.products) {
        console.log(`  - Removing products field (had ${bundle.products.length} items)`);
        bundle.products = undefined;
      }
      
      // Ensure items field has proper data
      if (bundle.items && bundle.items.length > 0) {
        console.log(`  - Items field has ${bundle.items.length} items - keeping this`);
      } else {
        console.log(`  - WARNING: No items field found!`);
      }
      
      // Save the cleaned bundle
      await bundle.save();
      console.log(`  ✅ Fixed bundle: ${bundle.name}`);
    }
    
    console.log('\n🎉 All bundles fixed successfully!');
    mongoose.disconnect();
  } catch (err) {
    console.error('Error fixing bundles:', err);
    mongoose.disconnect();
  }
}

fixBundleData();