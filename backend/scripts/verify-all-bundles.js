import mongoose from 'mongoose';
import Bundle from './models/Bundle.js';
import Product from './models/Products.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connect to MongoDB Atlas
const mongoUri = process.env.MONGO_URI || 'mongodb+srv://levymarcelo555:xtsr8gqeaq1brvBZ@cluster0.lyyf48t.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoUri);

async function verifyAllBundles() {
  try {
    console.log('🔍 Verifying all existing bundles...\n');
    
    // Fetch all bundles with populated product data
    const bundles = await Bundle.find()
      .populate('items.productId', 'name price imageUrl')
      .lean();
    
    console.log(`📦 Found ${bundles.length} total bundles\n`);
    
    for (let i = 0; i < bundles.length; i++) {
      const bundle = bundles[i];
      console.log(`${'='.repeat(60)}`);
      console.log(`📋 Bundle ${i + 1}: ${bundle.name}`);
      console.log(`${'='.repeat(60)}`);
      console.log(`ID: ${bundle._id}`);
      console.log(`Description: ${bundle.description}`);
      console.log(`Bundle Price: ₱${bundle.bundlePrice}`);
      console.log(`Original Price: ₱${bundle.originalPrice}`);
      console.log(`Discount: ${bundle.discount}%`);
      console.log(`Stock: ${bundle.stock}`);
      console.log(`Active: ${bundle.active}`);
      console.log(`Created: ${bundle.createdAt}`);
      
      // Verify items structure
      console.log(`\n🛍️  Items (${bundle.items?.length || 0}):`);
      let calculatedTotal = 0;
      let hasValidItems = true;
      
      if (bundle.items && bundle.items.length > 0) {
        bundle.items.forEach((item, index) => {
          const product = item.productId;
          if (product && product.name && product.price) {
            console.log(`  ${index + 1}. ${product.name} - ₱${product.price} x ${item.quantity} = ₱${product.price * item.quantity}`);
            calculatedTotal += product.price * item.quantity;
          } else {
            console.log(`  ${index + 1}. ❌ Invalid product data:`, item);
            hasValidItems = false;
          }
        });
      } else {
        console.log('  ⚠️  No items found or items array is empty');
        hasValidItems = false;
      }
      
      // Verify pricing calculations
      console.log(`\n💰 Price Verification:`);
      console.log(`  Calculated total: ₱${calculatedTotal}`);
      console.log(`  Bundle original price: ₱${bundle.originalPrice}`);
      console.log(`  Bundle price: ₱${bundle.bundlePrice}`);
      
      const priceMatch = calculatedTotal === bundle.originalPrice;
      const savings = bundle.originalPrice - bundle.bundlePrice;
      const calculatedDiscount = bundle.originalPrice > 0 ? Math.round((savings / bundle.originalPrice) * 100) : 0;
      const discountMatch = calculatedDiscount === bundle.discount;
      
      console.log(`  Savings: ₱${savings}`);
      console.log(`  Calculated discount: ${calculatedDiscount}%`);
      
      // Status indicators
      console.log(`\n📊 Status:`);
      console.log(`  ${hasValidItems ? '✅' : '❌'} Items structure valid`);
      console.log(`  ${priceMatch ? '✅' : '❌'} Price calculation correct`);
      console.log(`  ${discountMatch ? '✅' : '❌'} Discount calculation correct`);
      console.log(`  ${bundle.active ? '✅' : '⚠️ '} Bundle active`);
      
      if (!hasValidItems || !priceMatch || !discountMatch) {
        console.log(`\n⚠️  ISSUES DETECTED with ${bundle.name}:`);
        if (!hasValidItems) console.log(`    - Invalid items structure`);
        if (!priceMatch) console.log(`    - Price mismatch: expected ₱${calculatedTotal}, got ₱${bundle.originalPrice}`);
        if (!discountMatch) console.log(`    - Discount mismatch: expected ${calculatedDiscount}%, got ${bundle.discount}%`);
      } else {
        console.log(`\n✅ ${bundle.name} is fully valid!`);
      }
      
      console.log('\n');
    }
    
    // Summary
    const validBundles = bundles.filter(bundle => {
      if (!bundle.items || bundle.items.length === 0) return false;
      
      const calculatedTotal = bundle.items.reduce((total, item) => {
        const product = item.productId;
        return total + (product && product.price ? product.price * item.quantity : 0);
      }, 0);
      
      const priceMatch = calculatedTotal === bundle.originalPrice;
      const savings = bundle.originalPrice - bundle.bundlePrice;
      const calculatedDiscount = bundle.originalPrice > 0 ? Math.round((savings / bundle.originalPrice) * 100) : 0;
      const discountMatch = calculatedDiscount === bundle.discount;
      
      return priceMatch && discountMatch;
    });
    
    console.log(`${'='.repeat(60)}`);
    console.log(`📊 SUMMARY`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Total bundles: ${bundles.length}`);
    console.log(`Valid bundles: ${validBundles.length}`);
    console.log(`Invalid bundles: ${bundles.length - validBundles.length}`);
    console.log(`Active bundles: ${bundles.filter(b => b.active).length}`);
    
    if (validBundles.length === bundles.length) {
      console.log('\n🎉 All bundles are valid and properly configured!');
    } else {
      console.log('\n⚠️  Some bundles need attention. Review the issues above.');
    }
    
    mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error verifying bundles:', err);
    mongoose.disconnect();
  }
}

verifyAllBundles();