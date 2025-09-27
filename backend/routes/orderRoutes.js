import { Router } from "express";
import {
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

// protected (current user only)
router.post("/me", authMiddleware, createMyOrder);
router.get("/me/list", authMiddleware, getMyOrders);

// deliveries (protect with auth as well)
router.get("/", authMiddleware, listDelivery);

export default router;
