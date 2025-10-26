// services/loyaltyService.js
// Loyalty service layer for calculating points and determining tiers
import { rewards } from '../config/loyaltyConfig.js';

// Loyalty configuration
export const loyaltyConfig = {
  // Points calculation rules
  pointsPerDollar: 1,           // 1 point per $1 spent
  bonusThreshold: 100,          // Bonus points threshold
  bonusMultiplier: 1.5,         // 1.5x points for orders over threshold
  
  // Tier thresholds (points required) - discount is percentage-based
  tiers: {
    "Sprout": { min: 0, max: 99, discount: 0 },
    "Seedling": { min: 100, max: 299, discount: 5 },
    "Cultivator": { min: 300, max: 599, discount: 10 },
    "Bloom": { min: 600, max: 999, discount: 15 },
    "Harvester": { min: 1000, max: Infinity, discount: 20 }
  },
  
  // Reward costs - using imported rewards from config
  rewards: rewards
};

/**
 * Calculate loyalty points based on order amount
 * @param {Object} order - Order object with amount and other details
 * @returns {number} - Points earned
 */
export const calculatePoints = (order) => {
  try {
    if (!order || typeof order.total !== 'number' || order.total <= 0) {
      return 0;
    }

    let points = Math.floor(order.total * loyaltyConfig.pointsPerDollar);
    
    // Apply bonus multiplier for large orders
    if (order.total >= loyaltyConfig.bonusThreshold) {
      points = Math.floor(points * loyaltyConfig.bonusMultiplier);
    }
    
    // Special category bonuses (if applicable)
    if (order.category === 'premium') {
      points = Math.floor(points * 1.2); // 20% bonus for premium products
    }
    
    return points;
  } catch (error) {
    console.error('Error calculating points:', error);
    return 0;
  }
};

/**
 * Determine user tier based on total points
 * @param {number} totalPoints - User's total loyalty points
 * @returns {string} - Tier name
 */
export const getTier = (totalPoints) => {
  try {
    if (typeof totalPoints !== 'number' || totalPoints < 0) {
      return 'Sprout';
    }

    for (const [tierName, tierData] of Object.entries(loyaltyConfig.tiers)) {
      if (totalPoints >= tierData.min && totalPoints <= tierData.max) {
        return tierName;
      }
    }
    
    return 'Sprout'; // Default tier
  } catch (error) {
    console.error('Error determining tier:', error);
    return 'Sprout';
  }
};

/**
 * Get tier benefits and discount percentage
 * @param {string} tierName - Name of the tier
 * @returns {Object} - Tier benefits object
 */
export const getTierBenefits = (tierName) => {
  try {
    const tier = loyaltyConfig.tiers[tierName];
    if (!tier) {
      return loyaltyConfig.tiers['Sprout'];
    }
    
    return {
      name: tierName,
      discount: tier.discount,
      pointsRequired: tier.min,
      nextTierPoints: getNextTierPoints(tierName),
      benefits: getTierBenefitsList(tierName)
    };
  } catch (error) {
    console.error('Error getting tier benefits:', error);
    return loyaltyConfig.tiers['Sprout'];
  }
};

/**
 * Get points required for next tier
 * @param {string} currentTier - Current tier name
 * @returns {number|null} - Points needed for next tier, null if already at highest
 */
export const getNextTierPoints = (currentTier) => {
  const tierNames = Object.keys(loyaltyConfig.tiers);
  const currentIndex = tierNames.indexOf(currentTier);
  
  if (currentIndex === -1 || currentIndex === tierNames.length - 1) {
    return null; // Invalid tier or already at highest tier
  }
  
  const nextTier = tierNames[currentIndex + 1];
  return loyaltyConfig.tiers[nextTier].min;
};

/**
 * Get list of benefits for a tier
 * @param {string} tierName - Name of the tier
 * @returns {Array} - Array of benefit descriptions
 */
