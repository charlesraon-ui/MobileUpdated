// Simple PayMongo API test using fetch
const API_URL = 'http://localhost:5000';

// Test data simulating a cart checkout
const testPayload = {
  items: [
    {
      productId: "test-product-1",
      name: "Test Product 1",
      price: 150.00,
      imageUrl: "https://example.com/image1.jpg",
      quantity: 2
    },
    {
      productId: "test-product-2", 
      name: "Test Product 2",
      price: 250.00,
      imageUrl: "https://example.com/image2.jpg",
      quantity: 1
    }
  ],
  total: 600.00, // 150*2 + 250*1 + 50 delivery
  deliveryFee: 50,
  address: "123 Test Street, Test City, Philippines",
  deliveryType: "in-house",
  channel: "multi" // Support all payment methods
};

async function testPayMongoAPI() {
  try {
    console.log("🧪 Testing PayMongo E-Payment API...");
    console.log("📤 Payload:", JSON.stringify(testPayload, null, 2));

    const response = await fetch(`${API_URL}/api/orders/e-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In real app, this would include auth token
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify(testPayload)
    });

    const data = await response.json();
    
    console.log("📥 Response Status:", response.status);
    console.log("📥 Response Data:", JSON.stringify(data, null, 2));

    if (response.ok && data.success) {
      console.log("✅ E-Payment API working correctly!");
      console.log("🔗 Checkout URL:", data.payment?.checkoutUrl);
      console.log("📋 Order ID:", data.orderId);
      
      // Validate checkout URL
      const checkoutUrl = data.payment?.checkoutUrl;
      if (checkoutUrl && checkoutUrl.includes('checkout.paymongo.com')) {
        console.log("✅ Valid PayMongo checkout URL generated");
        return true;
      } else {
        console.log("❌ Invalid checkout URL format");
        return false;
      }
      
    } else {
      console.log("❌ E-Payment API failed");
      console.log("Error:", data.message);
      return false;
    }

  } catch (error) {
    console.error("❌ API Test Error:", error.message);
    return false;
  }
}

// Test without auth (should fail gracefully)
async function testWithoutAuth() {
  try {
    console.log("\n🔒 Testing without authentication...");

    const response = await fetch(`${API_URL}/api/orders/e-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // No auth header
      },
      body: JSON.stringify(testPayload)
    });

    const data = await response.json();
    
    console.log("📥 Response Status:", response.status);
    console.log("📥 Response Data:", JSON.stringify(data, null, 2));

    if (response.status === 401) {
      console.log("✅ Authentication properly required");
      return true;
    } else {
      console.log("❌ Authentication not properly enforced");
      return false;
    }

  } catch (error) {
    console.error("❌ Auth Test Error:", error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log("🚀 Starting PayMongo API Tests...\n");
  
  const results = [];
  
  // Test 1: API with auth
  results.push(await testPayMongoAPI());
  
  // Test 2: API without auth
  results.push(await testWithoutAuth());
  
  console.log("\n📊 Test Results:");
  console.log(`✅ Passed: ${results.filter(r => r).length}/${results.length}`);
  console.log(`❌ Failed: ${results.filter(r => !r).length}/${results.length}`);
  
  console.log("\n🎉 PayMongo API Tests Completed!");
}

runTests().catch(console.error);