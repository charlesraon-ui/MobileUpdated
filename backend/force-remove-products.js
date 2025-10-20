import { MongoClient } from 'mongodb';

const mongoUri = 'mongodb+srv://levymarcelo555:xtsr8gqeaq1brvBZ@cluster0.lyyf48t.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function forceRemoveProductsField() {
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    console.log('🔧 Connected to MongoDB');
    
    const db = client.db();
    const collection = db.collection('bundles');
    
    // Remove the products field from all bundles
    const result = await collection.updateMany(
      {}, // Match all documents
      { $unset: { products: "" } } // Remove the products field
    );
    
    console.log(`✅ Removed products field from ${result.modifiedCount} bundles`);
    
    // Verify the removal
    const sample = await collection.findOne();
    console.log('\n📋 Verification:');
    console.log('Sample bundle fields:', Object.keys(sample));
    console.log('Has products field:', 'products' in sample);
    console.log('Has items field:', 'items' in sample);
    console.log('Items count:', sample.items?.length || 0);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n🎉 Database operation completed!');
  }
}

forceRemoveProductsField();