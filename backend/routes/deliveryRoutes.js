import express from "express";
import { getDeliveryForOrder, getDriverContact, listMyDeliveries } from "../controllers/deliveryController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/mine", authMiddleware, listMyDeliveries);
router.get("/by-order/:orderId", authMiddleware, getDeliveryForOrder);
router.get("/:id/driver", authMiddleware, getDriverContact);

export default router;