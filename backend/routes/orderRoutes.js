import { Router } from "express";
import {
  createEPaymentOrder,
  createMyOrder,
  createOrder,
  getMyOrders,
  getOrders,
  listDelivery,
} from "../controllers/orderController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

// public/admin
router.post("/", createOrder);
router.get("/:userId", getOrders);

// 🆕 E-Payment endpoint
router.post("/epayment", authMiddleware, createEPaymentOrder);

// protected (current user only)
router.post("/me", authMiddleware, createMyOrder);
router.get("/me/list", authMiddleware, getMyOrders);

// deliveries
router.get("/", authMiddleware, listDelivery);

export default router;