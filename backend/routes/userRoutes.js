import express from "express";
import multer from "multer";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { searchUsers, uploadProfileImage, getUserById } from "../controllers/userController.js";

const router = express.Router();
const uploadMemory = multer({ storage: multer.memoryStorage() });

router.get("/search", authMiddleware, searchUsers);
router.get("/:userId", authMiddleware, getUserById);
router.post("/profile/upload", authMiddleware, uploadMemory.single("image"), uploadProfileImage);

export default router;