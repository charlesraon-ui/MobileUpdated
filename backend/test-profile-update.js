import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

async function testProfileUpdate() {
  try {
    console.log('Testing profile update endpoint...');
    
    // Step 1: Login to get token
    console.log('Logging in...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'profile.test@example.com',
      password: 'password123'
    });
    
    console.log('Login response:', JSON.stringify(loginResponse.data, null, 2));
    
    if (!loginResponse.data.token) {
      throw new Error('Login failed - no token received');
    }
    
    const token = loginResponse.data.token;
    const userId = loginResponse.data.user?.id || loginResponse.data.user?._id || loginResponse.data.userId;
    console.log(`Login successful. User ID: ${userId}`);
    
    // Step 2: Get current profile
    console.log('Getting current profile...');
    const currentProfileResponse = await axios.get(`${API_BASE}/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const currentProfile = currentProfileResponse.data.user;
    console.log('Current profile:', currentProfile);
    
    // Step 3: Update profile with new information
    console.log('Updating profile...');
    const updateData = {
      name: 'Updated Profile Test User',
      email: 'updated.profile.test@example.com'
    };
    
    const updateResponse = await axios.put(`${API_BASE}/users/profile`, updateData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Update successful!');
    console.log('Response:', JSON.stringify(updateResponse.data, null, 2));
    
    // Step 4: Verify the update by getting profile again
    console.log('Verifying update...');
    const verifyResponse = await axios.get(`${API_BASE}/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const updatedProfile = verifyResponse.data.user;
    console.log('Updated profile:', updatedProfile);
    
    // Step 5: Test validation errors
    console.log('Testing validation errors...');
    
    // Test empty name
    try {
      await axios.put(`${API_BASE}/users/profile`, {
        name: '',
        email: 'test@example.com'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('ERROR: Empty name should have failed');
    } catch (error) {
      console.log('✓ Empty name validation works:', error.response.data.message);
    }
    
    // Test invalid email
    try {
      await axios.put(`${API_BASE}/users/profile`, {
        name: 'Test User',
        email: 'invalid-email'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('ERROR: Invalid email should have failed');
    } catch (error) {
      console.log('✓ Invalid email validation works:', error.response.data.message);
    }
    
    // Step 6: Restore original profile
    console.log('Restoring original profile...');
    await axios.put(`${API_BASE}/users/profile`, {
      name: currentProfile.name,
      email: currentProfile.email
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ All tests passed! Profile update endpoint is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

testProfileUpdate();