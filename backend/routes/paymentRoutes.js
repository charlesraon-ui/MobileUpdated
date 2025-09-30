import { Router } from "express";
import {
    checkPaymentStatus,
    createGCashOrder,
    createSource,
    handlePaymentFailed,
    handlePaymentSuccess,
    handleWebhook,
} from "../controllers/paymentController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

// Protected routes (require authentication)
router.post("/source", authMiddleware, createSource);
router.post("/gcash/order", authMiddleware, createGCashOrder);
router.get("/status/:sourceId", authMiddleware, checkPaymentStatus);

// Public routes (for redirects)
router.get("/success", handlePaymentSuccess);
router.get("/failed", handlePaymentFailed);

router.post("/webhook", handleWebhook);

export default router;