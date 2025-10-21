import mongoose from 'mongoose';
import Bundle from './models/Bundle.js';
import Product from './models/Products.js';
import dotenv from 'dotenv';

dotenv.config();

async function getBundleDetails() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log('🔍 Getting full bundle details...');
    
    // Find the bundle by ID from the screenshot
    const bundleId = '68f6f7b1d2af5854c01bb76d';
    
    const bundle = await Bundle.findById(bundleId)
      .populate('items.productId', 'name price imageUrl description category stock')
      .lean();
    
    if (!bundle) {
      console.log('❌ Bundle not found');
      return;
    }
    
    console.log('📦 BUNDLE DETAILS');
    console.log('='.repeat(50));
    console.log(`ID: ${bundle._id}`);
    console.log(`Name: ${bundle.name || 'N/A'}`);
    console.log(`Description: ${bundle.description || 'N/A'}`);
    console.log(`Bundle Price: ₱${bundle.bundlePrice || 'undefined'}`);
    console.log(`Original Price: ₱${bundle.originalPrice || 'undefined'}`);
    console.log(`Discount: ${bundle.discount || 'undefined'}%`);
    console.log(`Stock: ${bundle.stock || 'undefined'}`);
    console.log(`Active: ${bundle.active || 'undefined'}`);
    console.log(`Created At: ${bundle.createdAt}`);
    console.log(`Updated At: ${bundle.updatedAt}`);
    console.log(`Version: ${bundle.__v}`);
    
    // Check if bundle has products array (legacy format)
    const hasProducts = bundle.products && Array.isArray(bundle.products) && bundle.products.length > 0;
    const hasItems = bundle.items && Array.isArray(bundle.items) && bundle.items.length > 0;
    
    console.log('\n🛍️ BUNDLE ITEMS');
    console.log('='.repeat(50));
    console.log(`Items Array Length: ${bundle.items?.length || 0}`);
    console.log(`Products Array Length: ${bundle.products?.length || 0}`);
    
    if (hasProducts) {
      console.log('\n📦 PRODUCTS (Legacy Format):');
      bundle.products.forEach((item, index) => {
        console.log(`\n${index + 1}. PRODUCT ENTRY:`);
        console.log(`   Product ID: ${item.product || item.productId || 'N/A'}`);
        console.log(`   Quantity: ${item.quantity || 1}`);
        console.log(`   Raw Object:`, JSON.stringify(item, null, 2));
      });
    }
    
    if (hasItems) {
      console.log('\n📦 ITEMS (Current Format):');
      bundle.items.forEach((item, index) => {
        const product = item.productId;
        console.log(`\n${index + 1}. PRODUCT DETAILS:`);
        if (product && typeof product === 'object') {
          console.log(`   Product ID: ${product._id}`);
          console.log(`   Name: ${product.name}`);
          console.log(`   Price: ₱${product.price}`);
          console.log(`   Description: ${product.description || 'N/A'}`);
          console.log(`   Category: ${product.category || 'N/A'}`);
          console.log(`   Stock: ${product.stock || 'N/A'}`);
          console.log(`   Image URL: ${product.imageUrl || 'N/A'}`);
        } else {
          console.log(`   Product ID: ${item.productId || 'N/A'}`);
          console.log(`   [Product not populated]`);
        }
        console.log(`   Quantity in Bundle: ${item.quantity}`);
      });
    }
    
    console.log('\n💰 PRICING BREAKDOWN');
    console.log('='.repeat(50));
    
    // Get all available products to suggest for recreation
    console.log('\n🔍 GETTING AVAILABLE PRODUCTS FOR RECREATION...');
    const availableProducts = await Product.find({}).limit(10).lean();
    console.log(`Found ${availableProducts.length} available products:`);
    
    availableProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} - ₱${product.price} (ID: ${product._id})`);
    });
    
    console.log('\n📋 RECREATION DATA (JSON FORMAT)');
    console.log('='.repeat(50));
    
    // Create recreation data with suggested products
    const recreationData = {
      name: bundle.name || 'testings',
      description: bundle.description || 'Discount price',
      items: availableProducts.slice(0, 3).map(product => ({
        productId: product._id,
        productName: product.name,
        productPrice: product.price,
        quantity: 1
      })),
      bundlePrice: 2000, // From the screenshot
      originalPrice: Math.round(availableProducts.slice(0, 3).reduce((sum, p) => sum + p.price, 0)),
      discount: 15,
      stock: 10,
      active: true
    };
    
    console.log(JSON.stringify(recreationData, null, 2));
    
    console.log('\n🔧 RECREATION SCRIPT');
    console.log('='.repeat(50));
    console.log('// Use this data to recreate the bundle:');
    console.log(`const bundleData = {`);
    console.log(`  name: "${recreationData.name}",`);
    console.log(`  description: "${recreationData.description}",`);
    console.log(`  items: [`);
    recreationData.items.forEach((item, index) => {
      console.log(`    { productId: "${item.productId}", quantity: ${item.quantity} }${index < recreationData.items.length - 1 ? ',' : ''}`);
    });
    console.log(`  ],`);
    console.log(`  bundlePrice: ${recreationData.bundlePrice},`);
    console.log(`  originalPrice: ${recreationData.originalPrice},`);
    console.log(`  discount: ${recreationData.discount},`);
    console.log(`  stock: ${recreationData.stock},`);
    console.log(`  active: ${recreationData.active}`);
    console.log(`};`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

getBundleDetails();