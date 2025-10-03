import { Router } from "express";
import Bundle from "../models/Bundle.js";

const router = Router();

// GET /api/bundles - List all bundles
router.get("/", async (req, res) => {
  try {
    const bundles = await Bundle.find()
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

export default router;