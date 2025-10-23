import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Bundle from './models/Bundle.js';

async function fixTestingBundle() {
  try {
    // Connect to MongoDB Atlas
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas');

    console.log('\n🔧 Finding and fixing the TESTING bundle...');
    
    // Find the TESTING bundle
    const testingBundle = await Bundle.findOne({ name: "TESTING" });
    
    if (testingBundle) {
      console.log(`📦 Found TESTING bundle: ${testingBundle._id}`);
      console.log(`   Current active value: ${testingBundle.active} (type: ${typeof testingBundle.active})`);
      
      // Update the active field to be a proper boolean
      const result = await Bundle.updateOne(
        { _id: testingBundle._id },
        { $set: { active: true } }
      );
      
      console.log(`✅ Update result: ${JSON.stringify(result)}`);
      
      // Verify the fix
      const updatedBundle = await Bundle.findById(testingBundle._id);
      console.log(`✅ Updated active value: ${updatedBundle.active} (type: ${typeof updatedBundle.active})`);
      
      // Test the query again
      console.log('\n🧪 Testing Bundle.find({ active: true }) after fix:');
      const activeBundles = await Bundle.find({ active: true });
      console.log(`   Found: ${activeBundles.length} bundles`);
      activeBundles.forEach(b => console.log(`   - ${b.name}`));
      
    } else {
      console.log('❌ TESTING bundle not found');
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
  }
}

fixTestingBundle();