import mongoose from 'mongoose';
import Bundle from './backend/models/Bundle.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkBundles() {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/goagri";
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    // Find all bundles
    const bundles = await Bundle.find({}).populate('items.productId', 'name price').sort({ createdAt: -1 });
    
    console.log(`\n📦 Found ${bundles.length} bundles in database:`);
    console.log('='.repeat(60));
    
    if (bundles.length === 0) {
      console.log('❌ No bundles found in the database');
    } else {
      bundles.forEach((bundle, index) => {
        console.log(`${index + 1}. ${bundle.name}`);
        console.log(`   ID: ${bundle._id}`);
        console.log(`   Price: ₱${bundle.price || bundle.bundlePrice}`);
        console.log(`   Active: ${bundle.active}`);
        console.log(`   Items: ${bundle.items?.length || 0}`);
        console.log(`   Created: ${bundle.createdAt}`);
        console.log(`   Description: ${bundle.description}`);
        console.log('');
      });
    }

    // Check specifically for active bundles (what mobile app fetches)
    const activeBundles = await Bundle.find({ active: true }).populate('items.productId', 'name price');
    console.log(`\n🟢 Active bundles (what mobile app sees): ${activeBundles.length}`);
    
    if (activeBundles.length > 0) {
      activeBundles.forEach((bundle, index) => {
        console.log(`${index + 1}. ${bundle.name} - ₱${bundle.price || bundle.bundlePrice} (Active: ${bundle.active})`);
      });
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
  }
}

checkBundles();