import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Bundle from './models/Bundle.js';
import Product from './models/Products.js';

async function comprehensiveBundleTest() {
  try {
    // Connect to MongoDB Atlas
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas');

    console.log('\n🔍 COMPREHENSIVE BUNDLE INVESTIGATION');
    console.log('=' .repeat(60));

    // Step 1: Check all existing bundles and their creation patterns
    console.log('\n📊 Step 1: Analyzing All Existing Bundles');
    console.log('-'.repeat(40));
    
    const allBundles = await Bundle.find()
      .populate('items.productId', 'name price imageUrl')
      .lean();

    console.log(`Found ${allBundles.length} total bundles:`);
    
    const bundleAnalysis = {
      withItems: [],
      withoutItems: [],
      withMissingProducts: []
    };

    for (const bundle of allBundles) {
      console.log(`\n📦 Bundle: ${bundle.name}`);
      console.log(`   ID: ${bundle._id}`);
      console.log(`   Created: ${bundle.createdAt}`);
      console.log(`   Items array length: ${bundle.items ? bundle.items.length : 0}`);
      
      if (!bundle.items || bundle.items.length === 0) {
        bundleAnalysis.withoutItems.push(bundle);
        console.log('   ❌ NO ITEMS');
      } else {
        let hasValidItems = true;
        console.log('   📋 Items:');
        
        for (let i = 0; i < bundle.items.length; i++) {
          const item = bundle.items[i];
          if (!item.productId || typeof item.productId === 'string') {
            console.log(`     ${i + 1}. ❌ MISSING/INVALID PRODUCT: ${item.productId} x ${item.quantity}`);
            hasValidItems = false;
          } else {
            console.log(`     ${i + 1}. ✅ ${item.productId.name} x ${item.quantity} = ₱${(item.productId.price * item.quantity).toFixed(2)}`);
          }
        }
        
        if (hasValidItems) {
          bundleAnalysis.withItems.push(bundle);
        } else {
          bundleAnalysis.withMissingProducts.push(bundle);
        }
      }
    }

    console.log('\n📈 BUNDLE ANALYSIS SUMMARY:');
    console.log(`   ✅ Bundles with valid items: ${bundleAnalysis.withItems.length}`);
    console.log(`   ❌ Bundles without items: ${bundleAnalysis.withoutItems.length}`);
    console.log(`   ⚠️  Bundles with missing products: ${bundleAnalysis.withMissingProducts.length}`);

    // Step 2: Test bundle creation via admin API simulation
    console.log('\n🔧 Step 2: Testing Admin API Bundle Creation');
    console.log('-'.repeat(40));
    
    // Get some products to use for testing
    const testProducts = await Product.find().limit(3).lean();
    if (testProducts.length < 3) {
      console.log('❌ Not enough products for testing. Need at least 3 products.');
      return;
    }

    console.log(`Using test products:`);
    testProducts.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name} - ₱${product.price}`);
    });

    // Simulate admin bundle creation (like adminBundleRoutes.js POST route)
    const testBundleData = {
      name: "Admin API Test Bundle",
      description: "Testing bundle creation via admin API simulation",
      items: [
        { productId: testProducts[0]._id, quantity: 2 },
        { productId: testProducts[1]._id, quantity: 1 },
        { productId: testProducts[2]._id, quantity: 3 }
      ],
      bundlePrice: 1000,
      originalPrice: 1200,
      stock: 10,
      active: true
    };

    console.log('\n🔨 Creating test bundle via admin API simulation...');
    
    // Validate that all products exist (like admin route does)
    const productIds = testBundleData.items.map(item => item.productId);
    const existingProducts = await Product.find({ _id: { $in: productIds } });
    
    if (existingProducts.length !== productIds.length) {
      console.log('❌ Product validation failed');
      return;
    }

    // Calculate original price if not provided
    const calculatedOriginalPrice = testBundleData.items.reduce((sum, item) => {
      const product = existingProducts.find(p => p._id.toString() === item.productId.toString());
      return sum + (product.price * item.quantity);
    }, 0);

    const originalPrice = testBundleData.originalPrice || calculatedOriginalPrice;
    const discount = testBundleData.discount || Math.round(((originalPrice - testBundleData.bundlePrice) / originalPrice) * 100);

    // Create the bundle
    const newBundle = new Bundle({
      name: testBundleData.name,
      description: testBundleData.description,
      items: testBundleData.items,
      bundlePrice: testBundleData.bundlePrice,
      originalPrice,
      discount,
      stock: testBundleData.stock || 0,
      active: testBundleData.active
    });

    const savedBundle = await newBundle.save();
    console.log(`✅ Bundle created with ID: ${savedBundle._id}`);

    // Step 3: Test the created bundle with different API approaches
    console.log('\n🧪 Step 3: Testing Created Bundle with Different API Approaches');
    console.log('-'.repeat(40));

    const bundleId = savedBundle._id;

    // Test 1: Raw database query
    console.log('\n🔍 Test 1: Raw Database Query');
    const rawBundle = await Bundle.findById(bundleId).lean();
    console.log(`   Items array length: ${rawBundle.items ? rawBundle.items.length : 0}`);
    if (rawBundle.items && rawBundle.items.length > 0) {
      console.log('   ✅ Raw items exist');
      rawBundle.items.forEach((item, index) => {
        console.log(`     ${index + 1}. ProductID: ${item.productId}, Quantity: ${item.quantity}`);
      });
    } else {
      console.log('   ❌ No raw items found');
    }

    // Test 2: Mobile API simulation (bundleRoutes.js logic)
    console.log('\n📱 Test 2: Mobile API Simulation');
    const mobileBundle = await Bundle.findById(bundleId)
      .populate('items.productId', 'name price imageUrl description category stock')
      .lean();
    
    console.log(`   Items array length: ${mobileBundle.items ? mobileBundle.items.length : 0}`);
    if (mobileBundle.items && mobileBundle.items.length > 0) {
      console.log('   ✅ Mobile API items populated');
      mobileBundle.items.forEach((item, index) => {
        const product = item.productId;
        if (product && typeof product === 'object') {
          console.log(`     ${index + 1}. ${product.name} x ${item.quantity} = ₱${(product.price * item.quantity).toFixed(2)}`);
        } else {
          console.log(`     ${index + 1}. ❌ Product not populated: ${item.productId} x ${item.quantity}`);
        }
      });
    } else {
      console.log('   ❌ No mobile API items found');
    }

    // Test 3: Admin API simulation (adminBundleRoutes.js logic)
    console.log('\n🔧 Test 3: Admin API Simulation');
    const adminBundle = await Bundle.findById(bundleId)
      .populate('items.productId', 'name price imageUrl description category stock')
      .lean();

    if (adminBundle) {
      // Transform data for admin interface (like adminBundleRoutes.js does)
      const adminTransformed = {
        _id: adminBundle._id,
        name: adminBundle.name,
        description: adminBundle.description,
        bundlePrice: adminBundle.bundlePrice,
        originalPrice: adminBundle.originalPrice,
        discount: adminBundle.discount,
        stock: adminBundle.stock,
        active: adminBundle.active,
        createdAt: adminBundle.createdAt,
        updatedAt: adminBundle.updatedAt,
        items: (adminBundle.items || []).map(item => {
          const product = item.productId || {};
          return {
            productId: product._id || item.productId,
            productName: product.name || 'Unknown Product',
            productPrice: product.price || 0,
            productImage: product.imageUrl || '',
            quantity: item.quantity || 0,
            subtotal: (product.price || 0) * (item.quantity || 0)
          };
        }),
        totalItems: (adminBundle.items || []).length,
        totalProducts: (adminBundle.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0)
      };

      console.log(`   Items array length: ${adminTransformed.items.length}`);
      console.log(`   Total items: ${adminTransformed.totalItems}`);
      console.log(`   Total products: ${adminTransformed.totalProducts}`);
      
      if (adminTransformed.items.length > 0) {
        console.log('   ✅ Admin API items transformed');
        adminTransformed.items.forEach((item, index) => {
          console.log(`     ${index + 1}. ${item.productName} x ${item.quantity} = ₱${item.subtotal.toFixed(2)}`);
        });
      } else {
        console.log('   ❌ No admin API items found');
      }
    }

    // Step 4: Clean up test bundle
    console.log('\n🧹 Step 4: Cleaning up test bundle...');
    await Bundle.findByIdAndDelete(bundleId);
    console.log('✅ Test bundle deleted');

    // Step 5: Final recommendations
    console.log('\n💡 FINAL ANALYSIS & RECOMMENDATIONS:');
    console.log('=' .repeat(60));
    
    if (bundleAnalysis.withoutItems.length > 0) {
      console.log('❌ ISSUE FOUND: Some bundles have no items');
      console.log('   Bundles without items:');
      bundleAnalysis.withoutItems.forEach(bundle => {
        console.log(`     - ${bundle.name} (ID: ${bundle._id})`);
      });
    }
    
    if (bundleAnalysis.withMissingProducts.length > 0) {
      console.log('⚠️  ISSUE FOUND: Some bundles have missing product references');
      console.log('   Bundles with missing products:');
      bundleAnalysis.withMissingProducts.forEach(bundle => {
        console.log(`     - ${bundle.name} (ID: ${bundle._id})`);
      });
    }

    if (bundleAnalysis.withItems.length === allBundles.length) {
      console.log('✅ All bundles have valid items - the issue might be in the frontend');
    }

    console.log('\n🔧 NEXT STEPS:');
    console.log('1. Check how bundles are being created from the "website" interface');
    console.log('2. Verify the frontend is using the correct API endpoints');
    console.log('3. Check authentication and authorization for admin endpoints');
    console.log('4. Ensure the frontend is properly handling the API response format');

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

comprehensiveBundleTest();