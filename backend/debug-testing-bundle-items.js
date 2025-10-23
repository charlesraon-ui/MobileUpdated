import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Bundle from './models/Bundle.js';
import Products from './models/Products.js';

async function debugTestingBundleItems() {
  try {
    // Connect to MongoDB Atlas
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas');

    console.log('\n🔍 Investigating TESTING bundle items...');
    
    // Find the TESTING bundle with raw data
    const testingBundle = await Bundle.findOne({ name: "TESTING" });
    
    if (testingBundle) {
      console.log(`📦 TESTING Bundle Details:`);
      console.log(`   ID: ${testingBundle._id}`);
      console.log(`   Name: ${testingBundle.name}`);
      console.log(`   Active: ${testingBundle.active}`);
      console.log(`   Description: ${testingBundle.description}`);
      console.log(`   Price: ${testingBundle.price}`);
      console.log(`   Items array: ${JSON.stringify(testingBundle.items, null, 2)}`);
      console.log(`   Items length: ${testingBundle.items ? testingBundle.items.length : 'undefined'}`);
      
      // Check if items exist and what they contain
      if (testingBundle.items && testingBundle.items.length > 0) {
        console.log('\n🔍 Checking each item in the bundle:');
        for (let i = 0; i < testingBundle.items.length; i++) {
          const item = testingBundle.items[i];
          console.log(`\n   Item ${i + 1}:`);
          console.log(`     ProductId: ${item.productId}`);
          console.log(`     Quantity: ${item.quantity}`);
          
          // Try to find the actual product
          if (item.productId) {
            const product = await Products.findById(item.productId);
            if (product) {
              console.log(`     ✅ Product found: ${product.name} - ₱${product.price}`);
            } else {
              console.log(`     ❌ Product NOT found in database`);
            }
          }
        }
      } else {
        console.log('\n❌ No items found in the bundle');
      }
      
      // Test population
      console.log('\n🧪 Testing bundle population...');
      const populatedBundle = await Bundle.findOne({ name: "TESTING" }).populate('items.productId');
      console.log(`   Populated items: ${JSON.stringify(populatedBundle.items, null, 2)}`);
      
      // Test the exact query used in the API
      console.log('\n🧪 Testing API query...');
      const apiBundle = await Bundle.find({ active: true }).populate('items.productId');
      const testingInApi = apiBundle.find(b => b.name === "TESTING");
      
      if (testingInApi) {
        console.log(`   TESTING bundle found in API query:`);
        console.log(`     Items count: ${testingInApi.items ? testingInApi.items.length : 0}`);
        console.log(`     Items: ${JSON.stringify(testingInApi.items, null, 2)}`);
      } else {
        console.log(`   ❌ TESTING bundle NOT found in API query`);
      }
      
    } else {
      console.log('❌ TESTING bundle not found');
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

debugTestingBundleItems();