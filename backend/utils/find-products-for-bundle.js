import mongoose from 'mongoose';
import Product from './models/Products.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connect to MongoDB Atlas
const mongoUri = process.env.MONGO_URI || 'mongodb+srv://levymarcelo555:xtsr8gqeaq1brvBZ@cluster0.lyyf48t.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoUri);

async function findProductsForBundle() {
  try {
    console.log('🔍 Finding products for Premium Rice Collection bundle...');
    
    // Products we need to find based on admin interface
    const targetProducts = [
      'Buco Pandan',
      'Water Lily', 
      'Jasmine Denorado',
      'Sticky Jasmine Rice'
    ];
    
    console.log('\n🎯 Looking for these products:');
    targetProducts.forEach((name, index) => {
      console.log(`${index + 1}. ${name}`);
    });
    
    console.log('\n📦 Search Results:');
    console.log('='.repeat(50));
    
    const foundProducts = [];
    
    for (const productName of targetProducts) {
      // Try exact match first
      let product = await Product.findOne({ 
        name: { $regex: new RegExp(`^${productName}$`, 'i') }
      }).lean();
      
      // If not found, try partial match
      if (!product) {
        product = await Product.findOne({ 
          name: { $regex: new RegExp(productName, 'i') }
        }).lean();
      }
      
      if (product) {
        console.log(`✅ Found: ${product.name}`);
        console.log(`   ID: ${product._id}`);
        console.log(`   Price: ₱${product.price}`);
        console.log(`   Category: ${product.category || 'N/A'}`);
        console.log('');
        foundProducts.push(product);
      } else {
        console.log(`❌ NOT FOUND: ${productName}`);
        console.log('');
      }
    }
    
    console.log('\n📊 Summary:');
    console.log(`Found ${foundProducts.length} out of ${targetProducts.length} products`);
    
    if (foundProducts.length === targetProducts.length) {
      console.log('\n🎉 All products found! Ready to update bundle.');
      
      // Calculate total price
      const totalPrice = foundProducts.reduce((sum, product) => sum + product.price, 0);
      console.log(`\n💰 Pricing calculation:`);
      console.log(`Total items price: ₱${totalPrice}`);
      console.log(`Target bundle price: ₱2899`);
      console.log(`Discount: ₱${totalPrice - 2899} (${Math.round(((totalPrice - 2899) / totalPrice) * 100)}%)`);
      
      console.log('\n🔧 Bundle update data:');
      console.log(JSON.stringify({
        bundlePrice: 2899,
        originalPrice: totalPrice,
        discount: Math.round(((totalPrice - 2899) / totalPrice) * 100),
        items: foundProducts.map(product => ({
          productId: product._id,
          quantity: 1
        }))
      }, null, 2));
      
    } else {
      console.log('\n⚠️  Some products are missing. Let\'s see what products are available:');
      
      // Show all available products
      const allProducts = await Product.find({}).lean();
      console.log(`\nAll available products (${allProducts.length} total):`);
      allProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name} - ₱${product.price}`);
      });
    }
    
    mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error finding products:', err);
    mongoose.disconnect();
  }
}

findProductsForBundle();