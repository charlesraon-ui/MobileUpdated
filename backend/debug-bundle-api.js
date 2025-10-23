import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Bundle from './models/Bundle.js';
import Product from './models/Products.js';

async function debugBundleAPI() {
  try {
    // Connect to MongoDB
    console.log('🔗 Connecting to:', process.env.MONGO_URI ? 'MongoDB Atlas' : 'Local MongoDB');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/goagritrading');
    console.log('✅ Connected to MongoDB');

    console.log('\n🔍 Step 1: Raw bundles from database (active: true)');
    const rawBundles = await Bundle.find({ active: true });
    console.log(`Found ${rawBundles.length} active bundles:`);
    rawBundles.forEach((bundle, index) => {
       console.log(`${index + 1}. ${bundle.name} (ID: ${bundle._id})`);
       console.log(`   Active: ${bundle.active}`);
       console.log(`   Items count: ${bundle.items ? bundle.items.length : 0}`);
     });

    console.log('\n🔍 Step 2: Bundles with populated items');
    const populatedBundles = await Bundle.find({ active: true })
      .populate('items.productId', 'name price imageUrl')
      .lean();
    
    console.log(`Found ${populatedBundles.length} populated bundles:`);
    populatedBundles.forEach((bundle, index) => {
       console.log(`${index + 1}. ${bundle.name} (ID: ${bundle._id})`);
       console.log(`   Active: ${bundle.active}`);
       console.log(`   Items count: ${bundle.items ? bundle.items.length : 0}`);
       if (bundle.items && bundle.items.length > 0) {
         console.log(`   Items: ${JSON.stringify(bundle.items, null, 2)}`);
       } else {
         console.log(`   Items: [] (empty)`);
       }
     });

    console.log('\n🔍 Step 3: Transformed bundles (API response)');
    // Transform bundles to show only price field (same as mobile API)
    const transformedBundles = populatedBundles.map(bundle => ({
      _id: bundle._id,
      name: bundle.name,
      description: bundle.description,
      imageUrl: bundle.imageUrl,
      items: bundle.items,
      price: bundle.price || bundle.bundlePrice, // Use price field if available, fallback to bundlePrice
      stock: bundle.stock,
      active: bundle.active,
      createdAt: bundle.createdAt,
      updatedAt: bundle.updatedAt
    }));

    console.log(`Transformed ${transformedBundles.length} bundles:`);
    transformedBundles.forEach((bundle, index) => {
    console.log(`${index + 1}. ${bundle.name} (ID: ${bundle._id})`);
    console.log(`   Price: ₱${bundle.price}`);
    console.log(`   Items count: ${bundle.items ? bundle.items.length : 0}`);
  });

    console.log('\n✅ Disconnected from MongoDB');
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

debugBundleAPI();