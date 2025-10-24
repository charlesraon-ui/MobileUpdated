import express from "express";
import { getDeliveryForOrder, getDriverContact, listMyDeliveries, trackDelivery, getDriverLocation } from "../controllers/deliveryController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/mine", authMiddleware, listMyDeliveries);
router.get("/by-order/:orderId", authMiddleware, getDeliveryForOrder);
router.get("/:id/driver", authMiddleware, getDriverContact);

// New tracking endpoints
router.get("/:id/track", authMiddleware, trackDelivery);
router.get("/:id/driver-location", authMiddleware, getDriverLocation);

export default router;