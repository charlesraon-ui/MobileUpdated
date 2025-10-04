import { Router } from "express";
import Bundle from "../models/Bundle.js";

const router = Router();

// GET /api/bundles - List all bundles
router.get("/", async (req, res) => {
  try {
    const bundles = await Bundle.find()
      .populate('items.productId', 'name price imageUrl')
      .populate('products.product', 'name price imageUrl') // support legacy schema
      .lean();

    // Normalize legacy bundles that use `products.product` into `items.productId`
    const normalized = (bundles || []).map((b) => {
      const hasItems = Array.isArray(b.items) && b.items.length > 0;
      const hasLegacy = Array.isArray(b.products) && b.products.length > 0;

      if (!hasItems && hasLegacy) {
        const items = b.products.map((it) => ({
          productId: it.product, // populated doc from products.product
          quantity: Number(it.quantity || 1),
        }));
        return { ...b, items, products: undefined };
      }
      return b;
    });

    res.json(normalized);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/bundles/:id - Get single bundle
router.get("/:id", async (req, res) => {
  try {
    const bundle = await Bundle.findById(req.params.id)
      .populate('items.productId', 'name price imageUrl')
      .populate('products.product', 'name price imageUrl')
      .lean();
    
    if (!bundle) {
      return res.status(404).json({ message: "Bundle not found" });
    }

    // Normalize legacy products -> items
    const hasItems = Array.isArray(bundle.items) && bundle.items.length > 0;
    const hasLegacy = Array.isArray(bundle.products) && bundle.products.length > 0;
    const normalized = hasItems
      ? bundle
      : hasLegacy
        ? { 
            ...bundle, 
            items: bundle.products.map((it) => ({
              productId: it.product,
              quantity: Number(it.quantity || 1),
            })),
            products: undefined,
          }
        : bundle;
    
    res.json(normalized);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;