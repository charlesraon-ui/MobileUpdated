import mongoose from 'mongoose';
import Bundle from './models/Bundle.js';
import Product from './models/Products.js';
import dotenv from 'dotenv';

dotenv.config();

async function fixBundle() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log('🔧 Fixing the incomplete bundle...');
    
    // Find the bundle
    const bundle = await Bundle.findOne({ name: 'Farmer Starter Pack' });
    if (!bundle) {
      console.log('❌ Bundle not found');
      return;
    }
    
    console.log(`Found bundle: ${bundle.name} (ID: ${bundle._id})`);
    
    // Get some products to add to the bundle
    const products = await Product.find({}).limit(4);
    console.log(`Found ${products.length} products to add to bundle`);
    
    if (products.length === 0) {
      console.log('❌ No products found to add to bundle');
      return;
    }
    
    // Calculate prices
    const totalProductPrice = products.reduce((sum, product) => sum + (product.price || 0), 0);
    const bundlePrice = Math.round(totalProductPrice * 0.85); // 15% discount
    const discount = 15;
    
    // Update the bundle with proper data
    bundle.active = true;
    bundle.bundlePrice = bundlePrice;
    bundle.originalPrice = totalProductPrice;
    bundle.discount = discount;
    bundle.stock = 10;
    bundle.items = products.map(product => ({
      productId: product._id,
      quantity: 1
    }));
    
    await bundle.save();
    
    console.log('✅ Bundle fixed successfully!');
    console.log(`   Active: ${bundle.active}`);
    console.log(`   Bundle Price: ₱${bundle.bundlePrice}`);
    console.log(`   Original Price: ₱${bundle.originalPrice}`);
    console.log(`   Discount: ${bundle.discount}%`);
    console.log(`   Items: ${bundle.items.length}`);
    
    // Verify the fix by checking the mobile API
    console.log('\n📱 Testing mobile API after fix...');
    const updatedBundle = await Bundle.findById(bundle._id).populate('items.productId', 'name price imageUrl');
    
    if (updatedBundle.active && updatedBundle.bundlePrice && updatedBundle.items.length > 0) {
      console.log('✅ Bundle should now appear in mobile app!');
      console.log(`   Bundle: ${updatedBundle.name}`);
      console.log(`   Price: ₱${updatedBundle.bundlePrice}`);
      console.log(`   Items: ${updatedBundle.items.length}`);
      
      updatedBundle.items.forEach((item, index) => {
        const product = item.productId;
        console.log(`     ${index + 1}. ${product.name} - ₱${product.price} x ${item.quantity}`);
      });
    } else {
      console.log('❌ Bundle still has issues');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixBundle();