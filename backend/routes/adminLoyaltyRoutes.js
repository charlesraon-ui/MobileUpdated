// routes/adminLoyaltyRoutes.js
import express from "express";
import { 
  getAllTiers, 
  createTier, 
  updateTier,
  getAllPointRules,
  createPointRule,
  updatePointRule,
  getAllCustomerLoyalty,
  getCustomerLoyalty,
  updateCustomerLoyalty,
  getLoyaltyHistory
} from "../controllers/adminLoyaltyController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

// All routes require authentication and admin privileges
router.use(requireAuth);
router.use(isAdmin);

// Tier Management
router.get("/tiers", getAllTiers);
router.post("/tiers", createTier);
router.put("/tiers/:tierId", updateTier);

// Point Rule Management
router.get("/point-rules", getAllPointRules);
router.post("/point-rules", createPointRule);
router.put("/point-rules/:ruleId", updatePointRule);

// Customer Loyalty Management
router.get("/customers", getAllCustomerLoyalty);
router.get("/customers/:userId", getCustomerLoyalty);
router.put("/customers/:userId", updateCustomerLoyalty);

// Loyalty History
router.get("/history/:userId", getLoyaltyHistory);

export default router;