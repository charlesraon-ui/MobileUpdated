import express from "express";
import { 
  getLoyaltyInfo, 
  redeemReward, 
  getLoyaltyStatus, 
  issueLoyaltyCard, 
  getDigitalCard,
  getAvailableRewards,
  getRedemptionHistory,
  addTestPoints
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
router.post("/redeem", authMiddleware, redeemReward);
router.get("/redemptions", authMiddleware, getRedemptionHistory);

// Test endpoint (no auth required for testing)
router.post("/add-test-points", addTestPoints);

export default router;
