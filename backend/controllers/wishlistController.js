// controllers/wishlistController.js
import User from "../models/User.js";
import Product from "../models/Products.js";

// GET /api/wishlist - Get user's wishlist
export const getWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId).populate({
      path: 'wishlist',
      select: '_id name price imageUrl images category categoryName description stock'
    });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Format the wishlist items
    const wishlistItems = user.wishlist.map(item => ({
      _id: item._id,
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl || (Array.isArray(item.images) ? item.images[0] : ""),
      category: item.category || item.categoryName,
      description: item.description,
      stock: item.stock
    }));

    res.json({ 
      wishlist: wishlistItems,
      count: wishlistItems.length 
    });
  } catch (error) {
    console.error("Get wishlist error:", error);
    res.status(500).json({ message: "Failed to get wishlist" });
  }
};

// POST /api/wishlist/add - Add item to wishlist
export const addToWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Add to user's wishlist if not already there
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.wishlist.includes(productId)) {
      user.wishlist.push(productId);
      await user.save();
    }

    res.json({ 
      message: "Product added to wishlist",
      wishlistCount: user.wishlist.length 
    });
  } catch (error) {
    console.error("Add to wishlist error:", error);
    res.status(500).json({ message: "Failed to add to wishlist" });
  }
};

// DELETE /api/wishlist/remove - Remove item from wishlist
export const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove from wishlist
    user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
    await user.save();

    res.json({ 
      message: "Product removed from wishlist",
      wishlistCount: user.wishlist.length 
    });
  } catch (error) {
    console.error("Remove from wishlist error:", error);
    res.status(500).json({ message: "Failed to remove from wishlist" });
  }
};

// POST /api/wishlist/toggle - Toggle item in wishlist
export const toggleWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isInWishlist = user.wishlist.includes(productId);
    
    if (isInWishlist) {
      // Remove from wishlist
      user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
    } else {
      // Add to wishlist
      user.wishlist.push(productId);
    }

    await user.save();

    res.json({ 
      message: isInWishlist ? "Product removed from wishlist" : "Product added to wishlist",
      isInWishlist: !isInWishlist,
      wishlistCount: user.wishlist.length 
    });
  } catch (error) {
    console.error("Toggle wishlist error:", error);
    res.status(500).json({ message: "Failed to toggle wishlist" });
  }
};