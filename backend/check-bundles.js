import mongoose from 'mongoose';
import Bundle from './models/Bundle.js';
import Product from './models/Products.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkBundles() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log('🔍 Checking all bundles in database...');
    const allBundles = await Bundle.find({}).populate('items.productId', 'name price imageUrl').lean();
    
    console.log(`Found ${allBundles.length} total bundles in database:`);
    
    allBundles.forEach((bundle, index) => {
      console.log(`\n${index + 1}. ${bundle.name}`);
      console.log(`   ID: ${bundle._id}`);
      console.log(`   Active: ${bundle.active}`);
      console.log(`   Price: ₱${bundle.bundlePrice}`);
      console.log(`   Original Price: ₱${bundle.originalPrice}`);
      console.log(`   Discount: ${bundle.discount}%`);
      console.log(`   Items: ${bundle.items?.length || 0}`);
      console.log(`   Created: ${bundle.createdAt}`);
      
      if (bundle.items && bundle.items.length > 0) {
        console.log('   Products:');
        bundle.items.forEach((item, itemIndex) => {
          const product = item.productId;
          if (product) {
            console.log(`     ${itemIndex + 1}. ${product.name} - ₱${product.price} x ${item.quantity}`);
          } else {
            console.log(`     ${itemIndex + 1}. [MISSING PRODUCT] - ProductID: ${item.productId} x ${item.quantity}`);
          }
        });
      }
    });
    
    console.log(`\n📊 Active bundles: ${allBundles.filter(b => b.active).length}`);
    console.log(`📊 Inactive bundles: ${allBundles.filter(b => !b.active).length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkBundles();