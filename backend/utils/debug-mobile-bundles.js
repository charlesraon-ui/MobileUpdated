import axios from 'axios';

async function debugMobileBundles() {
  try {
    console.log('🔍 Debugging mobile app bundle data...\n');
    
    // Test the exact same API call that mobile app makes
    console.log('📱 Making API call to /api/bundles (same as mobile app)...');
    const response = await axios.get('http://localhost:5000/api/bundles');
    
    console.log('✅ API Response received');
    console.log('Status:', response.status);
    console.log('Number of bundles:', response.data.length);
    
    if (response.data.length > 0) {
      const bundle = response.data[0]; // Premium Rice Collection
      
      console.log('\n📦 Detailed analysis of first bundle:');
      console.log('='.repeat(50));
      console.log('Bundle ID:', bundle._id);
      console.log('Name:', bundle.name);
      console.log('Description:', bundle.description);
      console.log('Bundle Price:', bundle.bundlePrice);
      console.log('Original Price:', bundle.originalPrice);
      console.log('Discount:', bundle.discount);
      console.log('Stock:', bundle.stock);
      console.log('Active:', bundle.active);
      console.log('Created At:', bundle.createdAt);
      
      console.log('\n🛍️ Items Analysis:');
      console.log('Items array exists:', 'items' in bundle);
      console.log('Items array length:', bundle.items?.length || 0);
      
      if (bundle.items && bundle.items.length > 0) {
        console.log('\nItems details:');
        bundle.items.forEach((item, i) => {
          console.log(`  ${i+1}. Item:`, {
            quantity: item.quantity,
            productId: {
              _id: item.productId?._id,
              name: item.productId?.name,
              price: item.productId?.price,
              imageUrl: item.productId?.imageUrl
            }
          });
        });
      }
      
      console.log('\n🔍 Mobile App Calculation Check:');
      const bundlePrice = Number(bundle?.bundlePrice || bundle?.price || 0);
      const originalPrice = Number(bundle?.originalPrice || 0);
      const discount = Number(bundle?.discount || 0);
      const savings = originalPrice > bundlePrice ? originalPrice - bundlePrice : 0;
      
      console.log('Calculated bundlePrice:', bundlePrice);
      console.log('Calculated originalPrice:', originalPrice);
      console.log('Calculated discount:', discount);
      console.log('Calculated savings:', savings);
      
      console.log('\n🎯 Expected vs Actual:');
      console.log('Expected Price: ₱2899.00 (from admin)');
      console.log('Actual Price: ₱' + bundlePrice.toFixed(2));
      console.log('Expected Items: 4 (Buco Pandan, Water Lily, Jasmine Denorado, Sticky Jasmine Rice)');
      console.log('Actual Items:', bundle.items?.length || 0);
      
      if (bundlePrice !== 2899) {
        console.log('❌ PRICE MISMATCH DETECTED!');
        console.log('The mobile app is showing different price than admin website');
      }
      
      if ((bundle.items?.length || 0) !== 4) {
        console.log('❌ ITEMS COUNT MISMATCH DETECTED!');
        console.log('The mobile app is showing different number of items than admin website');
      }
    }
    
    console.log('\n📊 All bundles summary:');
    response.data.forEach((bundle, index) => {
      console.log(`${index + 1}. ${bundle.name} - ₱${bundle.bundlePrice} (${bundle.items?.length || 0} items)`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

debugMobileBundles();