import { Router } from "express";
import { handlePayMongoWebhook } from "../controllers/webhookController.js";

const router = Router();

// No auth middleware for webhooks!
router.post("/paymongo", handlePayMongoWebhook);

export default router;