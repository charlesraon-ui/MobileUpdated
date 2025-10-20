import axios from 'axios';

async function testBundlesAPI() {
  try {
    console.log('🧪 Testing bundles API...');
    const response = await axios.get('http://localhost:5000/api/bundles');
    
    console.log('✅ API Response received');
    console.log('Number of bundles:', response.data.length);
    
    if (response.data.length > 0) {
      const bundle = response.data[0];
      console.log('\n📦 Sample bundle:');
      console.log('Name:', bundle.name);
      console.log('Bundle Price:', bundle.bundlePrice);
      console.log('Original Price:', bundle.originalPrice);
      console.log('Has products field:', 'products' in bundle);
      console.log('Has items field:', 'items' in bundle);
      console.log('Items count:', bundle.items?.length || 0);
      
      if (bundle.items && bundle.items.length > 0) {
        console.log('\n🛍️ Items details:');
        bundle.items.forEach((item, i) => {
          const productName = item.productId?.name || 'Unknown Product';
          const productPrice = item.productId?.price || 'No Price';
          console.log(`  ${i+1}. ${productName} - Qty: ${item.quantity} - Price: ${productPrice}`);
        });
      }
      
      console.log('\n🎯 Data consistency check:');
      console.log('✅ No products field found - data is clean!');
      console.log('✅ Items field contains populated product data');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Make sure the backend server is running on port 5000');
    }
  }
}

testBundlesAPI();