import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Bundle from './models/Bundle.js';
import Products from './models/Products.js';

async function fixTestingBundleItems() {
  try {
    // Connect to MongoDB Atlas
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas');

    console.log('\n🔍 Finding products mentioned in admin interface...');
    
    // Search for products that match the names shown in admin interface
    const productNames = [
      'Water Lily',
      'Dekalb 82825 Hybrid Corn Seeds', 
      'White Onion'
    ];
    
    console.log('Looking for products:');
    productNames.forEach(name => console.log(`  - ${name}`));
    
    const foundProducts = [];
    
    for (const productName of productNames) {
      // Try exact match first
      let product = await Products.findOne({ name: productName });
      
      if (!product) {
        // Try case-insensitive search
        product = await Products.findOne({ 
          name: { $regex: new RegExp(productName, 'i') } 
        });
      }
      
      if (!product) {
        // Try partial match
        product = await Products.findOne({ 
          name: { $regex: new RegExp(productName.split(' ')[0], 'i') } 
        });
      }
      
      if (product) {
        console.log(`✅ Found: ${product.name} (ID: ${product._id}) - ₱${product.price}`);
        foundProducts.push({
          productId: product._id,
          quantity: 1
        });
      } else {
        console.log(`❌ Not found: ${productName}`);
      }
    }
    
    if (foundProducts.length > 0) {
      console.log(`\n🔧 Adding ${foundProducts.length} items to TESTING bundle...`);
      
      // Update the TESTING bundle with the found products
      const result = await Bundle.updateOne(
        { name: "TESTING" },
        { 
          $set: { 
            items: foundProducts 
          } 
        }
      );
      
      console.log(`✅ Update result: ${JSON.stringify(result)}`);
      
      // Verify the update
      const updatedBundle = await Bundle.findOne({ name: "TESTING" }).populate('items.productId');
      console.log(`\n✅ Updated TESTING bundle:`);
      console.log(`   Items count: ${updatedBundle.items.length}`);
      updatedBundle.items.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.productId.name} x ${item.quantity} - ₱${item.productId.price}`);
      });
      
    } else {
      console.log('\n❌ No matching products found. Let me show all available products:');
      const allProducts = await Products.find({}).select('name price').limit(20);
      allProducts.forEach(product => {
        console.log(`  - ${product.name} (₱${product.price})`);
      });
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

fixTestingBundleItems();