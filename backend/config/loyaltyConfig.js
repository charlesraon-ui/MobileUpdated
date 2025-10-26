//﻿// backend/config/loyaltyConfig.js
export const rewards = [
  { 
    name: "discount-100", 
    cost: 50, 
    description: "₱100 discount voucher",
    type: "discount",
    value: 100,
    icon: "💰"
  },
  { 
    name: "discount-200", 
    cost: 100, 
    description: "₱200 discount voucher",
    type: "discount", 
    value: 200,
    icon: "💎"
  },
  { 
    name: "discount-300", 
    cost: 200, 
    description: "₱300 discount voucher",
    type: "discount",
    value: 300,
    icon: "🎁"
  },
  { 
    name: "discount-500", 
    cost: 300, 
    description: "₱500 discount voucher",
    type: "discount",
    value: 500,
    icon: "🎉"
  },
  { 
    name: "free-shipping", 
    cost: 75, 
    description: "Free shipping on next order",
    type: "shipping",
    value: 0,
    icon: "🚚"
  },
  { 
    name: "bonus-points", 
    cost: 25, 
    description: "Double points on next purchase",
    type: "bonus",
    value: 2,
    icon: "⭐"
  }
];
