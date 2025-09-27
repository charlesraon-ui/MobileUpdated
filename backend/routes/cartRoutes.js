// routes/cartRoutes.js
import { Router } from "express";
import Cart from "../models/Cart.js";

const router = Router();

/** Get cart by userId */
router.get("/:userId", async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.params.userId });
    res.json(cart ?? { userId: req.params.userId, items: [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/** Replace cart items (idempotent) */
router.post("/", async (req, res) => {
  try {
    const { userId, items } = req.body ?? {};
    if (!userId) return res.status(400).json({ message: "userId is required" });

    let cart = await Cart.findOne({ userId });
    if (!cart) cart = new Cart({ userId, items: [] });

    cart.items = Array.isArray(items) ? items : [];
    await cart.save();

    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
