/**
 * Frontend Profile Update Test
 * Tests the profile update functionality through the API client
 */

import { updateProfileApi } from './src/api/apiClient.js';

async function testProfileUpdate() {
  console.log('🧪 Testing Frontend Profile Update Functionality...\n');

  try {
    // Test 1: Valid profile update
    console.log('📝 Test 1: Valid profile update');
    const updateData = {
      name: 'John Doe Updated',
      email: 'john.updated@example.com'
    };

    const response = await updateProfileApi(updateData);
    
    if (response.data.success) {
      console.log('✅ Profile update successful!');
      console.log('📋 Updated user data:', {
        id: response.data.user._id,
        name: response.data.user.name,
        email: response.data.user.email
      });
    } else {
      console.log('❌ Profile update failed:', response.data.message);
    }

  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
    
    if (error.response) {
      console.log('📋 Error details:', {
        status: error.response.status,
        message: error.response.data?.message || 'Unknown error'
      });
    }
  }

  console.log('\n🏁 Frontend profile update test completed!');
}

// Run the test
testProfileUpdate().catch(console.error);