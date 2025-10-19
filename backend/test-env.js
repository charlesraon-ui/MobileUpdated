import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('Environment Variables Check:');
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? 'SET' : 'NOT SET');
console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? 'SET' : 'NOT SET');
console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'SET' : 'NOT SET');
console.log('CLOUDINARY_ROOT_FOLDER:', process.env.CLOUDINARY_ROOT_FOLDER);

// Test Cloudinary config
import cloudinary from './lib/cloudinary.js';
console.log('\nCloudinary Config:');
console.log('Cloud Name:', cloudinary.config().cloud_name);
console.log('API Key:', cloudinary.config().api_key ? 'SET' : 'NOT SET');
console.log('API Secret:', cloudinary.config().api_secret ? 'SET' : 'NOT SET');