import express from "express";
import multer from "multer";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { searchUsers, uploadProfileImage, getUserById, updateProfile, getAdminUsers } from "../controllers/userController.js";

const router = express.Router();
const uploadMemory = multer({ storage: multer.memoryStorage() });

router.get("/search", authMiddleware, searchUsers);
router.get("/admins", authMiddleware, getAdminUsers);
router.get("/:userId", authMiddleware, getUserById);
router.put("/profile", authMiddleware, updateProfile);
router.post("/profile/upload", authMiddleware, uploadMemory.single("image"), uploadProfileImage);

export default router;