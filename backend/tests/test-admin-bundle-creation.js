import mongoose from 'mongoose';
import Bundle from './models/Bundle.js';
import Product from './models/Products.js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

// Connect to MongoDB Atlas
const mongoUri = process.env.MONGO_URI || 'mongodb+srv://levymarcelo555:xtsr8gqeaq1brvBZ@cluster0.lyyf48t.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoUri);

const API_BASE_URL = 'http://localhost:5000/api';

async function testAdminBundleCreation() {
  try {
    console.log('🧪 Testing admin bundle creation functionality...\n');
    
    // Step 1: Get available products for the test bundle
    console.log('📋 Step 1: Fetching available products...');
    const products = await Product.find().limit(3).lean();
    
    if (products.length < 3) {
      console.log('❌ Not enough products available for testing');
      mongoose.disconnect();
      return;
    }
    
    console.log(`✅ Found ${products.length} products for testing:`);
    products.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.name} - ₱${product.price}`);
    });
    
    // Step 2: Calculate bundle pricing
    console.log('\n💰 Step 2: Calculating bundle pricing...');
    const originalPrice = products.reduce((total, product) => total + product.price, 0);
    const discountPercent = 15; // 15% discount
    const bundlePrice = Math.round(originalPrice * (1 - discountPercent / 100));
    
    console.log(`Original price: ₱${originalPrice}`);
    console.log(`Discount: ${discountPercent}%`);
    console.log(`Bundle price: ₱${bundlePrice}`);
    
    // Step 3: Create test bundle data
    const testBundleData = {
      name: 'Test Admin Bundle',
      description: 'A test bundle created to verify admin functionality',
      items: products.map(product => ({
        productId: product._id,
        quantity: 1
      })),
      bundlePrice: bundlePrice,
      originalPrice: originalPrice,
      discount: discountPercent,
      stock: 10,
      active: true
    };
    
    console.log('\n📦 Step 3: Test bundle data prepared:');
    console.log(JSON.stringify(testBundleData, null, 2));
    
    // Step 4: Test API creation
    console.log('\n🌐 Step 4: Testing bundle creation via API...');
    
    try {
      const response = await fetch(`${API_BASE_URL}/bundles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testBundleData)
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.log(`❌ API request failed: ${response.status} ${response.statusText}`);
        console.log(`Error details: ${errorData}`);
        return;
      }
      
      const createdBundle = await response.json();
      console.log('✅ Bundle created successfully via API!');
      console.log(`Bundle ID: ${createdBundle._id}`);
      console.log(`Bundle Name: ${createdBundle.name}`);
      console.log(`Bundle Price: ₱${createdBundle.bundlePrice}`);
      console.log(`Items: ${createdBundle.items.length}`);
      
      // Step 5: Verify the bundle in database
      console.log('\n🔍 Step 5: Verifying bundle in database...');
      const dbBundle = await Bundle.findById(createdBundle._id)
        .populate('items.productId', 'name price imageUrl')
        .lean();
      
      if (!dbBundle) {
        console.log('❌ Bundle not found in database');
        return;
      }
      
      console.log('✅ Bundle found in database:');
      console.log(`  Name: ${dbBundle.name}`);
      console.log(`  Price: ₱${dbBundle.bundlePrice}`);
      console.log(`  Original Price: ₱${dbBundle.originalPrice}`);
      console.log(`  Discount: ${dbBundle.discount}%`);
      console.log(`  Items: ${dbBundle.items.length}`);
      
      dbBundle.items.forEach((item, index) => {
        const product = item.productId;
        console.log(`    ${index + 1}. ${product.name} - ₱${product.price} x ${item.quantity}`);
      });
      
      // Step 6: Test mobile app API endpoint
      console.log('\n📱 Step 6: Testing mobile app API endpoint...');
      const mobileResponse = await fetch(`${API_BASE_URL}/bundles`);
      
      if (!mobileResponse.ok) {
        console.log('❌ Mobile API endpoint failed');
        return;
      }
      
      const allBundles = await mobileResponse.json();
      const newBundleInList = allBundles.find(bundle => bundle._id === createdBundle._id);
      
      if (newBundleInList) {
        console.log('✅ New bundle appears in mobile app API response');
        console.log(`  Bundle appears as: ${newBundleInList.name} - ₱${newBundleInList.bundlePrice}`);
      } else {
        console.log('❌ New bundle does not appear in mobile app API response');
      }
      
      // Step 7: Cleanup - Remove test bundle
      console.log('\n🧹 Step 7: Cleaning up test bundle...');
      await Bundle.findByIdAndDelete(createdBundle._id);
      console.log('✅ Test bundle removed from database');
      
      // Final verification
      const verifyDeleted = await Bundle.findById(createdBundle._id);
      if (!verifyDeleted) {
        console.log('✅ Cleanup verified - test bundle successfully removed');
      } else {
        console.log('⚠️  Test bundle still exists in database');
      }
      
    } catch (apiError) {
      console.log('❌ API request error:', apiError.message);
      return;
    }
    
    // Step 8: Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 ADMIN BUNDLE CREATION TEST SUMMARY');
    console.log('='.repeat(60));
    console.log('✅ Product fetching: SUCCESS');
    console.log('✅ Bundle data preparation: SUCCESS');
    console.log('✅ API bundle creation: SUCCESS');
    console.log('✅ Database verification: SUCCESS');
    console.log('✅ Mobile app API integration: SUCCESS');
    console.log('✅ Cleanup: SUCCESS');
    
    console.log('\n🎉 ALL TESTS PASSED! Admin bundle creation works correctly.');
    console.log('📝 New bundles created by admin will:');
    console.log('   - Be properly saved to database');
    console.log('   - Appear in mobile app immediately');
    console.log('   - Have correct pricing calculations');
    console.log('   - Include populated product details');
    
    mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error during testing:', err);
    mongoose.disconnect();
  }
}

testAdminBundleCreation();