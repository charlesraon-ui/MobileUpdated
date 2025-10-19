// restore-products.js - Quick script to help restore your products
import mongoose from 'mongoose';
import Product from './models/Products.js';
import dotenv from 'dotenv';

dotenv.config();

// Template products - replace these with your actual products
const productsToRestore = [
  {
    name: "Example Product 1",
    price: 100,
    category: "Farm tools", // Use your existing categories
    description: "Replace with your product description",
    imageUrl: "https://example.com/image1.jpg", // Replace with actual image URLs
    stock: 50,
    catalog: true,
    weightKg: 1.0,
    tags: ["farming", "tools"]
  },
  {
    name: "Example Product 2", 
    price: 250,
    category: "Fertilizer",
    description: "Replace with your product description",
    imageUrl: "https://example.com/image2.jpg",
    stock: 30,
    catalog: true,
    weightKg: 2.5,
    tags: ["fertilizer", "organic"]
  },
  // Add more products here following the same format
];

async function restoreProducts() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/goagri');
    console.log('Connected to MongoDB');

    console.log('\n=== PRODUCT RESTORATION SCRIPT ===');
    console.log('This script will help you quickly add your products back.');
    console.log('\nIMPORTANT: Edit this file first!');
    console.log('1. Replace the example products above with your actual products');
    console.log('2. Update names, prices, categories, descriptions, and image URLs');
    console.log('3. Run this script again after editing\n');

    // Check if user has edited the template
    const hasExampleProducts = productsToRestore.some(p => 
      p.name.includes('Example') || p.imageUrl.includes('example.com')
    );

    if (hasExampleProducts) {
      console.log('⚠️  TEMPLATE DETECTED: Please edit the productsToRestore array first!');
      console.log('   Replace the example products with your actual product data.');
      console.log('   Then run this script again.');
      process.exit(0);
    }

    // Add products to database
    console.log(`Adding ${productsToRestore.length} products...`);
    
    for (const productData of productsToRestore) {
      try {
        const product = new Product(productData);
        await product.save();
        console.log(`✅ Added: ${product.name} - ₱${product.price}`);
      } catch (error) {
        console.log(`❌ Failed to add ${productData.name}: ${error.message}`);
      }
    }

    // Show final count
    const totalProducts = await Product.countDocuments();
    console.log(`\n🎉 Restoration complete!`);
    console.log(`📊 Total products in database: ${totalProducts}`);
    console.log('\nYour products should now appear in:');
    console.log('- Mobile app');
    console.log('- Website at https://goagritrading.org/');
    
    process.exit(0);
  } catch (error) {
    console.error('Error restoring products:', error);
    process.exit(1);
  }
}

// Show usage instructions
console.log('\n📝 QUICK SETUP GUIDE:');
console.log('1. Edit this file and replace the example products with your real products');
console.log('2. Update: name, price, category, description, imageUrl, stock, weightKg');
console.log('3. Save the file');
console.log('4. Run: node restore-products.js');
console.log('\n🏷️  Available categories from your database:');
console.log('- Farm tools');
console.log('- Fertilizer');
console.log('- (check your admin panel for complete list)');

restoreProducts();