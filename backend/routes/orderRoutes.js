import { Router } from "express";
import {
  createEPaymentOrder,
  createMyOrder,
  createOrder,
  getMyOrders,
  getOrders,
  updateOrderStatus,
  cancelMyOrder,
} from "../controllers/orderController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

// public/admin
router.post("/", createOrder);
router.get("/:userId", getOrders);

// Admin: Update order status
router.put("/admin/:orderId/status", authMiddleware, updateOrderStatus);

// 🆕 E-Payment endpoint
router.post("/epayment", authMiddleware, createEPaymentOrder);

// protected (current user only)
router.post("/me", authMiddleware, createMyOrder);
router.get("/me/list", authMiddleware, getMyOrders);
router.post("/me/:orderId/cancel", authMiddleware, cancelMyOrder);

// deliveries
// Note: deliveries are served via /api/delivery routes

export default router;