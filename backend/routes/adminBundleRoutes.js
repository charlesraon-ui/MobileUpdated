// routes/adminBundleRoutes.js
import express from "express";
import Bundle from "../models/Bundle.js";
import Product from "../models/Products.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

// All routes require authentication and admin privileges
router.use(authMiddleware);
router.use(isAdmin);

// GET /api/admin/bundles - List all bundles for admin (with full population)
router.get("/", async (req, res) => {
  try {
    const bundles = await Bundle.find()
      .populate('items.productId', 'name price imageUrl description category stock')
      .sort({ createdAt: -1 })
      .lean();

    // Transform data for admin interface
    const adminBundles = bundles.map(bundle => ({
      _id: bundle._id,
      name: bundle.name,
      description: bundle.description,
      bundlePrice: bundle.bundlePrice,
      originalPrice: bundle.originalPrice,
      discount: bundle.discount,
      stock: bundle.stock,
      active: bundle.active,
      createdAt: bundle.createdAt,
      updatedAt: bundle.updatedAt,
      items: (bundle.items || []).map(item => {
        const product = item.productId || {};
        return {
          productId: product._id || item.productId,
          productName: product.name || 'Unknown Product',
          productPrice: product.price || 0,
          productImage: product.imageUrl || '',
          quantity: item.quantity || 0,
          subtotal: (product.price || 0) * (item.quantity || 0)
        };
      }),
      totalItems: (bundle.items || []).length,
      totalProducts: (bundle.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0)
    }));

    res.json(adminBundles);
  } catch (err) {
    console.error('Admin bundles fetch error:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/bundles/stats - Get bundle statistics for admin dashboard
router.get("/stats", async (req, res) => {
  try {
    const totalBundles = await Bundle.countDocuments();
    const activeBundles = await Bundle.countDocuments({ active: true });
    const inactiveBundles = await Bundle.countDocuments({ active: false });
    
    const bundlesWithItems = await Bundle.aggregate([
      {
        $project: {
          name: 1,
          itemCount: { $size: "$items" },
          bundlePrice: 1,
          originalPrice: 1,
          active: 1
        }
      }
    ]);

    const stats = {
      totalBundles,
      activeBundles,
      inactiveBundles,
      averageItemsPerBundle: bundlesWithItems.length > 0 
        ? Math.round(bundlesWithItems.reduce((sum, bundle) => sum + bundle.itemCount, 0) / bundlesWithItems.length)
        : 0,
      totalBundleValue: bundlesWithItems.reduce((sum, bundle) => sum + bundle.bundlePrice, 0),
      bundlesWithItems: bundlesWithItems.filter(bundle => bundle.itemCount > 0).length,
      bundlesWithoutItems: bundlesWithItems.filter(bundle => bundle.itemCount === 0).length
    };

    res.json(stats);
  } catch (err) {
    console.error('Admin bundle stats error:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/bundles/:id - Get single bundle for admin
router.get("/:id", async (req, res) => {
  try {
    const bundle = await Bundle.findById(req.params.id)
      .populate('items.productId', 'name price imageUrl description category stock')
      .lean();
    
    if (!bundle) {
      return res.status(404).json({ message: "Bundle not found" });
    }

    // Transform data for admin interface
    const adminBundle = {
      _id: bundle._id,
      name: bundle.name,
      description: bundle.description,
      bundlePrice: bundle.bundlePrice,
      originalPrice: bundle.originalPrice,
      discount: bundle.discount,
      stock: bundle.stock,
      active: bundle.active,
      createdAt: bundle.createdAt,
      updatedAt: bundle.updatedAt,
      items: bundle.items.map(item => ({
        productId: item.productId._id,
        productName: item.productId.name,
        productPrice: item.productId.price,
        productImage: item.productId.imageUrl,
        quantity: item.quantity,
        subtotal: item.productId.price * item.quantity
      })),
      totalItems: bundle.items.length,
      totalProducts: bundle.items.reduce((sum, item) => sum + item.quantity, 0)
    };

    res.json(adminBundle);
  } catch (err) {
    console.error('Admin bundle fetch error:', err);
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/bundles - Create new bundle (admin)
router.post("/", async (req, res) => {
  try {
    const {
      name,
      description,
      items,
      bundlePrice,
      originalPrice,
      discount,
      stock,
      active = true
    } = req.body;

    // Validate required fields
    if (!name || !description || !items || !bundlePrice || !originalPrice) {
      return res.status(400).json({ 
        message: "Missing required fields: name, description, items, bundlePrice, originalPrice" 
      });
    }

    // Validate items array
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        message: "Items must be a non-empty array" 
      });
    }

    // Validate that all products exist
    const productIds = items.map(item => item.productId);
    const existingProducts = await Product.find({ _id: { $in: productIds } });
    
    if (existingProducts.length !== productIds.length) {
      return res.status(400).json({ 
        message: "One or more products not found" 
      });
    }

    // Create new bundle
    const newBundle = new Bundle({
      name,
      description,
      items,
      bundlePrice,
      originalPrice,
      discount: discount || Math.round(((originalPrice - bundlePrice) / originalPrice) * 100),
      stock: stock || 0,
      active
    });

    const savedBundle = await newBundle.save();
    
    // Return populated bundle for admin
    const populatedBundle = await Bundle.findById(savedBundle._id)
      .populate('items.productId', 'name price imageUrl description category stock')
      .lean();

    const adminBundle = {
      _id: populatedBundle._id,
      name: populatedBundle.name,
      description: populatedBundle.description,
      bundlePrice: populatedBundle.bundlePrice,
      originalPrice: populatedBundle.originalPrice,
      discount: populatedBundle.discount,
      stock: populatedBundle.stock,
      active: populatedBundle.active,
      createdAt: populatedBundle.createdAt,
      updatedAt: populatedBundle.updatedAt,
      items: populatedBundle.items.map(item => ({
        productId: item.productId._id,
        productName: item.productId.name,
        productPrice: item.productId.price,
        productImage: item.productId.imageUrl,
        quantity: item.quantity,
        subtotal: item.productId.price * item.quantity
      })),
      totalItems: populatedBundle.items.length,
      totalProducts: populatedBundle.items.reduce((sum, item) => sum + item.quantity, 0)
    };

    res.status(201).json(adminBundle);
  } catch (err) {
    console.error('Admin bundle creation error:', err);
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/admin/bundles/:id - Update bundle (admin)
router.put("/:id", async (req, res) => {
  try {
    const {
      name,
      description,
      items,
      bundlePrice,
      originalPrice,
      discount,
      stock,
      active
    } = req.body;

    const bundle = await Bundle.findById(req.params.id);
    if (!bundle) {
      return res.status(404).json({ message: "Bundle not found" });
    }

    // Update fields if provided
    if (name !== undefined) bundle.name = name;
    if (description !== undefined) bundle.description = description;
    if (items !== undefined) {
      // Validate that all products exist
      const productIds = items.map(item => item.productId);
      const existingProducts = await Product.find({ _id: { $in: productIds } });
      
      if (existingProducts.length !== productIds.length) {
        return res.status(400).json({ 
          message: "One or more products not found" 
        });
      }
      bundle.items = items;
    }
    if (bundlePrice !== undefined) bundle.bundlePrice = bundlePrice;
    if (originalPrice !== undefined) bundle.originalPrice = originalPrice;
    if (discount !== undefined) bundle.discount = discount;
    if (stock !== undefined) bundle.stock = stock;
    if (active !== undefined) bundle.active = active;

    // Recalculate discount if prices changed
    if (bundlePrice !== undefined || originalPrice !== undefined) {
      bundle.discount = Math.round(((bundle.originalPrice - bundle.bundlePrice) / bundle.originalPrice) * 100);
    }

    const updatedBundle = await bundle.save();
    
    // Return populated bundle for admin
    const populatedBundle = await Bundle.findById(updatedBundle._id)
      .populate('items.productId', 'name price imageUrl description category stock')
      .lean();

    const adminBundle = {
      _id: populatedBundle._id,
      name: populatedBundle.name,
      description: populatedBundle.description,
      bundlePrice: populatedBundle.bundlePrice,
      originalPrice: populatedBundle.originalPrice,
      discount: populatedBundle.discount,
      stock: populatedBundle.stock,
      active: populatedBundle.active,
      createdAt: populatedBundle.createdAt,
      updatedAt: populatedBundle.updatedAt,
      items: populatedBundle.items.map(item => ({
        productId: item.productId._id,
        productName: item.productId.name,
        productPrice: item.productId.price,
        productImage: item.productId.imageUrl,
        quantity: item.quantity,
        subtotal: item.productId.price * item.quantity
      })),
      totalItems: populatedBundle.items.length,
      totalProducts: populatedBundle.items.reduce((sum, item) => sum + item.quantity, 0)
    };

    res.json(adminBundle);
  } catch (err) {
    console.error('Admin bundle update error:', err);
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/admin/bundles/:id - Delete bundle (admin)
router.delete("/:id", async (req, res) => {
  try {
    const bundle = await Bundle.findById(req.params.id);
    if (!bundle) {
      return res.status(404).json({ message: "Bundle not found" });
    }

    await Bundle.findByIdAndDelete(req.params.id);
    res.json({ message: "Bundle deleted successfully" });
  } catch (err) {
    console.error('Admin bundle deletion error:', err);
    res.status(500).json({ message: err.message });
  }
});

export default router;