export const getTierBenefitsList = (tierName) => {
  const benefits = {
    'Sprout': [
      'Earn 1 point per $1 spent',
      'Access to basic rewards'
    ],
    'Seedling': [
      'Earn 1 point per $1 spent',
      '₱100 discount on all purchases',
      'Priority customer support',
      'Early access to sales'
    ],
    'Cultivator': [
      'Earn 1 point per $1 spent',
      '₱200 discount on all purchases',
      'Priority customer support',
      'Early access to sales',
      'Free shipping on orders over $50'
    ],
    'Bloom': [
      'Earn 1 point per $1 spent',
      '₱300 discount on all purchases',
      'Priority customer support',
      'Early access to sales',
      'Free shipping on all orders',
      'Exclusive product access'
    ],
    'Harvester': [
      'Earn 1 point per $1 spent',
      '₱500 discount on all purchases',
      'Dedicated account manager',
      'Early access to sales',
      'Free shipping on all orders',
      'Exclusive product access',
      'VIP customer events'
    ]
  };
  
  return benefits[tierName] || benefits['Sprout'];
};

/**
 * Check if user can redeem a specific reward
 * @param {number} userPoints - User's current points
 * @param {string} rewardName - Name of the reward
 * @returns {Object} - Redemption eligibility info
 */
export const canRedeemReward = (userPoints, rewardName) => {
  try {
    const reward = loyaltyConfig.rewards.find(r => r.name === rewardName);
    
    if (!reward) {
      return { canRedeem: false, error: 'Reward not found' };
    }
    
    const canRedeem = userPoints >= reward.cost;
    const pointsNeeded = canRedeem ? 0 : reward.cost - userPoints;
    
    return {
      canRedeem,
      pointsNeeded,
      reward
    };
  } catch (error) {
    console.error('Error checking reward redemption:', error);
    return { canRedeem: false, error: 'System error' };
  }
};

/**
 * Get all available rewards with user's redemption status
 * @param {number} userPoints - User's current points
 * @returns {Array} - Array of rewards with redemption status
 */
export const getAvailableRewards = (userPoints) => {
  try {
    return loyaltyConfig.rewards.map(reward => ({
      ...reward,
      canRedeem: userPoints >= reward.cost,
      pointsNeeded: Math.max(0, reward.cost - userPoints)
    }));
  } catch (error) {
    console.error('Error getting available rewards:', error);
    return [];
  }
};

/**
 * Get discount percentage based on user tier
 * @param {string} userTier - User's current tier
 * @returns {number} - Discount percentage (0-100)
 */
export const getTierDiscountPercentage = (userTier) => {
  try {
    const tier = loyaltyConfig.tiers[userTier];
    if (!tier || !tier.discount) {
      return 0;
    }
    
    // Return discount percentage
    return tier.discount;
  } catch (error) {
    console.error('Error getting tier discount percentage:', error);
    return 0;
  }
};

/**
 * Calculate discount amount based on user tier and order amount
 * @param {number} orderAmount - Order total amount
 * @param {string} userTier - User's current tier
 * @returns {number} - Calculated discount amount
 */
export const calculateTierDiscount = (orderAmount, userTier) => {
  try {
    const discountPercentage = getTierDiscountPercentage(userTier);
    if (!discountPercentage || !orderAmount) {
      return 0;
    }
    
    // Calculate discount amount based on percentage
    return (orderAmount * discountPercentage) / 100;
  } catch (error) {
    console.error('Error calculating tier discount:', error);
    return 0;
  }
};

/**
 * Validate loyalty points transaction
 * @param {number} currentPoints - User's current points
 * @param {number} pointsToDeduct - Points to be deducted
 * @returns {Object} - Validation result
 */
export const validatePointsTransaction = (currentPoints, pointsToDeduct) => {
  try {
    if (typeof currentPoints !== 'number' || typeof pointsToDeduct !== 'number') {
      return { valid: false, error: 'Invalid point values' };
    }
    
    if (pointsToDeduct < 0) {
      return { valid: false, error: 'Cannot deduct negative points' };
    }
    
    if (currentPoints < pointsToDeduct) {
      return { 
        valid: false, 
        error: 'Insufficient points',
        shortfall: pointsToDeduct - currentPoints
      };
    }
    
    return { valid: true, remainingPoints: currentPoints - pointsToDeduct };
  } catch (error) {
    console.error('Error validating points transaction:', error);
    return { valid: false, error: 'System error' };
  }
};

export default {
  calculatePoints,
  getTier,
  getTierBenefits,
  getNextTierPoints,
  getTierBenefitsList,
  canRedeemReward,
  getAvailableRewards,
  getTierDiscountPercentage,
  calculateTierDiscount,
  validatePointsTransaction,
  loyaltyConfig
};