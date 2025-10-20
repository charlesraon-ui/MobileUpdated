import mongoose from 'mongoose';
import Bundle from './models/Bundle.js';
import Product from './models/Products.js';

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/mobile-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function createSampleBundles() {
  try {
    console.log('🚀 Creating sample bundles...');
    
    // Get some products to create bundles with
    const products = await Product.find({}).limit(10);
    console.log(`Found ${products.length} products`);
    
    if (products.length < 2) {
      console.log('Not enough products to create bundles');
      return;
    }

    // Clear existing bundles
    await Bundle.deleteMany({});
    console.log('Cleared existing bundles');

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

    // Insert bundles
    const createdBundles = await Bundle.insertMany(sampleBundles);
    console.log(`✅ Created ${createdBundles.length} sample bundles:`);
    
    createdBundles.forEach((bundle, index) => {
      console.log(`${index + 1}. ${bundle.name} - ₱${bundle.bundlePrice} (${bundle.discount}% off)`);
    });

  } catch (error) {
    console.error('❌ Error creating sample bundles:', error);
  } finally {
    mongoose.connection.close();
  }
}

createSampleBundles();