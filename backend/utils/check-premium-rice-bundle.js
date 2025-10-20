import mongoose from 'mongoose';
import Bundle from './models/Bundle.js';
import Product from './models/Products.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connect to MongoDB Atlas
const mongoUri = process.env.MONGO_URI || 'mongodb+srv://levymarcelo555:xtsr8gqeaq1brvBZ@cluster0.lyyf48t.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoUri);

async function checkPremiumRiceBundle() {
  try {
    console.log('🔍 Checking Premium Rice Collection bundle...');
    
    // Find the Premium Rice Collection bundle
    const bundle = await Bundle.findOne({ name: /Premium Rice Collection/i })
      .populate('items.productId', 'name price imageUrl')
      .lean();
    
    if (!bundle) {
      console.log('❌ Premium Rice Collection bundle not found!');
      
      // List all bundles to see what's available
      const allBundles = await Bundle.find({}).lean();
      console.log('\nAvailable bundles:');
      allBundles.forEach((b, index) => {
        console.log(`${index + 1}. ${b.name} - ₱${b.bundlePrice}`);
      });
      
      mongoose.disconnect();
      return;
    }
    
    console.log('\n📦 Premium Rice Collection Bundle Details:');
    console.log('='.repeat(50));
    console.log(`Name: ${bundle.name}`);
    console.log(`Description: ${bundle.description}`);
    console.log(`Bundle Price: ₱${bundle.bundlePrice}`);
    console.log(`Original Price: ₱${bundle.originalPrice}`);
    console.log(`Discount: ${bundle.discount}%`);
    console.log(`Stock: ${bundle.stock}`);
    console.log(`Active: ${bundle.active}`);
    console.log(`Created: ${bundle.createdAt}`);
    console.log(`Updated: ${bundle.updatedAt}`);
    
    console.log('\n🛍️ Bundle Items:');
    console.log('-'.repeat(30));
    if (bundle.items && bundle.items.length > 0) {
      bundle.items.forEach((item, index) => {
        const product = item.productId;
        console.log(`${index + 1}. ${product?.name || 'Unknown Product'}`);
        console.log(`   - Quantity: ${item.quantity}`);
        console.log(`   - Unit Price: ₱${product?.price || 'N/A'}`);
        console.log(`   - Total: ₱${(product?.price || 0) * item.quantity}`);
        console.log('');
      });
      
      // Calculate expected total from items
      const calculatedTotal = bundle.items.reduce((total, item) => {
        return total + ((item.productId?.price || 0) * item.quantity);
      }, 0);
      
      console.log(`📊 Price Analysis:`);
      console.log(`   Items Total: ₱${calculatedTotal}`);
      console.log(`   Bundle Price: ₱${bundle.bundlePrice}`);
      console.log(`   Original Price: ₱${bundle.originalPrice}`);
      console.log(`   Savings: ₱${bundle.originalPrice - bundle.bundlePrice}`);
      console.log(`   Discount: ${bundle.discount}%`);
      
      if (calculatedTotal !== bundle.originalPrice) {
        console.log(`   ⚠️  MISMATCH: Items total (₱${calculatedTotal}) != Original price (₱${bundle.originalPrice})`);
      }
    } else {
      console.log('❌ No items found in bundle!');
    }
    
    // Check if there are any legacy products field
    if (bundle.products) {
      console.log('\n⚠️  Legacy products field found:');
      console.log(bundle.products);
    }
    
    mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error checking bundle:', err);
    mongoose.disconnect();
  }
}

checkPremiumRiceBundle();