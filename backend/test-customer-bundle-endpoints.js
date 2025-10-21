// test-customer-bundle-endpoints.js
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://localhost:5000';

async function testCustomerLogin() {
  try {
    console.log('🔑 Testing customer login...');
    
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@goagritrading.com', // Using admin for testing, but this would be a customer
        password: 'admin123'
      })
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Customer login successful');
    return data.token;
  } catch (error) {
    console.error('❌ Customer login failed:', error.message);
    throw error;
  }
}

async function testGetAllBundles() {
  try {
    console.log('\n📦 Testing GET /api/bundles (view all bundles)...');
    
    const response = await fetch(`${BASE_URL}/api/bundles`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch bundles: ${response.status}`);
    }

    const bundles = await response.json();
    console.log('✅ Successfully fetched bundles');
    console.log(`📊 Found ${bundles.length} active bundles`);
    
    if (bundles.length > 0) {
      console.log('📋 First bundle:', {
        id: bundles[0]._id,
        name: bundles[0].name,
        price: bundles[0].bundlePrice,
        originalPrice: bundles[0].originalPrice,
        discount: bundles[0].discount,
        stock: bundles[0].stock
      });
      return bundles[0]._id; // Return first bundle ID for testing
    }
    
    return null;
  } catch (error) {
    console.error('❌ Failed to fetch bundles:', error.message);
    throw error;
  }
}

async function testGetBundleDetails(bundleId) {
  try {
    console.log(`\n🔍 Testing GET /api/bundles/${bundleId} (view bundle details)...`);
    
    const response = await fetch(`${BASE_URL}/api/bundles/${bundleId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch bundle details: ${response.status}`);
    }

    const bundle = await response.json();
    console.log('✅ Successfully fetched bundle details');
    console.log('📦 Bundle details:', {
      name: bundle.name,
      description: bundle.description,
      bundlePrice: bundle.bundlePrice,
      originalPrice: bundle.originalPrice,
      discount: bundle.discount,
      stock: bundle.stock,
      itemsCount: bundle.items?.length || 0
    });
    
    return bundle;
  } catch (error) {
    console.error('❌ Failed to fetch bundle details:', error.message);
    throw error;
  }
}

async function testSubmitBundleOrder(bundleId, token) {
  try {
    console.log(`\n🛒 Testing POST /api/bundles/${bundleId}/order (submit bundle order)...`);
    
    const orderData = {
      quantity: 1,
      address: "123 Test Street, Test City, Test Province",
      deliveryType: "in-house",
      paymentMethod: "COD"
    };

    const response = await fetch(`${BASE_URL}/api/bundles/${bundleId}/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(orderData)
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(`Bundle order failed: ${response.status} - ${JSON.stringify(responseData)}`);
    }

    console.log('✅ Bundle order submitted successfully!');
    console.log('📋 Order details:', {
      orderId: responseData.data.orderId,
      bundleName: responseData.data.bundleName,
      quantity: responseData.data.quantity,
      subtotal: responseData.data.subtotal,
      deliveryFee: responseData.data.deliveryFee,
      total: responseData.data.total,
      status: responseData.data.status,
      estimatedDelivery: responseData.data.estimatedDelivery
    });
    
    return responseData.data;
  } catch (error) {
    console.error('❌ Bundle order failed:', error.message);
    throw error;
  }
}

async function testInvalidBundleOrder(token) {
  try {
    console.log('\n❌ Testing invalid bundle order (missing address)...');
    
    const orderData = {
      quantity: 1,
      deliveryType: "in-house",
      paymentMethod: "COD"
      // Missing address
    };

    const response = await fetch(`${BASE_URL}/api/bundles/invalid-id/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(orderData)
    });

    const responseData = await response.json();
    
    if (response.status === 400) {
      console.log('✅ Validation working correctly - rejected invalid order');
      console.log('📋 Error message:', responseData.message);
    } else {
      console.log('⚠️ Unexpected response:', response.status, responseData);
    }
  } catch (error) {
    console.error('❌ Error testing invalid order:', error.message);
  }
}

async function main() {
  try {
    console.log('🚀 Testing Customer Bundle Endpoints...\n');
    
    // Test 1: Get all bundles (no auth required)
    const bundleId = await testGetAllBundles();
    
    if (!bundleId) {
      console.log('⚠️ No bundles found. Please create a bundle first.');
      return;
    }
    
    // Test 2: Get bundle details (no auth required)
    await testGetBundleDetails(bundleId);
    
    // Test 3: Login as customer
    const token = await testCustomerLogin();
    
    // Test 4: Submit bundle order (auth required)
    await testSubmitBundleOrder(bundleId, token);
    
    // Test 5: Test validation
    await testInvalidBundleOrder(token);
    
    console.log('\n🎉 All customer bundle endpoint tests completed!');
    
  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
    process.exit(1);
  }
}

main();