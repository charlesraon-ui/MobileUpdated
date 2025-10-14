import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { getMyMessages, sendMessage } from "../controllers/messageController.js";

const router = express.Router();

router.get("/", authMiddleware, getMyMessages);
router.post("/", authMiddleware, sendMessage);

export default router;