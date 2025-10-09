import Product from "../models/Products.js";
import User from "../models/User.js"; // optional for wishlist; safe even if you don't use it

// List all products
export const listProducts = async (req, res, next) => {
  try {
    // ✅ Only return products where catalog is true
    const products = await Product.find({ catalog: true });
    res.json(products);
  } catch (e) {
    next(e);
  }
};

// Get single product with reviews
export const getProduct = async (req, res, next) => {
  try {
    const p = await Product.findById(req.params.id).populate(
      "reviews.userId",
      "name email"
    );
    if (!p) return res.status(404).json({ error: "Not found" });
    res.json(p);
  } catch (e) {
    next(e);
  }
};

// Create new product
export const createProduct = async (req, res, next) => {
  try {
    const created = await Product.create(req.body);
    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
};

// Update product
export const updateProduct = async (req, res, next) => {
  try {
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (e) {
    next(e);
  }
};

// Delete product
export const deleteProduct = async (req, res, next) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};
// ✅ NEW: Toggle catalog visibility
export const toggleCatalog = async (req, res, next) => {
  try {
    const { value } = req.body; // boolean
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { catalog: Boolean(value) },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Product not found" });
    res.json(updated);
  } catch (e) {
    next(e);
  }
};

// --- Reviews ---
export const addReview = async (req, res, next) => {
  try {
    const { rating, comment, imageUrls } = req.body;
    const userId = req.user?.userId; // assumes auth middleware sets req.user

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ message: "Rating 1-5 required" });

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    product.reviews.unshift({ userId, rating, comment, imageUrls });
    await product.save();

    const populated = await Product.findById(req.params.id).populate(
      "reviews.userId",
      "name email"
    );
    res.status(201).json(populated);
  } catch (e) {
    next(e);
  }
};

// Get all reviews by current user
export const getMyReviews = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const products = await Product.find({ "reviews.userId": userId })
      .select("name reviews")
      .populate("reviews.userId", "name email");

    const myReviews = [];
    products.forEach((p) => {
      p.reviews.forEach((r) => {
        if (String(r.userId?._id) === String(userId)) {
          myReviews.push({
            productId: p._id,
            productName: p.name,
            rating: r.rating,
            comment: r.comment,
            createdAt: r.createdAt,
          });
        }
      });
    });

    res.json(myReviews);
  } catch (e) {
    next(e);
  }
};

// --- NEW: Search products ---
// GET /api/products/search?q=term&limit=50
export const searchProducts = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const limit = Math.min(parseInt(req.query.limit || "50", 10), 100);

    // Only search when query is meaningful
    if (q.length < 2) {
      return res.json([]);
    }

    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(safe, "i");

    const items = await Product.find({
      $or: [{ name: regex }, { description: regex }, { categoryName: regex }],
    })
      .limit(limit)
      .lean();

    res.json(items);
  } catch (e) {
    console.error("searchProducts error:", e);
    res.status(500).json({ message: "Search failed", error: e?.message });
  }
};


// --- NEW: Wishlist (safe fallback) ---
// GET /api/products/wishlist?userId=...
export const getWishlist = async (req, res) => {
  try {
    // Use query OR req.user (if auth is present)
    const userId = req.query.userId || req.user?.userId || req.user?._id;
    if (!userId) return res.json([]); // guest → empty list

    // If your User schema has "wishlist" array of product IDs:
    const u = await User.findById(userId).lean();
    const ids = Array.isArray(u?.wishlist) ? u.wishlist : [];

    if (ids.length === 0) return res.json([]);

    const items = await Product.find({ _id: { $in: ids } }).lean();
    res.json(items);
  } catch (e) {
    console.error("getWishlist error:", e);
    res.status(500).json({ message: "Wishlist fetch failed", error: e?.message });
  }
};

