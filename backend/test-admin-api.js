import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Bundle from './models/Bundle.js';
import Product from './models/Products.js';

async function testAdminAPI() {
  try {
    // Connect to MongoDB Atlas
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas');

    const bundleId = "68fa351c83f5e793e9b8ce90"; // Mobile Test Bundle ID
    
    console.log('\n🔧 Testing Admin API Logic (without auth)...');
    console.log(`Testing Bundle ID: ${bundleId}`);

    // Simulate the exact admin GET route logic from adminBundleRoutes.js
    const bundle = await Bundle.findById(bundleId)
      .populate('items.productId', 'name price imageUrl description category stock')
      .lean();
    
    if (!bundle) {
      console.log('❌ Bundle not found');
      return;
    }

    console.log(`\n✅ Bundle Found: ${bundle.name}`);
    console.log(`   Raw items array length: ${bundle.items ? bundle.items.length : 0}`);
    
    // Check if items exist and are populated
    if (bundle.items && bundle.items.length > 0) {
      console.log('\n📋 Raw Items Data:');
      bundle.items.forEach((item, index) => {
        console.log(`   ${index + 1}. Raw item:`, JSON.stringify(item, null, 4));
      });
    }

    // Transform data exactly like admin route does
    const adminBundle = {
      _id: bundle._id,
      name: bundle.name,
      description: bundle.description,
      bundlePrice: bundle.bundlePrice,
      originalPrice: bundle.originalPrice,
      discount: bundle.discount,
      stock: bundle.stock,
      active: bundle.active,
      createdAt: bundle.createdAt,
      updatedAt: bundle.updatedAt,
      items: bundle.items.map(item => ({
        productId: item.productId._id,
        productName: item.productId.name,
        productPrice: item.productId.price,
        productImage: item.productId.imageUrl,
        quantity: item.quantity,
        subtotal: item.productId.price * item.quantity
      })),
      totalItems: bundle.items.length,
      totalProducts: bundle.items.reduce((sum, item) => sum + item.quantity, 0)
    };

    console.log('\n🎯 Admin Transformed Bundle:');
    console.log(`   Name: ${adminBundle.name}`);
    console.log(`   Total Items: ${adminBundle.totalItems}`);
    console.log(`   Total Products: ${adminBundle.totalProducts}`);
    console.log(`   Items array length: ${adminBundle.items.length}`);
    
    if (adminBundle.items && adminBundle.items.length > 0) {
      console.log('\n📦 Transformed Items:');
      adminBundle.items.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.productName} x ${item.quantity} = ₱${item.subtotal}`);
      });
    } else {
      console.log('   ❌ No items in transformed bundle!');
    }

    // Test the list all bundles route logic too
    console.log('\n📋 Testing List All Bundles Logic...');
    const allBundles = await Bundle.find()
      .populate('items.productId', 'name price imageUrl description category stock')
      .sort({ createdAt: -1 })
      .lean();

    const testBundle = allBundles.find(b => b._id.toString() === bundleId);
    if (testBundle) {
      console.log(`✅ Found in list: ${testBundle.name}`);
      console.log(`   Items in list: ${testBundle.items ? testBundle.items.length : 0}`);
      
      // Transform like the list route does
      const listTransformed = {
        _id: testBundle._id,
        name: testBundle.name,
        description: testBundle.description,
        bundlePrice: testBundle.bundlePrice,
        originalPrice: testBundle.originalPrice,
        discount: testBundle.discount,
        stock: testBundle.stock,
        active: testBundle.active,
        createdAt: testBundle.createdAt,
        updatedAt: testBundle.updatedAt,
        items: (testBundle.items || []).map(item => {
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
        totalItems: (testBundle.items || []).length,
        totalProducts: (testBundle.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0)
      };
      
      console.log(`   List transformed items: ${listTransformed.items.length}`);
      console.log(`   List total products: ${listTransformed.totalProducts}`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

testAdminAPI();