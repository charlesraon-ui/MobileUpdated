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

async function createDemoBundle() {
  try {
    console.log('🎯 Creating a demo bundle to test mobile app integration...\n');
    
    // Check if demo bundle already exists
    const existingDemo = await Bundle.findOne({ name: /Demo Bundle/i });
    if (existingDemo) {
      console.log('📦 Demo bundle already exists, removing it first...');
      await Bundle.findByIdAndDelete(existingDemo._id);
      console.log('✅ Existing demo bundle removed');
    }
    
    // Get some products for the demo bundle
    const products = await Product.find().limit(2).lean();
    
    if (products.length < 2) {
      console.log('❌ Not enough products available');
      mongoose.disconnect();
      return;
    }
    
    console.log('📋 Selected products for demo bundle:');
    products.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.name} - ₱${product.price}`);
    });
    
    // Calculate pricing
    const originalPrice = products.reduce((total, product) => total + product.price, 0);
    const discountPercent = 25; // 25% discount for demo
    const bundlePrice = Math.round(originalPrice * (1 - discountPercent / 100));
    
    // Create demo bundle
    const demoBundleData = {
      name: 'Demo Bundle - Special Offer',
      description: 'A special demo bundle to showcase admin functionality and mobile app integration',
      items: products.map(product => ({
        productId: product._id,
        quantity: 1
      })),
      bundlePrice: bundlePrice,
      originalPrice: originalPrice,
      discount: discountPercent,
      stock: 5,
      active: true
    };
    
    console.log('\n🌐 Creating demo bundle via API...');
    const response = await fetch(`${API_BASE_URL}/bundles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(demoBundleData)
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.log(`❌ Failed to create demo bundle: ${response.status}`);
      console.log(`Error: ${errorData}`);
      mongoose.disconnect();
      return;
    }
    
    const createdBundle = await response.json();
    console.log('✅ Demo bundle created successfully!');
    console.log(`Bundle ID: ${createdBundle._id}`);
    console.log(`Bundle Name: ${createdBundle.name}`);
    console.log(`Bundle Price: ₱${createdBundle.bundlePrice}`);
    console.log(`Original Price: ₱${createdBundle.originalPrice}`);
    console.log(`Discount: ${createdBundle.discount}%`);
    console.log(`Items: ${createdBundle.items.length}`);
    
    // Verify it appears in the mobile API
    console.log('\n📱 Verifying demo bundle appears in mobile app API...');
    const mobileResponse = await fetch(`${API_BASE_URL}/bundles`);
    const allBundles = await mobileResponse.json();
    
    console.log(`\n📊 Current bundles in mobile app (${allBundles.length} total):`);
    allBundles.forEach((bundle, index) => {
      const isDemo = bundle._id === createdBundle._id;
      console.log(`  ${index + 1}. ${bundle.name} - ₱${bundle.bundlePrice} ${isDemo ? '🆕 (NEW DEMO)' : ''}`);
    });
    
    const demoInList = allBundles.find(bundle => bundle._id === createdBundle._id);
    if (demoInList) {
      console.log('\n✅ Demo bundle successfully appears in mobile app API!');
      console.log('🎉 Admin can create bundles and they will reflect immediately in the mobile app.');
    } else {
      console.log('\n❌ Demo bundle does not appear in mobile app API');
    }
    
    console.log('\n📝 Instructions:');
    console.log('1. Check the mobile app preview to see the new "Demo Bundle - Special Offer"');
    console.log('2. The bundle should appear alongside the existing bundles');
    console.log('3. You can delete this demo bundle by running: node delete-demo-bundle.js');
    
    mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error creating demo bundle:', err);
    mongoose.disconnect();
  }
}

createDemoBundle();