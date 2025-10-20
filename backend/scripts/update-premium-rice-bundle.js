import mongoose from 'mongoose';
import Bundle from './models/Bundle.js';
import Product from './models/Products.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connect to MongoDB Atlas
const mongoUri = process.env.MONGO_URI || 'mongodb+srv://levymarcelo555:xtsr8gqeaq1brvBZ@cluster0.lyyf48t.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoUri);

async function updatePremiumRiceBundle() {
  try {
    console.log('🔧 Updating Premium Rice Collection bundle...');
    
    // Find the bundle
    const bundle = await Bundle.findOne({ name: /Premium Rice Collection/i });
    
    if (!bundle) {
      console.log('❌ Premium Rice Collection bundle not found!');
      mongoose.disconnect();
      return;
    }
    
    console.log(`📦 Found bundle: ${bundle.name}`);
    console.log(`Current price: ₱${bundle.bundlePrice}`);
    console.log(`Current items: ${bundle.items?.length || 0}`);
    
    // Product IDs from our search
    const newItems = [
      { productId: '68f5aacf0a0be4f12532429a', quantity: 1 }, // Buco Pandan
      { productId: '68f5a9f70a0be4f125324286', quantity: 1 }, // Water Lily
      { productId: '68f5ac740a0be4f1253242c7', quantity: 1 }, // Jasmine Denorado
      { productId: '68f5a9620a0be4f125324278', quantity: 1 }  // Sticky Jasmine Rice
    ];
    
    // Update the bundle
    bundle.items = newItems;
    bundle.bundlePrice = 2899;
    bundle.originalPrice = 3170;
    bundle.discount = 9;
    
    // Save the updated bundle
    await bundle.save();
    
    console.log('\n✅ Bundle updated successfully!');
    console.log('New bundle details:');
    console.log(`- Price: ₱${bundle.bundlePrice}`);
    console.log(`- Original Price: ₱${bundle.originalPrice}`);
    console.log(`- Discount: ${bundle.discount}%`);
    console.log(`- Items: ${bundle.items.length}`);
    
    // Verify the update by fetching with populated data
    const updatedBundle = await Bundle.findById(bundle._id)
      .populate('items.productId', 'name price')
      .lean();
    
    console.log('\n🔍 Verification - Updated bundle with product details:');
    console.log('='.repeat(50));
    console.log(`Name: ${updatedBundle.name}`);
    console.log(`Price: ₱${updatedBundle.bundlePrice}`);
    console.log(`Original Price: ₱${updatedBundle.originalPrice}`);
    console.log(`Discount: ${updatedBundle.discount}%`);
    console.log(`Items (${updatedBundle.items.length}):`);
    
    updatedBundle.items.forEach((item, index) => {
      const product = item.productId;
      console.log(`  ${index + 1}. ${product.name} - ₱${product.price} x ${item.quantity}`);
    });
    
    // Calculate total to verify
    const calculatedTotal = updatedBundle.items.reduce((total, item) => {
      return total + (item.productId.price * item.quantity);
    }, 0);
    
    console.log(`\nCalculated total: ₱${calculatedTotal}`);
    console.log(`Bundle original price: ₱${updatedBundle.originalPrice}`);
    console.log(`Bundle price: ₱${updatedBundle.bundlePrice}`);
    console.log(`Savings: ₱${updatedBundle.originalPrice - updatedBundle.bundlePrice}`);
    
    if (calculatedTotal === updatedBundle.originalPrice) {
      console.log('✅ Pricing is consistent!');
    } else {
      console.log('⚠️  Pricing mismatch detected');
    }
    
    console.log('\n🎉 Premium Rice Collection bundle has been updated to match admin interface!');
    
    mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error updating bundle:', err);
    mongoose.disconnect();
  }
}

updatePremiumRiceBundle();