import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Bundle from './models/Bundle.js';
import Product from './models/Products.js';

async function debugAdminVsMobile() {
  try {
    // Connect to MongoDB Atlas
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas');

    const bundleId = "68fa351c83f5e793e9b8ce90"; // Mobile Test Bundle ID
    
    console.log('\n🔍 Debugging Admin vs Mobile API responses...');
    console.log(`Testing Bundle ID: ${bundleId}`);

    // 1. Raw database query (what's actually in MongoDB)
    console.log('\n📊 Step 1: Raw Database Data');
    const rawBundle = await Bundle.findById(bundleId).lean();
    if (rawBundle) {
      console.log(`✅ Raw Bundle Found: ${rawBundle.name}`);
      console.log(`   Items array length: ${rawBundle.items ? rawBundle.items.length : 0}`);
      console.log(`   Raw items:`, JSON.stringify(rawBundle.items, null, 2));
    } else {
      console.log('❌ Bundle not found in database');
      return;
    }

    // 2. Mobile API simulation (bundleRoutes.js logic)
    console.log('\n📱 Step 2: Mobile API Response Simulation');
    const mobileBundle = await Bundle.findById(bundleId)
      .populate('items.productId', 'name price imageUrl')
      .lean();
    
    if (mobileBundle) {
      console.log(`✅ Mobile API Bundle: ${mobileBundle.name}`);
      console.log(`   Items count: ${mobileBundle.items ? mobileBundle.items.length : 0}`);
      console.log(`   Price: ₱${mobileBundle.price || mobileBundle.bundlePrice}`);
      
      if (mobileBundle.items && mobileBundle.items.length > 0) {
        console.log('   Items details:');
        mobileBundle.items.forEach((item, index) => {
          console.log(`     ${index + 1}. ${item.productId ? item.productId.name : 'Unknown'} x ${item.quantity}`);
        });
      } else {
        console.log('   ❌ No items found in mobile response');
      }
    }

    // 3. Admin API simulation (adminBundleRoutes.js logic)
    console.log('\n🔧 Step 3: Admin API Response Simulation');
    
    // First, let's check what the admin GET route does
    const adminBundle = await Bundle.findById(bundleId)
      .populate('items.productId', 'name price imageUrl category stock')
      .lean();
    
    if (adminBundle) {
      console.log(`✅ Admin API Bundle: ${adminBundle.name}`);
      
      // Simulate admin transformation logic
      const totalItems = adminBundle.items ? adminBundle.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
      const totalProducts = adminBundle.items ? adminBundle.items.length : 0;
      
      console.log(`   Total items: ${totalItems}`);
      console.log(`   Total products: ${totalProducts}`);
      console.log(`   Items array length: ${adminBundle.items ? adminBundle.items.length : 0}`);
      
      if (adminBundle.items && adminBundle.items.length > 0) {
        console.log('   Admin items details:');
        adminBundle.items.forEach((item, index) => {
          console.log(`     ${index + 1}. ${item.productId ? item.productId.name : 'Unknown'} x ${item.quantity}`);
          if (!item.productId) {
            console.log(`       ❌ Missing productId for item at index ${index}`);
          }
        });
      } else {
        console.log('   ❌ No items found in admin response');
      }
    }

    // 4. Check for orphaned product references
    console.log('\n🔍 Step 4: Checking Product References');
    if (rawBundle.items && rawBundle.items.length > 0) {
      for (let i = 0; i < rawBundle.items.length; i++) {
        const item = rawBundle.items[i];
        console.log(`\n   Checking item ${i + 1}:`);
        console.log(`     ProductId: ${item.productId}`);
        console.log(`     Quantity: ${item.quantity}`);
        
        const product = await Product.findById(item.productId);
        if (product) {
          console.log(`     ✅ Product found: ${product.name} - ₱${product.price}`);
        } else {
          console.log(`     ❌ Product NOT found in database!`);
        }
      }
    }

    // 5. Test actual API endpoints
    console.log('\n🌐 Step 5: Testing Actual API Endpoints');
    
    // We'll simulate the actual HTTP requests by calling the route logic directly
    console.log('   This would require actual HTTP requests to test the endpoints');
    console.log('   Mobile endpoint: GET /api/bundles/' + bundleId);
    console.log('   Admin endpoint: GET /api/admin/bundles/' + bundleId);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

debugAdminVsMobile();