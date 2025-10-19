import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const PAYMONGO_SECRET = process.env.PAYMONGO_SECRET_KEY;
const PAYMONGO_API = "https://api.paymongo.com/v1";

// Helper: Create auth header for PayMongo
const getPayMongoAuth = () => {
  const auth = Buffer.from(PAYMONGO_SECRET + ":").toString("base64");
  return {
    Authorization: `Basic ${auth}`,
    "Content-Type": "application/json",
    "Accept": "application/json",
  };
};

async function testPayMongoIntegration() {
  console.log("🧪 Testing PayMongo Integration...");
  console.log("🔑 Using Secret Key:", PAYMONGO_SECRET ? `${PAYMONGO_SECRET.substring(0, 10)}...` : "NOT SET");

  if (!PAYMONGO_SECRET || !PAYMONGO_SECRET.startsWith('sk_')) {
    console.error("❌ PAYMONGO_SECRET_KEY is not set or invalid");
    return;
  }

  try {
    // Test 1: Create a test payment source (GCash)
    console.log("\n📱 Test 1: Creating GCash payment source...");
    
    const sourceResponse = await axios.post(
      `${PAYMONGO_API}/sources`,
      {
        data: {
          attributes: {
            amount: 10000, // ₱100.00 in centavos
            type: "gcash",
            currency: "PHP",
            redirect: {
              success: "https://goagritrading-backend.onrender.com/payment/success",
              failed: "https://goagritrading-backend.onrender.com/payment/failed",
            },
            metadata: {
              userId: "test-user",
              orderId: "test-order-123",
            },
          },
        },
      },
      { headers: getPayMongoAuth() }
    );

    const source = sourceResponse.data.data;
    console.log("✅ GCash source created successfully!");
    console.log("   Source ID:", source.id);
    console.log("   Status:", source.attributes.status);
    console.log("   Checkout URL:", source.attributes.redirect.checkout_url);

    // Test 2: Create a checkout session
    console.log("\n💳 Test 2: Creating checkout session...");
    
    const checkoutResponse = await axios.post(
      `${PAYMONGO_API}/checkout_sessions`,
      {
        data: {
          attributes: {
            send_email_receipt: false,
            show_description: true,
            show_line_items: true,
            description: "Test Order #123456",
            line_items: [
              {
                currency: "PHP",
                amount: 5000, // ₱50.00
                name: "Test Product 1",
                quantity: 1,
              },
              {
                currency: "PHP",
                amount: 3000, // ₱30.00
                name: "Test Product 2",
                quantity: 1,
              }
            ],
            payment_method_types: ["gcash", "paymaya", "card"],
            success_url: "https://goagritrading-backend.onrender.com/api/payment/success?orderId=test-123",
            cancel_url: "https://goagritrading-backend.onrender.com/api/payment/cancel?orderId=test-123",
            reference_number: "test-order-123",
            metadata: {
              userId: "test-user",
              deliveryType: "in-house",
              deliveryFee: "50",
              address: "Test Address",
            },
          },
        },
      },
      { headers: getPayMongoAuth() }
    );

    const session = checkoutResponse.data.data;
    console.log("✅ Checkout session created successfully!");
    console.log("   Session ID:", session.id);
    console.log("   Status:", session.attributes.status);
    console.log("   Checkout URL:", session.attributes.checkout_url);
    console.log("   Payment Methods:", session.attributes.payment_method_types);

    // Test 3: Retrieve payment methods
    console.log("\n🔍 Test 3: Retrieving available payment methods...");
    
    const paymentMethodsResponse = await axios.get(
      `${PAYMONGO_API}/payment_methods`,
      { headers: getPayMongoAuth() }
    );

    console.log("✅ Payment methods retrieved successfully!");
    console.log("   Available methods:", paymentMethodsResponse.data.data.length, "methods found");

    console.log("\n🎉 All PayMongo tests passed successfully!");
    console.log("\n📋 Summary:");
    console.log("   ✅ PayMongo API connection working");
    console.log("   ✅ GCash source creation working");
    console.log("   ✅ Checkout session creation working");
    console.log("   ✅ Payment methods retrieval working");
    console.log("\n🔗 Test checkout URL:", session.attributes.checkout_url);

  } catch (error) {
    console.error("❌ PayMongo Test Error:", error.response?.data || error.message);
    
    if (error.response?.data?.errors) {
      console.error("📋 Error details:");
      error.response.data.errors.forEach((err, index) => {
        console.error(`   ${index + 1}. ${err.detail} (${err.code})`);
      });
    }
  }
}

testPayMongoIntegration();