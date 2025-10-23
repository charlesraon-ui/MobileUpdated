import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

// Test token creation and verification
async function testAuth() {
  try {
    // Create a test token for an existing user
    const testUser = {
      id: "675e8b1b8b8b8b8b8b8b8b8b", // Sample user ID
      email: "admin@gmail.com",
      role: "admin"
    };

    const token = jwt.sign(testUser, process.env.JWT_SECRET, { expiresIn: '24h' });
    console.log("Generated test token:", token);

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded);

    // Test with curl command
    console.log("\nTest with this curl command:");
    console.log(`curl -X GET "http://localhost:5000/api/users/search" -H "Authorization: Bearer ${token}"`);

  } catch (error) {
    console.error("Auth test failed:", error);
  }
}

testAuth();