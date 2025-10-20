import axios from 'axios';

const API_URL = 'http://localhost:5000';

async function createBundlesViaAPI() {
  try {
    console.log('🚀 Creating sample bundles via API...');
    
    // First, get some products to create bundles with
    const productsResponse = await axios.get(`${API_URL}/api/products`);
    const products = productsResponse.data;
    console.log(`Found ${products.length} products`);
    
    if (products.length < 2) {
      console.log('Not enough products to create bundles');
      return;
    }

    // Create sample bundles
    const sampleBundles = [
      {
        name: "Starter Farm Bundle",
        description: "Perfect bundle for new farmers - includes essential seeds and tools",
        items: [
          { productId: products[0]._id, quantity: 2 },
          { productId: products[1]._id, quantity: 1 }
        ],
        bundlePrice: Math.round((products[0].price * 2 + products[1].price) * 0.85), // 15% discount
        originalPrice: products[0].price * 2 + products[1].price,
        discount: 15,
        stock: 25,
        active: true
      },
      {
        name: "Vegetable Garden Bundle",
        description: "Everything you need for a thriving vegetable garden",
        items: [
          { productId: products[2]._id, quantity: 3 },
          { productId: products[3]._id, quantity: 2 }
        ],
        bundlePrice: Math.round((products[2].price * 3 + products[3].price * 2) * 0.8), // 20% discount
        originalPrice: products[2].price * 3 + products[3].price * 2,
        discount: 20,
        stock: 15,
        active: true
      },
      {
        name: "Premium Farming Kit",
        description: "Professional-grade farming equipment and premium seeds",
        items: [
          { productId: products[4]._id, quantity: 1 },
          { productId: products[0]._id, quantity: 3 },
          { productId: products[1]._id, quantity: 2 }
        ],
        bundlePrice: Math.round((products[4].price + products[0].price * 3 + products[1].price * 2) * 0.9), // 10% discount
        originalPrice: products[4].price + products[0].price * 3 + products[1].price * 2,
        discount: 10,
        stock: 8,
        active: true
      }
    ];

    // Create each bundle via API
    for (const bundle of sampleBundles) {
      try {
        const response = await axios.post(`${API_URL}/api/bundles`, bundle);
        console.log(`✅ Created bundle: ${bundle.name} - ₱${bundle.bundlePrice} (${bundle.discount}% off)`);
      } catch (error) {
        console.error(`❌ Failed to create bundle ${bundle.name}:`, error.response?.data || error.message);
      }
    }

    console.log('🎉 Finished creating sample bundles!');

  } catch (error) {
    console.error('❌ Error creating sample bundles:', error.message);
  }
}

createBundlesViaAPI();