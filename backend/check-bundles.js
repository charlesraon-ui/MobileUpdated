import mongoose from 'mongoose';
import Bundle from './models/Bundle.js';

mongoose.connect('mongodb://localhost:27017/go-agri-db')
  .then(async () => {
    console.log('Connected to MongoDB');
    const bundles = await Bundle.find({}).populate('items.productId', 'name price');
    console.log('Found bundles:', bundles.length);
    bundles.forEach((bundle, index) => {
      console.log(`${index + 1}. ${bundle.name} - ₱${bundle.price} (${bundle.items?.length || 0} items)`);
      console.log(`   Description: ${bundle.description}`);
      console.log(`   Created: ${bundle.createdAt}`);
      console.log('');
    });
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Error:', err);
    mongoose.disconnect();
  });