// test-stats-endpoint.js
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
const ADMIN_CREDENTIALS = {
  email: 'admin@gmail.com',
  password: 'admin'
};

async function testStatsEndpoint() {
  try {
    console.log('🔐 Testing Admin Bundle Stats Endpoint...\n');

    // Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ADMIN_CREDENTIALS)
    });

    if (!loginResponse.ok) {
      console.error('❌ Admin login failed');
      return;
    }

    const loginData = await loginResponse.json();
    const adminToken = loginData.token;
    console.log('✅ Admin login successful');

    // Test stats endpoint
    console.log('\n2. Testing GET /api/admin/bundles/stats...');
    const statsResponse = await fetch(`${BASE_URL}/api/admin/bundles/stats`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Response status: ${statsResponse.status}`);
    
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      console.log('✅ Bundle stats fetch successful');
      console.log('\n📊 Bundle Statistics:');
      console.log(`   Total Bundles: ${statsData.totalBundles}`);
      console.log(`   Active Bundles: ${statsData.activeBundles}`);
      console.log(`   Inactive Bundles: ${statsData.inactiveBundles}`);
      console.log(`   Average Items per Bundle: ${statsData.averageItemsPerBundle}`);
      console.log(`   Total Bundle Value: ₱${statsData.totalBundleValue}`);
      console.log(`   Bundles with Items: ${statsData.bundlesWithItems}`);
      console.log(`   Bundles without Items: ${statsData.bundlesWithoutItems}`);
    } else {
      const errorText = await statsResponse.text();
      console.error('❌ Bundle stats fetch failed:', errorText);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testStatsEndpoint();