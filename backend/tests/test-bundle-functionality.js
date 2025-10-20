import mongoose from 'mongoose';
import Bundle from './models/Bundle.js';
import Product from './models/Products.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connect to MongoDB Atlas
const mongoUri = process.env.MONGO_URI || 'mongodb+srv://levymarcelo555:xtsr8gqeaq1brvBZ@cluster0.lyyf48t.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoUri);

async function testBundleFunctionality() {
  try {
    console.log('🧪 Testing bundle functionality...\n');
    
    // Test 1: Fetch all bundles (API endpoint simulation)
    console.log('📋 Test 1: Fetching all bundles...');
    const bundles = await Bundle.find({ active: true })
      .populate('items.productId', 'name price imageUrl')
      .lean();
    
    console.log(`✅ Found ${bundles.length} active bundles`);
    
    // Test 2: Verify Premium Rice Collection specifically
    console.log('\n🎯 Test 2: Premium Rice Collection verification...');
    const premiumRiceBundle = bundles.find(bundle => 
      bundle.name.toLowerCase().includes('premium rice collection')
    );
    
    if (!premiumRiceBundle) {
      console.log('❌ Premium Rice Collection not found!');
      return;
    }
    
    console.log('✅ Premium Rice Collection found');
    console.log(`   Price: ₱${premiumRiceBundle.bundlePrice}`);
    console.log(`   Original Price: ₱${premiumRiceBundle.originalPrice}`);
    console.log(`   Discount: ${premiumRiceBundle.discount}%`);
    console.log(`   Items: ${premiumRiceBundle.items.length}`);
    
    // Test 3: Verify all products in bundle exist and have correct data
    console.log('\n🔍 Test 3: Product validation...');
    let allProductsValid = true;
    let calculatedTotal = 0;
    
    premiumRiceBundle.items.forEach((item, index) => {
      const product = item.productId;
      if (!product || !product.name || !product.price) {
        console.log(`❌ Item ${index + 1}: Invalid product data`);
        allProductsValid = false;
      } else {
        console.log(`✅ Item ${index + 1}: ${product.name} - ₱${product.price} x ${item.quantity}`);
        calculatedTotal += product.price * item.quantity;
      }
    });
    
    if (allProductsValid) {
      console.log('✅ All products are valid');
    }
    
    // Test 4: Price calculation verification
    console.log('\n💰 Test 4: Price calculation verification...');
    console.log(`   Calculated total: ₱${calculatedTotal}`);
    console.log(`   Bundle original price: ₱${premiumRiceBundle.originalPrice}`);
    console.log(`   Bundle price: ₱${premiumRiceBundle.bundlePrice}`);
    
    if (calculatedTotal === premiumRiceBundle.originalPrice) {
      console.log('✅ Original price calculation is correct');
    } else {
      console.log('❌ Original price calculation mismatch');
    }
    
    const expectedSavings = premiumRiceBundle.originalPrice - premiumRiceBundle.bundlePrice;
    const expectedDiscountPercent = Math.round((expectedSavings / premiumRiceBundle.originalPrice) * 100);
    
    if (expectedDiscountPercent === premiumRiceBundle.discount) {
      console.log('✅ Discount percentage is correct');
    } else {
      console.log(`❌ Discount percentage mismatch: expected ${expectedDiscountPercent}%, got ${premiumRiceBundle.discount}%`);
    }
    
    // Test 5: Expected products verification
    console.log('\n📦 Test 5: Expected products verification...');
    const expectedProducts = ['Buco Pandan', 'Water Lily', 'Jasmine Denorado', 'Sticky Jasmine Rice'];
    const actualProducts = premiumRiceBundle.items.map(item => item.productId.name);
    
    let allExpectedProductsFound = true;
    expectedProducts.forEach(expectedProduct => {
      if (actualProducts.includes(expectedProduct)) {
        console.log(`✅ Found: ${expectedProduct}`);
      } else {
        console.log(`❌ Missing: ${expectedProduct}`);
        allExpectedProductsFound = false;
      }
    });
    
    if (allExpectedProductsFound) {
      console.log('✅ All expected products are present');
    }
    
    // Test 6: Bundle structure validation
    console.log('\n🏗️  Test 6: Bundle structure validation...');
    const requiredFields = ['_id', 'name', 'description', 'bundlePrice', 'originalPrice', 'discount', 'items', 'active'];
    let structureValid = true;
    
    requiredFields.forEach(field => {
      if (premiumRiceBundle.hasOwnProperty(field)) {
        console.log(`✅ Field present: ${field}`);
      } else {
        console.log(`❌ Field missing: ${field}`);
        structureValid = false;
      }
    });
    
    if (structureValid) {
      console.log('✅ Bundle structure is valid');
    }
    
    // Test 7: Items structure validation
    console.log('\n🛍️  Test 7: Items structure validation...');
    let itemsStructureValid = true;
    
    premiumRiceBundle.items.forEach((item, index) => {
      if (item.productId && item.quantity && typeof item.quantity === 'number') {
        console.log(`✅ Item ${index + 1} structure is valid`);
      } else {
        console.log(`❌ Item ${index + 1} structure is invalid`);
        itemsStructureValid = false;
      }
    });
    
    if (itemsStructureValid) {
      console.log('✅ All items have valid structure');
    }
    
    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL TEST SUMMARY');
    console.log('='.repeat(60));
    
    const testResults = [
      { name: 'Bundle fetching', passed: bundles.length > 0 },
      { name: 'Premium Rice Collection found', passed: !!premiumRiceBundle },
      { name: 'All products valid', passed: allProductsValid },
      { name: 'Price calculations correct', passed: calculatedTotal === premiumRiceBundle.originalPrice },
      { name: 'Expected products present', passed: allExpectedProductsFound },
      { name: 'Bundle structure valid', passed: structureValid },
      { name: 'Items structure valid', passed: itemsStructureValid }
    ];
    
    const passedTests = testResults.filter(test => test.passed).length;
    const totalTests = testResults.length;
    
    testResults.forEach(test => {
      console.log(`${test.passed ? '✅' : '❌'} ${test.name}`);
    });
    
    console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 ALL TESTS PASSED! Bundle functionality is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Please review the issues above.');
    }
    
    mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error during testing:', err);
    mongoose.disconnect();
  }
}

testBundleFunctionality();