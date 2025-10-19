import express from "express";
import multer from "multer";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { listConversations, getThreadWithUser, sendDMToUser, uploadMessageImage } from "../controllers/directMessageController.js";

const router = express.Router();
const uploadMemory = multer({ storage: multer.memoryStorage() });

router.get("/conversations", authMiddleware, listConversations);
router.get("/:userId", authMiddleware, getThreadWithUser);
router.post("/upload", authMiddleware, uploadMemory.single("image"), uploadMessageImage);
router.post("/:userId", authMiddleware, sendDMToUser);

export default router;