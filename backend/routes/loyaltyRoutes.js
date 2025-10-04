import express from "express";
import { getLoyaltyInfo, redeemReward } from "../controllers/loyaltyController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getLoyaltyInfo);   // Get points & tier
router.post("/redeem", authMiddleware, redeemReward); // Redeem rewards

export default router;
