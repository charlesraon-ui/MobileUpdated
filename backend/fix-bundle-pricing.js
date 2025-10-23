import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Bundle from './models/Bundle.js';
import Product from './models/Products.js';

async function fixBundlePricing() {
  try {
    // Connect to MongoDB Atlas
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas');

    console.log('\n🔍 Checking all bundle pricing...');
    
    const bundles = await Bundle.find({ active: true }).populate('items.productId');
    
    for (const bundle of bundles) {
      console.log(`\n📦 Bundle: ${bundle.name}`);
      console.log(`   Current price: ${bundle.price}`);
      console.log(`   Current bundlePrice: ${bundle.bundlePrice}`);
      console.log(`   Current originalPrice: ${bundle.originalPrice}`);
      
      // Calculate total price from items
      let calculatedPrice = 0;
      if (bundle.items && bundle.items.length > 0) {
        calculatedPrice = bundle.items.reduce((total, item) => {
          const productPrice = item.productId ? item.productId.price : 0;
          return total + (productPrice * item.quantity);
        }, 0);
      }
      
      console.log(`   Calculated from items: ₱${calculatedPrice}`);
      
      // Update the bundle with correct pricing
      const updateData = {};
      
      // Set price field (main field used by mobile)
      if (!bundle.price || bundle.price === 0) {
        updateData.price = bundle.bundlePrice || calculatedPrice;
      }
      
      // Set bundlePrice if missing
      if (!bundle.bundlePrice || bundle.bundlePrice === 0) {
        updateData.bundlePrice = bundle.price || calculatedPrice;
      }
      
      // Set originalPrice if missing (use calculated price + 20% as default)
      if (!bundle.originalPrice || bundle.originalPrice === 0) {
        updateData.originalPrice = Math.round(calculatedPrice * 1.2);
      }
      
      if (Object.keys(updateData).length > 0) {
        console.log(`   🔧 Updating with: ${JSON.stringify(updateData)}`);
        await Bundle.updateOne({ _id: bundle._id }, { $set: updateData });
        console.log(`   ✅ Updated successfully`);
      } else {
        console.log(`   ✅ No updates needed`);
      }
    }
    
    console.log('\n🧪 Testing final bundle data...');
    const finalBundles = await Bundle.find({ active: true }).populate('items.productId');
    
    finalBundles.forEach(bundle => {
      const mobilePrice = bundle.price || bundle.bundlePrice;
      console.log(`📱 ${bundle.name}: ₱${mobilePrice} (${bundle.items ? bundle.items.length : 0} items)`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

fixBundlePricing();