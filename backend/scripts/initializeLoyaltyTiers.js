// scripts/initializeLoyaltyTiers.js
// Script to initialize loyalty tiers in the database

import mongoose from 'mongoose';
import LoyaltyTier from '../models/LoyaltyTier.js';
import { loyaltyConfig } from '../services/loyaltyService.js';

const initializeLoyaltyTiers = async () => {
  try {
    console.log('🔄 Initializing loyalty tiers...');
    
    // Check if tiers already exist
    const existingTiers = await LoyaltyTier.find();
    if (existingTiers.length > 0) {
      console.log('✅ Loyalty tiers already exist. Updating if necessary...');
    }

    // Define the default tiers based on loyalty service config
    const defaultTiers = [
      {
        name: 'Sprout',
        pointThreshold: 0,
        discountPercentage: 0,
        benefits: [
          'Earn 1 point per $1 spent',
          'Access to basic rewards'
        ],
        isActive: true,
        displayOrder: 1
      },
      {
        name: 'Seedling',
        pointThreshold: 100,
        discountPercentage: 5,
        benefits: [
          'Earn 1 point per $1 spent',
          '5% discount on all purchases',
          'Priority customer support',
          'Early access to sales'
        ],
        isActive: true,
        displayOrder: 2
      },
      {
        name: 'Cultivator',
        pointThreshold: 300,
        discountPercentage: 10,
        benefits: [
          'Earn 1 point per $1 spent',
          '10% discount on all purchases',
          'Priority customer support',
          'Early access to sales',
          'Free shipping on orders over $50'
        ],
        isActive: true,
        displayOrder: 3
      },
      {
        name: 'Bloom',
        pointThreshold: 600,
        discountPercentage: 15,
        benefits: [
          'Earn 1 point per $1 spent',
          '15% discount on all purchases',
          'Priority customer support',
          'Early access to sales',
          'Free shipping on all orders',
          'Exclusive product access'
        ],
        isActive: true,
        displayOrder: 4
      },
      {
        name: 'Harvester',
        pointThreshold: 1000,
        discountPercentage: 20,
        benefits: [
          'Earn 1 point per $1 spent',
          '20% discount on all purchases',
          'Dedicated account manager',
          'Early access to sales',
          'Free shipping on all orders',
          'Exclusive product access',
          'VIP customer events'
        ],
        isActive: true,
        displayOrder: 5
      }
    ];

    // Create or update each tier
    for (const tierData of defaultTiers) {
      const existingTier = await LoyaltyTier.findOne({ name: tierData.name });
      
      if (existingTier) {
        // Update existing tier
        await LoyaltyTier.findByIdAndUpdate(existingTier._id, tierData);
        console.log(`✅ Updated tier: ${tierData.name}`);
      } else {
        // Create new tier
        const newTier = new LoyaltyTier(tierData);
        await newTier.save();
        console.log(`✅ Created tier: ${tierData.name}`);
      }
    }

    console.log('🎉 Loyalty tiers initialization completed successfully!');
    
    // Display all tiers
    const allTiers = await LoyaltyTier.find().sort({ displayOrder: 1 });
    console.log('\n📊 Current loyalty tiers:');
    allTiers.forEach(tier => {
      console.log(`  ${tier.name}: ${tier.pointThreshold}+ points, ${tier.discountPercentage}% discount`);
    });

    return { success: true, message: 'Loyalty tiers initialized successfully' };
  } catch (error) {
    console.error('❌ Error initializing loyalty tiers:', error);
    return { success: false, error: error.message };
  }
};

// Function to reset all tiers (use with caution)
const resetLoyaltyTiers = async () => {
  try {
    console.log('🔄 Resetting all loyalty tiers...');
    await LoyaltyTier.deleteMany({});
    console.log('✅ All loyalty tiers deleted');
    
    const result = await initializeLoyaltyTiers();
    return result;
  } catch (error) {
    console.error('❌ Error resetting loyalty tiers:', error);
    return { success: false, error: error.message };
  }
};

// Function to check tier consistency
const checkTierConsistency = async () => {
  try {
    console.log('🔍 Checking tier consistency...');
    
    const tiers = await LoyaltyTier.find({ isActive: true }).sort({ pointThreshold: 1 });
    const serviceConfig = loyaltyConfig.tiers;
    
    let inconsistencies = [];
    
    for (const tier of tiers) {
      const configTier = serviceConfig[tier.name];
      if (!configTier) {
        inconsistencies.push(`Tier ${tier.name} exists in database but not in service config`);
        continue;
      }
      
      if (tier.pointThreshold !== configTier.min) {
        inconsistencies.push(`Tier ${tier.name}: threshold mismatch (DB: ${tier.pointThreshold}, Config: ${configTier.min})`);
      }
      
      if (tier.discountPercentage !== configTier.discount) {
        inconsistencies.push(`Tier ${tier.name}: discount mismatch (DB: ${tier.discountPercentage}%, Config: ${configTier.discount}%)`);
      }
    }
    
    if (inconsistencies.length === 0) {
      console.log('✅ All tiers are consistent with service configuration');
      return { success: true, message: 'Tiers are consistent' };
    } else {
      console.log('⚠️  Found inconsistencies:');
      inconsistencies.forEach(issue => console.log(`  - ${issue}`));
      return { success: false, inconsistencies };
    }
  } catch (error) {
    console.error('❌ Error checking tier consistency:', error);
    return { success: false, error: error.message };
  }
};

export { initializeLoyaltyTiers, resetLoyaltyTiers, checkTierConsistency };

// If running this script directly
if (import.meta.url === `file://${process.argv[1]}`) {
  // Connect to MongoDB
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database';
  
  mongoose.connect(mongoUri)
    .then(async () => {
      console.log('📦 Connected to MongoDB');
      
      const action = process.argv[2] || 'init';
      
      switch (action) {
        case 'init':
          await initializeLoyaltyTiers();
          break;
        case 'reset':
          await resetLoyaltyTiers();
          break;
        case 'check':
          await checkTierConsistency();
          break;
        default:
          console.log('Usage: node initializeLoyaltyTiers.js [init|reset|check]');
      }
      
      await mongoose.disconnect();
      console.log('📦 Disconnected from MongoDB');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ MongoDB connection error:', error);
      process.exit(1);
    });
}