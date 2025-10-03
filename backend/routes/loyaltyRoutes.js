// routes/loyaltyRoutes.js
import express from "express";
import { getLoyaltyStatus, issueLoyaltyCard, getDigitalCard } from "../controllers/loyaltyController.js";
import { authMiddleware as requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Get loyalty status
router.get("/status", getLoyaltyStatus);

// Issue loyalty card
router.post("/issue-card", issueLoyaltyCard);

// Get digital loyalty card
router.get("/digital-card", getDigitalCard);

export default router;