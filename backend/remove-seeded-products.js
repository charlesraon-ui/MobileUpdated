// remove-seeded-products.js - Remove seeded products to restore original data
import mongoose from 'mongoose';
import Product from './models/Products.js';
import Category from './models/Category.js';
import dotenv from 'dotenv';

dotenv.config();

const seededProductNames = [
  "Royal Authentic Basmati Rice",
  "Kamada 16L Knapsack Sprayer", 
  "Dinorado Rice",
  "Organic Fertilizer",
  "Garden Hose 50ft",
  "Tomato Seeds",
  "Corn Seeds",
  "Vegetable Starter Kit"
];

async function removeSeededProducts() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/goagri');
    console.log('Connected to MongoDB');

    // Remove seeded products
    const result = await Product.deleteMany({
      name: { $in: seededProductNames }
    });

    console.log(`Removed ${result.deletedCount} seeded products`);

    // Check remaining products
    const remainingProducts = await Product.find({});
    console.log(`Remaining products in database: ${remainingProducts.length}`);
    
    if (remainingProducts.length > 0) {
      console.log('Remaining products:');
      remainingProducts.forEach(product => {
        console.log(`- ${product.name} (${product.category})`);
      });
    } else {
      console.log('No products remaining in database');
    }

    await mongoose.disconnect();
    console.log('Database cleanup completed');
  } catch (error) {
    console.error('Error removing seeded products:', error);
    process.exit(1);
  }
}

removeSeededProducts();