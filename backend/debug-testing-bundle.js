import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Bundle from './models/Bundle.js';

async function debugTestingBundle() {
  try {
    // Connect to MongoDB Atlas
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas');

    console.log('\n🔍 Checking ALL bundles and their active field values:');
    const allBundles = await Bundle.find({});
    console.log(`Found ${allBundles.length} total bundles:`);
    
    allBundles.forEach((bundle, index) => {
      console.log(`${index + 1}. ${bundle.name}`);
      console.log(`   ID: ${bundle._id}`);
      console.log(`   Active: ${bundle.active} (type: ${typeof bundle.active})`);
      console.log(`   Items count: ${bundle.items.length}`);
      console.log(`   Created: ${bundle.createdAt}`);
      console.log('');
    });

    console.log('\n🔍 Testing different active queries:');
    
    console.log('\n1. Bundle.find({ active: true }):');
    const activeTrue = await Bundle.find({ active: true });
    console.log(`   Found: ${activeTrue.length} bundles`);
    activeTrue.forEach(b => console.log(`   - ${b.name}`));
    
    console.log('\n2. Bundle.find({ active: "true" }):');
    const activeStringTrue = await Bundle.find({ active: "true" });
    console.log(`   Found: ${activeStringTrue.length} bundles`);
    activeStringTrue.forEach(b => console.log(`   - ${b.name}`));
    
    console.log('\n3. Bundle.find({ active: { $ne: false } }):');
    const activeNotFalse = await Bundle.find({ active: { $ne: false } });
    console.log(`   Found: ${activeNotFalse.length} bundles`);
    activeNotFalse.forEach(b => console.log(`   - ${b.name}`));

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

debugTestingBundle();