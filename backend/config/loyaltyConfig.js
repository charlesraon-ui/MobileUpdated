//﻿// backend/config/loyaltyConfig.js
export const rewards = [
  { 
    name: "discount-5", 
    cost: 50, 
    description: "5% discount voucher",
    type: "discount",
    value: 5,
    icon: "💰"
  },
  { 
    name: "discount-10", 
    cost: 100, 
    description: "10% discount voucher",
    type: "discount", 
    value: 10,
    icon: "💎"
  },
  { 
    name: "discount-15", 
    cost: 200, 
    description: "15% discount voucher",
    type: "discount",
    value: 15,
    icon: "🎁"
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
