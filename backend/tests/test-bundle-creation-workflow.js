// test-bundle-creation-workflow.js
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
const ADMIN_CREDENTIALS = {
  email: 'admin@gmail.com',
  password: 'admin'
};

async function testBundleCreationWorkflow() {
  try {
    console.log('🔍 Testing Bundle Creation Workflow...\n');

    // Step 1: Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ADMIN_CREDENTIALS)
    });

    if (!loginResponse.ok) {
      console.error('❌ Admin login failed');
      return;
    }

    const loginData = await loginResponse.json();
    const adminToken = loginData.token;
    console.log('✅ Admin login successful');

    // Step 2: Get current bundle count
    console.log('\n2. Getting current bundle count...');
    const initialBundlesResponse = await fetch(`${BASE_URL}/api/admin/bundles`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    const initialBundles = await initialBundlesResponse.json();
    const initialCount = Array.isArray(initialBundles) ? initialBundles.length : 0;
    console.log(`📦 Current bundles: ${initialCount}`);

    // Step 3: Get available products for bundle creation
    console.log('\n3. Getting available products...');
    const productsResponse = await fetch(`${BASE_URL}/api/products`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    const products = await productsResponse.json();
    console.log(`📦 Available products: ${products.length}`);

    if (products.length < 2) {
      console.error('❌ Need at least 2 products to create a bundle');
      return;
    }

    // Step 4: Create a test bundle
    console.log('\n4. Creating a test bundle...');
    const testBundle = {
      name: `Test Bundle ${Date.now()}`,
      description: 'Test bundle created by workflow test',
      bundlePrice: 1500,
      originalPrice: 2000,
      stock: 10,
      items: [
        {
          productId: products[0]._id,
          quantity: 1
        },
        {
          productId: products[1]._id,
          quantity: 2
        }
      ]
    };

    console.log('Bundle data:', JSON.stringify(testBundle, null, 2));

    const createResponse = await fetch(`${BASE_URL}/api/admin/bundles`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testBundle)
    });

    console.log(`Create response status: ${createResponse.status}`);
    
    if (createResponse.ok) {
      const createdBundle = await createResponse.json();
      console.log('✅ Bundle created successfully');
      console.log(`Bundle ID: ${createdBundle._id}`);
      console.log(`Bundle Name: ${createdBundle.name}`);

      // Step 5: Verify bundle exists immediately after creation
      console.log('\n5. Verifying bundle exists immediately...');
      const verifyResponse = await fetch(`${BASE_URL}/api/admin/bundles/${createdBundle._id}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (verifyResponse.ok) {
        const verifiedBundle = await verifyResponse.json();
        console.log('✅ Bundle verified immediately after creation');
        console.log(`Verified bundle: ${verifiedBundle.name}`);
      } else {
        console.error('❌ Bundle not found immediately after creation');
      }

      // Step 6: Wait and check if bundle still exists
      console.log('\n6. Waiting 3 seconds and checking again...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      const delayedVerifyResponse = await fetch(`${BASE_URL}/api/admin/bundles/${createdBundle._id}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (delayedVerifyResponse.ok) {
        console.log('✅ Bundle still exists after delay');
      } else {
        console.error('❌ Bundle disappeared after delay');
      }

      // Step 7: Check updated bundle count
      console.log('\n7. Checking updated bundle count...');
      const finalBundlesResponse = await fetch(`${BASE_URL}/api/admin/bundles`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      const finalBundles = await finalBundlesResponse.json();
      const finalCount = Array.isArray(finalBundles) ? finalBundles.length : 0;
      console.log(`📦 Final bundles: ${finalCount}`);
      console.log(`📈 Change: ${finalCount - initialCount} bundles`);

      // Step 8: Check if bundle appears in regular bundles endpoint
      console.log('\n8. Checking regular bundles endpoint...');
      const regularBundlesResponse = await fetch(`${BASE_URL}/api/bundles`);
      const regularBundles = await regularBundlesResponse.json();
      
      const bundleInRegular = regularBundles.find(b => b._id === createdBundle._id);
      if (bundleInRegular) {
        console.log('✅ Bundle appears in regular bundles endpoint');
      } else {
        console.error('❌ Bundle missing from regular bundles endpoint');
      }

    } else {
      const errorText = await createResponse.text();
      console.error('❌ Bundle creation failed:', errorText);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testBundleCreationWorkflow();