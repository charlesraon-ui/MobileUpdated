import express from "express";
import { createEPayment } from "../controllers/orderController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/orders/epayment", authMiddleware, createEPayment);

export default router;