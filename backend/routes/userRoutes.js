import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { searchUsers } from "../controllers/userController.js";

const router = express.Router();

router.get("/search", authMiddleware, searchUsers);

export default router;