import express from "express";
import { getLoyaltyInfo, redeemReward, getLoyaltyStatus, issueLoyaltyCard, getDigitalCard } from "../controllers/loyaltyController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getLoyaltyInfo);   // Get points & tier
router.post("/redeem", authMiddleware, redeemReward); // Redeem rewards

// Modern endpoints used by the mobile app
router.get("/status", authMiddleware, getLoyaltyStatus);
router.post("/issue-card", authMiddleware, issueLoyaltyCard);
router.get("/digital-card", authMiddleware, getDigitalCard);

export default router;
