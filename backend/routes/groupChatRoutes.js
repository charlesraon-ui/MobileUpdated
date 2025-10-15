import express from "express";
import {
  createGroupChat,
  getUserGroupChats,
  getGroupChatMessages,
  sendGroupMessage,
  addParticipant,
  removeParticipant,
  leaveGroupChat
} from "../controllers/groupChatController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Create a new group chat
router.post("/", createGroupChat);

// Get user's group chats
router.get("/", getUserGroupChats);

// Get messages for a specific group chat
router.get("/:groupChatId/messages", getGroupChatMessages);

// Send a message to a group chat
router.post("/:groupChatId/messages", sendGroupMessage);

// Add participant to group chat
router.post("/:groupChatId/participants", addParticipant);

// Remove participant from group chat
router.delete("/:groupChatId/participants", removeParticipant);

// Leave group chat
router.post("/:groupChatId/leave", leaveGroupChat);

export default router;