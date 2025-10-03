import express from "express";
import { authMiddleware as requireAuth } from "../middleware/authMiddleware.js";
import { registerPushToken } from "../controllers/notificationController.js";

const router = express.Router();

router.use(requireAuth);
router.post("/register", registerPushToken);

export default router;