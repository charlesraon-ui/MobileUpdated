// test-admin-bundle-endpoints.js
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

// Test admin credentials (using existing admin from database)
const ADMIN_CREDENTIALS = {
  email: 'admin@gmail.com', // Using existing admin email
  password: 'admin' // Correct admin password found
};

async function testAdminBundleEndpoints() {
  try {
    console.log('🔐 Testing Admin Bundle Endpoints...\n');

    // Step 1: Login as admin to get token
    console.log('1. Logging in as admin...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ADMIN_CREDENTIALS)
    });

    if (!loginResponse.ok) {
      console.error('❌ Admin login failed:', await loginResponse.text());
      console.log('⚠️ Please update ADMIN_CREDENTIALS in this script with valid admin credentials');
      return;
    }

    const loginData = await loginResponse.json();
    const adminToken = loginData.token;
    console.log('✅ Admin login successful');

    // Step 2: Test GET /api/admin/bundles
    console.log('\n2. Testing GET /api/admin/bundles...');
    const bundlesResponse = await fetch(`${BASE_URL}/api/admin/bundles`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!bundlesResponse.ok) {
      console.error('❌ Admin bundles fetch failed:', await bundlesResponse.text());
      return;
    }

    const bundlesData = await bundlesResponse.json();
    console.log('✅ Admin bundles fetch successful');
    console.log(`📦 Found ${bundlesData.length} bundles`);

    if (bundlesData.length > 0) {
      const firstBundle = bundlesData[0];
      console.log('\n📋 First bundle details:');
      console.log(`   Name: ${firstBundle.name}`);
      console.log(`   Price: ₱${firstBundle.bundlePrice}`);
      console.log(`   Items: ${firstBundle.totalItems}`);
      console.log(`   Products: ${firstBundle.totalProducts}`);
      
      if (firstBundle.items && firstBundle.items.length > 0) {
        console.log('   📦 Bundle items:');
        firstBundle.items.forEach((item, index) => {
          console.log(`      ${index + 1}. ${item.productName} (Qty: ${item.quantity}) - ₱${item.productPrice}`);
        });
      }

      // Step 3: Test GET /api/admin/bundles/:id
      console.log(`\n3. Testing GET /api/admin/bundles/${firstBundle._id}...`);
      const singleBundleResponse = await fetch(`${BASE_URL}/api/admin/bundles/${firstBundle._id}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (singleBundleResponse.ok) {
        const singleBundleData = await singleBundleResponse.json();
        console.log('✅ Single bundle fetch successful');
        console.log(`   Bundle: ${singleBundleData.name}`);
        console.log(`   Complete data: ${singleBundleData.items.every(item => item.productName) ? 'YES' : 'NO'}`);
      } else {
        console.error('❌ Single bundle fetch failed:', await singleBundleResponse.text());
      }
    }

    // Step 4: Test GET /api/admin/bundles/stats
    console.log('\n4. Testing GET /api/admin/bundles/stats...');
    const statsResponse = await fetch(`${BASE_URL}/api/admin/bundles/stats`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      console.log('✅ Bundle stats fetch successful');
      console.log('📊 Bundle Statistics:');
      console.log(`   Total Bundles: ${statsData.totalBundles}`);
      console.log(`   Active Bundles: ${statsData.activeBundles}`);
      console.log(`   Inactive Bundles: ${statsData.inactiveBundles}`);
      console.log(`   Average Items per Bundle: ${statsData.averageItemsPerBundle}`);
      console.log(`   Total Bundle Value: ₱${statsData.totalBundleValue}`);
    } else {
      console.error('❌ Bundle stats fetch failed:', await statsResponse.text());
    }

    // Step 5: Compare with regular bundle endpoint
    console.log('\n5. Comparing with regular /api/bundles endpoint...');
    const regularBundlesResponse = await fetch(`${BASE_URL}/api/bundles`);
    
    if (regularBundlesResponse.ok) {
      const regularBundlesData = await regularBundlesResponse.json();
      console.log('✅ Regular bundles fetch successful');
      
      if (regularBundlesData.length > 0 && bundlesData.length > 0) {
        const regularBundle = regularBundlesData[0];
        const adminBundle = bundlesData[0];
        
        console.log('\n🔍 Data Comparison:');
        console.log('Regular endpoint (mobile):');
        console.log(`   Items populated: ${regularBundle.items && regularBundle.items[0] && regularBundle.items[0].productId && typeof regularBundle.items[0].productId === 'object' ? 'YES' : 'NO'}`);
        
        console.log('Admin endpoint (web):');
        console.log(`   Items populated: ${adminBundle.items && adminBundle.items[0] && adminBundle.items[0].productName ? 'YES' : 'NO'}`);
        console.log(`   Product details: ${adminBundle.items && adminBundle.items[0] ? 'Complete' : 'Missing'}`);
      }
    }

    console.log('\n🎉 Admin bundle endpoints test completed!');
    console.log('\n💡 To fix your admin interface:');
    console.log('   1. Update your admin web app to use: /api/admin/bundles');
    console.log('   2. Include Authorization header with admin token');
    console.log('   3. The response will have complete product details');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAdminBundleEndpoints();