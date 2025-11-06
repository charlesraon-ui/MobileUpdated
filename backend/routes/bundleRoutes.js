import { Router } from "express";
import Bundle from "../models/Bundle.js";
import Order from "../models/Order.js";
import Product from "../models/Products.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

// GET /api/bundles - List all bundles
router.get("/", async (req, res) => {
  try {
    const bundles = await Bundle.find({ active: true })
      .populate('items.productId', 'name price imageUrl')
      .lean();

    // Transform bundles to show only price field
    const transformedBundles = bundles.map(bundle => ({
      _id: bundle._id,
      name: bundle.name,
      description: bundle.description,
      imageUrl: bundle.imageUrl,
      items: bundle.items,
      price: bundle.bundlePrice || bundle.price, // Use bundlePrice (discounted price) as primary, fallback to price
      stock: bundle.stock,
      active: bundle.active,
      createdAt: bundle.createdAt,
      updatedAt: bundle.updatedAt
    }));

    res.json({ data: transformedBundles });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/bundles/:id - Get single bundle
router.get("/:id", async (req, res) => {
  try {
    const bundle = await Bundle.findById(req.params.id)
      .populate('items.productId', 'name price imageUrl')
      .lean();
    
    if (!bundle) {
      return res.status(404).json({ message: "Bundle not found" });
    }

    // Transform bundle to show only price field
    const transformedBundle = {
      _id: bundle._id,
      name: bundle.name,
      description: bundle.description,
      imageUrl: bundle.imageUrl,
      items: bundle.items,
      price: bundle.bundlePrice || bundle.price, // Use bundlePrice (discounted price) as primary, fallback to price
      stock: bundle.stock,
      active: bundle.active,
      createdAt: bundle.createdAt,
      updatedAt: bundle.updatedAt
    };

    res.json({ data: transformedBundle });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/bundles - Create new bundle
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
    
    // Populate the saved bundle before returning
    const populatedBundle = await Bundle.findById(savedBundle._id)
      .populate('items.productId', 'name price imageUrl')
      .lean();

    res.status(201).json(populatedBundle);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/bundles/:id/order - Submit order for a bundle
router.post("/:id/order", authMiddleware, async (req, res) => {
  try {
    const bundleId = req.params.id;
    const { 
      quantity = 1, 
      address, 
      deliveryType = "in-house", 
      paymentMethod = "COD" 
    } = req.body;

    // Validate required fields
    if (!address) {
      return res.status(400).json({ 
        message: "Address is required for bundle order" 
      });
    }

    // Find the bundle
    const bundle = await Bundle.findById(bundleId)
      .populate('items.productId', 'name price imageUrl weightKg')
      .lean();
    
    if (!bundle) {
      return res.status(404).json({ message: "Bundle not found" });
    }

    if (!bundle.active) {
      return res.status(400).json({ message: "Bundle is not available" });
    }

    // Check stock availability
    if (bundle.stock < quantity) {
      return res.status(400).json({ 
        message: `Insufficient stock. Only ${bundle.stock} bundles available` 
      });
    }

    // Calculate delivery fee based on delivery type
    let deliveryFee = 0;
    if (deliveryType === "in-house") {
      deliveryFee = 50; // Standard delivery fee
    } else if (deliveryType === "third-party") {
      deliveryFee = 100; // Third-party delivery fee
    }
    // pickup has no delivery fee

    // Get the bundle price (use price field if available, fallback to bundlePrice)
    const bundlePrice = bundle.price || bundle.bundlePrice;

    // Create order items from bundle
    const orderItems = bundle.items.map(item => ({
      productId: item.productId._id,
      name: item.productId.name,
      imageUrl: item.productId.imageUrl,
      price: bundlePrice / bundle.items.reduce((sum, i) => sum + i.quantity, 0), // Distribute bundle price across items
      quantity: item.quantity * quantity, // Multiply by bundle quantity
      weightKg: item.productId.weightKg || 0
    }));

    // Calculate totals with VAT (12%)
    const subtotal = bundlePrice * quantity;
    const VAT_RATE = 0.12;
    const taxAmount = Math.round(subtotal * VAT_RATE * 100) / 100;
    const total = Math.round((subtotal + taxAmount + deliveryFee) * 100) / 100;

    // Create the order
    const newOrder = new Order({
      userId: req.user.userId,
      items: orderItems,
      subtotal: subtotal,
      deliveryFee: deliveryFee,
      taxAmount: taxAmount,
      total: total,
      address: address,
      deliveryType: deliveryType,
      paymentMethod: paymentMethod,
      status: "pending"
    });

    const savedOrder = await newOrder.save();

    // Update bundle stock
    await Bundle.findByIdAndUpdate(bundleId, {
      $inc: { stock: -quantity }
    });

    res.status(201).json({
      success: true,
      message: "Bundle order created successfully",
      data: {
        orderId: savedOrder._id,
        bundleName: bundle.name,
        quantity: quantity,
        subtotal: subtotal,
        deliveryFee: deliveryFee,
        total: total,
        taxAmount: taxAmount,
        status: savedOrder.status,
        estimatedDelivery: deliveryType === "pickup" ? "Ready for pickup" : "2-3 business days"
      }
    });

  } catch (err) {
    console.error("Bundle order error:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;