import { Router } from "express";
import {
  addReview,
  createProduct,
  deleteProduct,
  getMyReviews,
  getProduct,
  getWishlist,
  listProducts,
  // NEW:
  searchProducts,
  updateProduct,
} from "../controllers/productController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

/**
 * IMPORTANT: Order matters in Express!
 * Place static subpaths BEFORE any "/:id" matcher.
 */

// NEW: search + wishlist
router.get("/search", searchProducts);
// Protected or public — your choice. For now keep public so it won't 500 for guests:
router.get("/wishlist", getWishlist);

// Reviews by current user (must be before "/:id")
router.get("/my/reviews", authMiddleware, getMyReviews);

// Basic CRUD
router.get("/", listProducts);
router.get("/:id", getProduct);
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

// Reviews
router.post("/:id/reviews", authMiddleware, addReview);

export default router;
