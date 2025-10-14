import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { listConversations, getThreadWithUser, sendDMToUser } from "../controllers/directMessageController.js";

const router = express.Router();

router.get("/conversations", authMiddleware, listConversations);
router.get("/:userId", authMiddleware, getThreadWithUser);
router.post("/:userId", authMiddleware, sendDMToUser);

export default router;