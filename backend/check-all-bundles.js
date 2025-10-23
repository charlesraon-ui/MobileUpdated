import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Bundle from './models/Bundle.js';

async function checkAllBundles() {
  try {
    // Connect to MongoDB Atlas
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas');

    console.log('\n🔍 Checking all bundles in database...');

    // Get all bundles without population first
    const allBundles = await Bundle.find().lean();
    
    console.log(`\n📊 Found ${allBundles.length} total bundles:`);
    
    const bundlesWithItems = [];
    const bundlesWithoutItems = [];
    
    for (const bundle of allBundles) {
      const itemCount = bundle.items ? bundle.items.length : 0;
      const bundleInfo = {
        id: bundle._id,
        name: bundle.name,
        itemCount: itemCount,
        createdAt: bundle.createdAt,
        active: bundle.active
      };
      
      if (itemCount > 0) {
        bundlesWithItems.push(bundleInfo);
      } else {
        bundlesWithoutItems.push(bundleInfo);
      }
      
      console.log(`   ${bundle.name}: ${itemCount} items (${bundle.active ? 'Active' : 'Inactive'})`);
    }
    
    console.log(`\n✅ Bundles WITH items (${bundlesWithItems.length}):`);
    bundlesWithItems.forEach(bundle => {
      console.log(`   - ${bundle.name} (${bundle.itemCount} items) - Created: ${new Date(bundle.createdAt).toLocaleDateString()}`);
    });
    
    console.log(`\n❌ Bundles WITHOUT items (${bundlesWithoutItems.length}):`);
    bundlesWithoutItems.forEach(bundle => {
      console.log(`   - ${bundle.name} (0 items) - Created: ${new Date(bundle.createdAt).toLocaleDateString()}`);
    });
    
    // Now let's check if the bundles without items have any data issues
    if (bundlesWithoutItems.length > 0) {
      console.log('\n🔍 Detailed analysis of bundles without items:');
      
      for (const bundleInfo of bundlesWithoutItems) {
        const bundle = await Bundle.findById(bundleInfo.id).lean();
        console.log(`\n📋 Bundle: ${bundle.name}`);
        console.log(`   ID: ${bundle._id}`);
        console.log(`   Items field exists: ${bundle.hasOwnProperty('items')}`);
        console.log(`   Items value: ${JSON.stringify(bundle.items)}`);
        console.log(`   Bundle Price: ₱${bundle.bundlePrice || 'Not set'}`);
        console.log(`   Original Price: ₱${bundle.originalPrice || 'Not set'}`);
        console.log(`   Stock: ${bundle.stock || 0}`);
        console.log(`   Active: ${bundle.active}`);
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

checkAllBundles();