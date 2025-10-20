import { Router } from "express";
import Bundle from "../models/Bundle.js";

const router = Router();

// GET /api/bundles - List all bundles
router.get("/", async (req, res) => {
  try {
    const bundles = await Bundle.find({ active: true })
      .populate('items.productId', 'name price imageUrl')
      .lean();

    res.json(bundles);
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

    res.json(bundle);
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

export default router;