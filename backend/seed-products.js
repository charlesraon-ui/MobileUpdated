// seed-products.js - Add sample products with reviews
import mongoose from 'mongoose';
import Product from './models/Products.js';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const sampleProducts = [
  {
    name: "Royal Authentic Basmati Rice",
    price: 100.00,
    imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400",
    category: "Rice",
    description: "Premium quality basmati rice with authentic aroma and taste",
    tags: ["rice", "basmati", "premium"],
    weightKg: 5,
    catalog: true,
    stock: 50,
    sold: 25
  },
  {
    name: "Kamada 16L Knapsack Sprayer",
    price: 1600.00,
    imageUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400",
    category: "Farm Equipment",
    description: "High-quality knapsack sprayer for efficient crop protection",
    tags: ["sprayer", "equipment", "farming"],
    weightKg: 3.5,
    catalog: true,
    stock: 15,
    sold: 8
  },
  {
    name: "Dinorado Rice",
    price: 750.00,
    imageUrl: "https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400",
    category: "Rice",
    description: "Premium Dinorado rice variety with excellent taste and texture",
    tags: ["rice", "dinorado", "premium"],
    weightKg: 25,
    catalog: true,
    stock: 30,
    sold: 12
  }
];

const sampleReviews = [
  {
    rating: 5,
    comment: "Excellent quality rice! Very aromatic and cooks perfectly. Highly recommended for special occasions.",
  },
  {
    rating: 4,
    comment: "Good quality sprayer, works well for my small farm. Easy to use and maintain.",
  },
  {
    rating: 5,
    comment: "Best Dinorado rice I've ever bought. Perfect for everyday meals and special dishes.",
  },
  {
    rating: 4,
    comment: "Great value for money. The rice quality is consistent and tastes great.",
  },
  {
    rating: 5,
    comment: "This sprayer has made my farming work so much easier. Highly recommend!",
  }
];

async function seedProducts() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/goagritrading');
    console.log('Connected to MongoDB');

    // Create a sample user for reviews if none exists
    let sampleUser = await User.findOne({ email: 'reviewer@example.com' });
    if (!sampleUser) {
      sampleUser = new User({
        name: 'Sample Reviewer',
        email: 'reviewer@example.com',
        passwordHash: 'hashedpassword', // In real app, this would be properly hashed
      });
      await sampleUser.save();
      console.log('Created sample user for reviews');
    }

    // Check if products already exist - don't delete existing products!
    const existingProductCount = await Product.countDocuments();
    if (existingProductCount > 0) {
      console.log(`Found ${existingProductCount} existing products. Skipping seeding to preserve existing data.`);
      console.log('If you want to add sample products anyway, manually delete products first.');
      process.exit(0);
    }
    console.log('No existing products found. Adding sample products...');

    // Add sample products with reviews
    for (let i = 0; i < sampleProducts.length; i++) {
      const productData = { ...sampleProducts[i] };
      
      // Add 2-3 reviews per product
      productData.reviews = [];
      const numReviews = Math.floor(Math.random() * 2) + 2; // 2-3 reviews
      
      for (let j = 0; j < numReviews; j++) {
        const randomReview = sampleReviews[Math.floor(Math.random() * sampleReviews.length)];
        productData.reviews.push({
          userId: sampleUser._id,
          rating: randomReview.rating,
          comment: randomReview.comment,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
        });
      }

      const product = new Product(productData);
      await product.save();
      console.log(`Created product: ${product.name} with ${product.reviews.length} reviews`);
    }

    console.log('Successfully seeded products with reviews!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
}

seedProducts();