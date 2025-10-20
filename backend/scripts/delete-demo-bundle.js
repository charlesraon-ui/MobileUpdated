import mongoose from 'mongoose';
import Bundle from './models/Bundle.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connect to MongoDB Atlas
const mongoUri = process.env.MONGO_URI || 'mongodb+srv://levymarcelo555:xtsr8gqeaq1brvBZ@cluster0.lyyf48t.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoUri);

async function deleteDemoBundle() {
  try {
    console.log('🧹 Looking for demo bundle to delete...');
    
    const demoBundle = await Bundle.findOne({ name: /Demo Bundle/i });
    
    if (!demoBundle) {
      console.log('📦 No demo bundle found to delete');
      mongoose.disconnect();
      return;
    }
    
    console.log(`Found demo bundle: ${demoBundle.name} (ID: ${demoBundle._id})`);
    
    await Bundle.findByIdAndDelete(demoBundle._id);
    
    console.log('✅ Demo bundle deleted successfully');
    console.log('📱 The bundle will no longer appear in the mobile app');
    
    mongoose.disconnect();
  } catch (err) {
    console.error('❌ Error deleting demo bundle:', err);
    mongoose.disconnect();
  }
}

deleteDemoBundle();