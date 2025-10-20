import axios from 'axios';

async function analyzeBundles() {
  try {
    const response = await axios.get('http://localhost:5000/api/bundles');
    console.log('=== BUNDLE DATA ANALYSIS ===');
    
    response.data.forEach((bundle, index) => {
      console.log(`\nBundle ${index + 1}: ${bundle.name}`);
      console.log(`- Bundle Price: ${bundle.bundlePrice}`);
      console.log(`- Original Price: ${bundle.originalPrice}`);
      console.log(`- Discount: ${bundle.discount}%`);
      console.log(`- Stock: ${bundle.stock}`);
      console.log(`- Items array length: ${bundle.items?.length || 0}`);
      console.log(`- Products array length: ${bundle.products?.length || 0}`);
      
      if (bundle.items && bundle.items.length > 0) {
        console.log('  Items (populated):');
        bundle.items.forEach((item, i) => {
          console.log(`    ${i+1}. ${item.productId?.name || 'Unknown'} - Qty: ${item.quantity} - Price: ${item.productId?.price || 'N/A'}`);
        });
      }
      
      if (bundle.products && bundle.products.length > 0) {
        console.log('  Products (IDs only):');
        bundle.products.forEach((prod, i) => {
          console.log(`    ${i+1}. Product ID: ${prod.product} - Qty: ${prod.quantity}`);
        });
      }
    });
  } catch (err) {
    console.error('Error:', err.message);
  }
}

analyzeBundles();