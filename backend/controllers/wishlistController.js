// controllers/wishlistController.js
import User from "../models/User.js";
import Product from "../models/Products.js";

// GET /api/wishlist - Get user's wishlist
export const getWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId).populate({
      path: 'wishlist',
      select: '_id name price imageUrl images category categoryName description stock reviews'
    });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Format the wishlist items
    const wishlistItems = user.wishlist.map(item => {
      // Handle both imageUrl (legacy) and images (new) fields
      let images = [];
      if (item.images && item.images.length > 0) {
        images = item.images;
      } else if (item.imageUrl) {
        images = [item.imageUrl];
      }
      
      return {
        _id: item._id,
        name: item.name,
        price: item.price,
        imageUrl: item.imageUrl || (images.length > 0 ? images[0] : null),
        images: images,
        category: item.category || item.categoryName,
        description: item.description,
        stock: item.stock,
        reviews: item.reviews || []
      };
    });

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
    console.log("🔥 WISHLIST TOGGLE: Request received");
    console.log("🔥 WISHLIST TOGGLE: User ID:", req.user.id);
    console.log("🔥 WISHLIST TOGGLE: Request body:", req.body);
    
    const userId = req.user.id;
    const { productId } = req.body;

    if (!productId) {
      console.log("🔥 WISHLIST TOGGLE: No product ID provided");
      return res.status(400).json({ message: "Product ID is required" });
    }

    console.log("🔥 WISHLIST TOGGLE: Product ID:", productId);

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      console.log("🔥 WISHLIST TOGGLE: Product not found:", productId);
      return res.status(404).json({ message: "Product not found" });
    }

    console.log("🔥 WISHLIST TOGGLE: Product found:", product.name);

    const user = await User.findById(userId);
    if (!user) {
      console.log("🔥 WISHLIST TOGGLE: User not found:", userId);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("🔥 WISHLIST TOGGLE: User found:", user.email);
    console.log("🔥 WISHLIST TOGGLE: Current wishlist:", user.wishlist);

    const isInWishlist = user.wishlist.includes(productId);
    console.log("🔥 WISHLIST TOGGLE: Is in wishlist:", isInWishlist);
    
    let newWishlist;
    if (isInWishlist) {
      // Remove from wishlist
      newWishlist = user.wishlist.filter(id => id.toString() !== productId);
      console.log("🔥 WISHLIST TOGGLE: Removing from wishlist");
    } else {
      // Add to wishlist
      newWishlist = [...user.wishlist, productId];
      console.log("🔥 WISHLIST TOGGLE: Adding to wishlist");
    }

    console.log("🔥 WISHLIST TOGGLE: New wishlist:", newWishlist);

    // Use findByIdAndUpdate to avoid validation issues
    const updatedUser = await User.findByIdAndUpdate(userId, { wishlist: newWishlist }, { new: true });
    console.log("🔥 WISHLIST TOGGLE: User updated successfully");
    console.log("🔥 WISHLIST TOGGLE: Updated user wishlist:", updatedUser.wishlist);

    const action = isInWishlist ? "removed" : "added";
    console.log("🔥 WISHLIST TOGGLE: Action:", action);
    
    const response = { 
      message: isInWishlist ? "Product removed from wishlist" : "Product added to wishlist",
      action: action,
      isInWishlist: !isInWishlist,
      wishlistCount: newWishlist.length 
    };

    console.log("🔥 WISHLIST TOGGLE: Sending response:", response);
    res.json(response);
  } catch (error) {
    console.error("🔥 WISHLIST TOGGLE: Error occurred:", error);
    console.error("🔥 WISHLIST TOGGLE: Error stack:", error.stack);
    res.status(500).json({ message: "Failed to toggle wishlist" });
  }
};