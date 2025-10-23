import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Bundle from './models/Bundle.js';
import Product from './models/Products.js';

async function createNewTestBundle() {
  try {
    // Connect to MongoDB Atlas
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas');

    console.log('\n🔍 Finding available products...');
    
    // Get some products to include in the bundle
    const products = await Product.find().limit(10);
    console.log(`Found ${products.length} products available`);
    
    // Display available products
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} - ₱${product.price}`);
    });

    // Select 4 specific products for our test bundle
    const selectedProducts = [
      { productId: products[0]._id, quantity: 2 }, // First product x2
      { productId: products[1]._id, quantity: 1 }, // Second product x1
      { productId: products[2]._id, quantity: 3 }, // Third product x3
      { productId: products[3]._id, quantity: 1 }  // Fourth product x1
    ];

    // Calculate total price from selected items
    let calculatedPrice = 0;
    console.log('\n📦 Selected items for new bundle:');
    for (let i = 0; i < selectedProducts.length; i++) {
      const item = selectedProducts[i];
      const product = products.find(p => p._id.toString() === item.productId.toString());
      const itemTotal = product.price * item.quantity;
      calculatedPrice += itemTotal;
      console.log(`   ${i + 1}. ${product.name} x ${item.quantity} = ₱${itemTotal}`);
    }
    
    console.log(`   Total calculated price: ₱${calculatedPrice}`);

    // Create bundle with 15% discount
    const discountedPrice = Math.round(calculatedPrice * 0.85);
    const bundleData = {
      name: "Mobile Test Bundle",
      description: "A test bundle created to verify mobile app integration and data synchronization",
      items: selectedProducts,
      price: discountedPrice,
      bundlePrice: discountedPrice,
      originalPrice: calculatedPrice,
      discount: Math.round(((calculatedPrice - discountedPrice) / calculatedPrice) * 100),
      stock: 25,
      active: true,
      imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop"
    };

    console.log('\n🔧 Creating new bundle...');
    console.log(`   Name: ${bundleData.name}`);
    console.log(`   Description: ${bundleData.description}`);
    console.log(`   Items: ${bundleData.items.length} products`);
    console.log(`   Original Price: ₱${bundleData.originalPrice}`);
    console.log(`   Bundle Price: ₱${bundleData.price}`);
    console.log(`   Discount: ${bundleData.discount}%`);
    console.log(`   Stock: ${bundleData.stock}`);

    // Create the bundle
    const newBundle = new Bundle(bundleData);
    const savedBundle = await newBundle.save();

    console.log('\n✅ Bundle created successfully!');
    console.log(`   Bundle ID: ${savedBundle._id}`);
    console.log(`   Created at: ${savedBundle.createdAt}`);

    // Verify by fetching the bundle with populated items
    console.log('\n🧪 Verifying created bundle...');
    const verifyBundle = await Bundle.findById(savedBundle._id)
      .populate('items.productId', 'name price imageUrl')
      .lean();

    console.log(`✅ Verification successful:`);
    console.log(`   Bundle: ${verifyBundle.name}`);
    console.log(`   Price: ₱${verifyBundle.price}`);
    console.log(`   Items count: ${verifyBundle.items.length}`);
    
    verifyBundle.items.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.productId.name} x ${item.quantity} - ₱${item.productId.price}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    
    return savedBundle._id;
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    throw error;
  }
}

createNewTestBundle()
  .then(bundleId => {
    console.log(`\n🎉 New test bundle created with ID: ${bundleId}`);
    console.log('You can now test this bundle in your mobile app!');
  })
  .catch(error => {
    console.error('Failed to create test bundle:', error.message);
  });