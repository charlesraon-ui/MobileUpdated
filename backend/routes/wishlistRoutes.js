// routes/wishlistRoutes.js
import { Router } from "express";
import { getWishlist, addToWishlist, removeFromWishlist, toggleWishlist } from "../controllers/wishlistController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

// All wishlist routes require authentication
router.use(authMiddleware);

// GET /api/wishlist - Get user's wishlist
router.get("/", getWishlist);

// POST /api/wishlist/add - Add item to wishlist
router.post("/add", addToWishlist);

// DELETE /api/wishlist/remove - Remove item from wishlist
router.delete("/remove", removeFromWishlist);

// POST /api/wishlist/toggle - Toggle item in wishlist
router.post("/toggle", toggleWishlist);

export default router;