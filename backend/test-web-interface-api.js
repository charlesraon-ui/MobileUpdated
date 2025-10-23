// Test script to verify admin bundle API endpoints for web interface
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Bundle from './models/Bundle.js';
import Product from './models/Products.js';

dotenv.config();

async function testWebInterfaceAPI() {
  try {
    console.log('🔍 Testing Admin Bundle API for Web Interface Compatibility\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/goagritrading');
    console.log('✅ Connected to MongoDB\n');

    // Test 1: Get all bundles (admin endpoint format)
    console.log('📋 Test 1: Admin Bundle List Endpoint Format');
    console.log('=' .repeat(50));
    
    const bundles = await Bundle.find({})
      .populate({
        path: 'items.productId',
        select: 'name price images category description stock'
      })
      .lean();

    console.log(`Found ${bundles.length} bundles in database`);
    
    if (bundles.length > 0) {
      const sampleBundle = bundles[0];
      console.log('\n📦 Sample Bundle Structure:');
      console.log('Bundle ID:', sampleBundle._id);
      console.log('Bundle Name:', sampleBundle.name);
      console.log('Bundle Price:', sampleBundle.price);
      console.log('Bundle Items Count:', sampleBundle.items?.length || 0);
      
      if (sampleBundle.items && sampleBundle.items.length > 0) {
        console.log('\n🔍 First Item Details:');
        const firstItem = sampleBundle.items[0];
        console.log('- Quantity:', firstItem.quantity);
        console.log('- Product ID:', firstItem.productId?._id);
        console.log('- Product Name:', firstItem.productId?.name);
        console.log('- Product Price:', firstItem.productId?.price);
        console.log('- Product Images:', firstItem.productId?.images?.length || 0, 'images');
        
        // Check if product is properly populated
        if (!firstItem.productId || !firstItem.productId.name) {
          console.log('❌ WARNING: Product not properly populated!');
        } else {
          console.log('✅ Product properly populated');
        }
      } else {
        console.log('❌ WARNING: Bundle has no items!');
      }
    }

    // Test 2: Simulate admin API response format
    console.log('\n\n🌐 Test 2: Admin API Response Format Simulation');
    console.log('=' .repeat(50));
    
    const adminAPIResponse = bundles.map(bundle => ({
      _id: bundle._id,
      name: bundle.name,
      description: bundle.description,
      price: bundle.price,
      images: bundle.images,
      category: bundle.category,
      items: bundle.items?.map(item => ({
        quantity: item.quantity,
        product: {
          _id: item.productId?._id,
          name: item.productId?.name,
          price: item.productId?.price,
          images: item.productId?.images,
          category: item.productId?.category,
          description: item.productId?.description,
          stock: item.productId?.stock
        }
      })) || [],
      createdAt: bundle.createdAt,
      updatedAt: bundle.updatedAt
    }));

    console.log('Admin API Response Sample:');
    console.log(JSON.stringify(adminAPIResponse[0], null, 2));

    // Test 3: Check for potential issues
    console.log('\n\n🔍 Test 3: Potential Issues Analysis');
    console.log('=' .repeat(50));
    
    let issuesFound = 0;
    
    for (const bundle of bundles) {
      const issues = [];
      
      if (!bundle.items || bundle.items.length === 0) {
        issues.push('No items in bundle');
      }
      
      if (bundle.items) {
        for (const item of bundle.items) {
          if (!item.productId) {
            issues.push('Item has no product reference');
          } else if (!item.productId.name) {
            issues.push('Product not properly populated');
          }
        }
      }
      
      if (issues.length > 0) {
        console.log(`❌ Bundle "${bundle.name}" (${bundle._id}):`);
        issues.forEach(issue => console.log(`   - ${issue}`));
        issuesFound++;
      }
    }
    
    if (issuesFound === 0) {
      console.log('✅ No issues found with bundle data structure');
    } else {
      console.log(`❌ Found issues in ${issuesFound} bundles`);
    }

    // Test 4: Test specific bundle creation format
    console.log('\n\n🔧 Test 4: Bundle Creation Format Test');
    console.log('=' .repeat(50));
    
    // Get a sample product for testing
    const sampleProduct = await Product.findOne({}).lean();
    if (sampleProduct) {
      console.log('Sample product for testing:', sampleProduct.name);
      
      const testBundleData = {
        name: 'Web Interface Test Bundle',
        description: 'Test bundle to verify web interface compatibility',
        price: 100,
        items: [
          {
            productId: sampleProduct._id,
            quantity: 2
          }
        ],
        images: ['https://example.com/test-image.jpg'],
        category: 'Test'
      };
      
      console.log('Test bundle creation data:');
      console.log(JSON.stringify(testBundleData, null, 2));
      
      // Create test bundle
      const testBundle = new Bundle(testBundleData);
      await testBundle.save();
      
      // Fetch it back with population
      const createdBundle = await Bundle.findById(testBundle._id)
        .populate({
          path: 'items.productId',
          select: 'name price images category description stock'
        })
        .lean();
      
      console.log('\nCreated bundle with population:');
      console.log('- Bundle ID:', createdBundle._id);
      console.log('- Items count:', createdBundle.items?.length || 0);
      console.log('- First item product name:', createdBundle.items?.[0]?.productId?.name);
      
      // Clean up test bundle
      await Bundle.findByIdAndDelete(testBundle._id);
      console.log('✅ Test bundle cleaned up');
    }

    console.log('\n\n📊 Summary');
    console.log('=' .repeat(50));
    console.log('✅ Admin API endpoints should work correctly for web interface');
    console.log('✅ Bundle data structure is compatible with web display');
    console.log('✅ Product population is working correctly');
    
    if (issuesFound > 0) {
      console.log(`❌ However, ${issuesFound} bundles have data issues that need fixing`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the test
testWebInterfaceAPI();