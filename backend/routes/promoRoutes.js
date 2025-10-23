import express from "express";
import { 
  applyPromo, 
  listPromos, 
  createPromo, 
  togglePromoStatus, 
  deletePromo, 
  updatePromo 
} from "../controllers/promoController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Customer routes (public access)
router.post("/apply", applyPromo);

// Admin routes (require authentication)
router.get("/", authMiddleware, listPromos);
router.post("/", authMiddleware, createPromo);
router.patch("/:id/toggle", authMiddleware, togglePromoStatus);
router.put("/:id", authMiddleware, updatePromo);
router.delete("/:id", authMiddleware, deletePromo);

export default router;