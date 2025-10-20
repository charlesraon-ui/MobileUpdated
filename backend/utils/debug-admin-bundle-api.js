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

async function debugAdminBundleAPI() {
  try {
    console.log('🔍 Debugging Admin vs Mobile Bundle API Responses...\n');
    
    // Test 1: Direct database query (what should be the source of truth)
    console.log('📊 Test 1: Direct Database Query');
    console.log('='.repeat(50));
    
    const dbBundles = await Bundle.find({ active: true })
      .populate('items.productId', 'name price imageUrl')
      .lean();
    
    console.log(`Found ${dbBundles.length} bundles in database:`);
    dbBundles.forEach((bundle, index) => {
      console.log(`\n${index + 1}. ${bundle.name}`);
      console.log(`   Price: ₱${bundle.bundlePrice}`);
      console.log(`   Original Price: ₱${bundle.originalPrice}`);
      console.log(`   Discount: ${bundle.discount}%`);
      console.log(`   Items: ${bundle.items.length}`);
      
      if (bundle.items.length > 0) {
        console.log('   Product Details:');
        bundle.items.forEach((item, itemIndex) => {
          const product = item.productId;
          if (product) {
            console.log(`     ${itemIndex + 1}. ${product.name} - ₱${product.price} x ${item.quantity}`);
          } else {
            console.log(`     ${itemIndex + 1}. [MISSING PRODUCT] - ProductID: ${item.productId} x ${item.quantity}`);
          }
        });
      } else {
        console.log('   ⚠️  NO ITEMS FOUND');
      }
    });
    
    // Test 2: Mobile API endpoint (GET /api/bundles)
    console.log('\n\n📱 Test 2: Mobile API Endpoint (GET /api/bundles)');
    console.log('='.repeat(50));
    
    try {
      const mobileResponse = await fetch(`${API_BASE_URL}/bundles`);
      if (mobileResponse.ok) {
        const mobileBundles = await mobileResponse.json();
        console.log(`Mobile API returned ${mobileBundles.length} bundles:`);
        
        mobileBundles.forEach((bundle, index) => {
          console.log(`\n${index + 1}. ${bundle.name}`);
          console.log(`   Price: ₱${bundle.bundlePrice}`);
          console.log(`   Original Price: ₱${bundle.originalPrice}`);
          console.log(`   Discount: ${bundle.discount}%`);
          console.log(`   Items: ${bundle.items ? bundle.items.length : 0}`);
          
          if (bundle.items && bundle.items.length > 0) {
            console.log('   Product Details:');
            bundle.items.forEach((item, itemIndex) => {
              const product = item.productId;
              if (product) {
                console.log(`     ${itemIndex + 1}. ${product.name} - ₱${product.price} x ${item.quantity}`);
              } else {
                console.log(`     ${itemIndex + 1}. [MISSING PRODUCT] - ProductID: ${item.productId} x ${item.quantity}`);
              }
            });
          } else {
            console.log('   ⚠️  NO ITEMS FOUND IN API RESPONSE');
          }
        });
      } else {
        console.log(`❌ Mobile API failed: ${mobileResponse.status}`);
      }
    } catch (error) {
      console.log(`❌ Mobile API error: ${error.message}`);
    }
    
    // Test 3: Individual bundle endpoint (GET /api/bundles/:id)
    console.log('\n\n🔍 Test 3: Individual Bundle Endpoints');
    console.log('='.repeat(50));
    
    for (const bundle of dbBundles.slice(0, 2)) { // Test first 2 bundles
      console.log(`\nTesting bundle: ${bundle.name} (ID: ${bundle._id})`);
      
      try {
        const singleResponse = await fetch(`${API_BASE_URL}/bundles/${bundle._id}`);
        if (singleResponse.ok) {
          const singleBundle = await singleResponse.json();
          console.log(`✅ Individual API response:`);
          console.log(`   Name: ${singleBundle.name}`);
          console.log(`   Price: ₱${singleBundle.bundlePrice}`);
          console.log(`   Items: ${singleBundle.items ? singleBundle.items.length : 0}`);
          
          if (singleBundle.items && singleBundle.items.length > 0) {
            console.log('   Product Details:');
            singleBundle.items.forEach((item, itemIndex) => {
              const product = item.productId;
              if (product) {
                console.log(`     ${itemIndex + 1}. ${product.name} - ₱${product.price} x ${item.quantity}`);
              } else {
                console.log(`     ${itemIndex + 1}. [MISSING PRODUCT] - ProductID: ${item.productId} x ${item.quantity}`);
              }
            });
          } else {
            console.log('   ⚠️  NO ITEMS IN INDIVIDUAL API RESPONSE');
          }
        } else {
          console.log(`❌ Individual API failed: ${singleResponse.status}`);
        }
      } catch (error) {
        console.log(`❌ Individual API error: ${error.message}`);
      }
    }
    
    // Test 4: Check for potential admin-specific endpoints
    console.log('\n\n🔧 Test 4: Checking for Admin-Specific Endpoints');
    console.log('='.repeat(50));
    
    const adminEndpoints = [
      '/api/admin/bundles',
      '/api/bundles/admin',
      '/api/bundles?admin=true',
      '/api/bundles?populate=false'
    ];
    
    for (const endpoint of adminEndpoints) {
      try {
        console.log(`\nTesting: ${endpoint}`);
        const response = await fetch(`${API_BASE_URL.replace('/api', '')}${endpoint}`);
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Response received (${Array.isArray(data) ? data.length : 'object'} items)`);
          
          if (Array.isArray(data) && data.length > 0) {
            const firstBundle = data[0];
            console.log(`   First bundle: ${firstBundle.name}`);
            console.log(`   Items: ${firstBundle.items ? firstBundle.items.length : 0}`);
            console.log(`   Items populated: ${firstBundle.items && firstBundle.items[0] && firstBundle.items[0].productId && typeof firstBundle.items[0].productId === 'object' ? 'YES' : 'NO'}`);
          }
        } else {
          console.log(`❌ ${response.status} - ${response.statusText}`);
        }
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
      }
    }
    
    // Test 5: Raw bundle data without population
    console.log('\n\n📋 Test 5: Raw Bundle Data (No Population)');
    console.log('='.repeat(50));
    
    const rawBundles = await Bundle.find({ active: true }).lean();
    console.log(`Found ${rawBundles.length} raw bundles:`);
    
    rawBundles.forEach((bundle, index) => {
      console.log(`\n${index + 1}. ${bundle.name}`);
      console.log(`   Price: ₱${bundle.bundlePrice}`);
      console.log(`   Items: ${bundle.items ? bundle.items.length : 0}`);
      
      if (bundle.items && bundle.items.length > 0) {
        console.log('   Raw Item Data:');
        bundle.items.forEach((item, itemIndex) => {
          console.log(`     ${itemIndex + 1}. ProductID: ${item.productId} x ${item.quantity}`);
        });
      } else {
        console.log('   ⚠️  NO ITEMS IN RAW DATA');
      }
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 ANALYSIS SUMMARY');
    console.log('='.repeat(60));
    console.log('This debug script helps identify:');
    console.log('1. Whether bundles have items in the database');
    console.log('2. Whether the mobile API properly populates product details');
    console.log('3. Whether there are separate admin endpoints');
    console.log('4. Whether the issue is in data population or API routing');
    
    mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error during debugging:', err);
    mongoose.disconnect();
  }
}

debugAdminBundleAPI();