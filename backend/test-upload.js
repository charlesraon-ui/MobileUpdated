import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

async function testProfileImageUpload() {
  try {
    // Step 1: Login to get token
    console.log('Logging in...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'profile.test@example.com',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    const userId = loginResponse.data.user.id;
    console.log('Login successful. User ID:', userId);
    
    // Step 2: Create a simple test image file (SVG)
    const svgContent = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="40" stroke="green" stroke-width="4" fill="yellow" />
  <text x="50" y="55" text-anchor="middle" font-family="Arial" font-size="12">Test</text>
</svg>`;
    
    const testImagePath = './test-profile-image.svg';
    fs.writeFileSync(testImagePath, svgContent);
    console.log('Test image created:', testImagePath);
    
    // Step 3: Upload the image
    console.log('Uploading image...');
    const formData = new FormData();
    formData.append('image', fs.createReadStream(testImagePath));
    
    const uploadResponse = await axios.post(
      'http://localhost:5000/api/users/profile/upload',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          ...formData.getHeaders()
        }
      }
    );
    
    console.log('Upload successful!');
    console.log('Response:', JSON.stringify(uploadResponse.data, null, 2));
    
    // Clean up test file
    fs.unlinkSync(testImagePath);
    console.log('Test file cleaned up');
    
  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testProfileImageUpload();