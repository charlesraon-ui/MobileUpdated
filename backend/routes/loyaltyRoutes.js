import express from "express";
import { 
  getLoyaltyInfo, 
  redeemReward, 
  getLoyaltyStatus, 
  issueLoyaltyCard, 
  getDigitalCard,
  getAvailableRewards,
  getUsableRewards,
  getRedemptionHistory,
  addTestPoints,
  getLoyaltyStats,
  addLoyaltyPoints,
  getSelectableRewards
} from "../controllers/loyaltyController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Legacy endpoints
router.get("/", authMiddleware, getLoyaltyInfo);   // Get points & tier

// Modern endpoints used by the mobile app
router.get("/status", authMiddleware, getLoyaltyStatus);
router.post("/issue-card", authMiddleware, issueLoyaltyCard);
router.get("/digital-card", authMiddleware, getDigitalCard);

// Reward redemption endpoints
router.get("/rewards", authMiddleware, getAvailableRewards);
router.get("/usable-rewards", authMiddleware, getUsableRewards);
router.get("/selectable-rewards", authMiddleware, getSelectableRewards);
router.post("/redeem", authMiddleware, redeemReward);
router.get("/redemptions", authMiddleware, getRedemptionHistory);

// Admin endpoints
router.get("/stats", authMiddleware, getLoyaltyStats);
router.post("/add-points", authMiddleware, addLoyaltyPoints);

// Test endpoint (no auth required for testing)
router.post("/add-test-points", addTestPoints);

// Simple test route to verify loyalty routes are working
router.get("/test", (req, res) => {
  res.json({ message: "Loyalty routes are working!", timestamp: new Date().toISOString() });
});

export default router;
