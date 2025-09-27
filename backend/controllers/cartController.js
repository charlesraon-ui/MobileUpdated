import Cart from "../models/Cart.js";

export const getCart = async (req, res) => {
    try {
        const { userId } = req.params;
        const cart = await Cart.findOne({ userId });
        res.status(200).json(cart || { items: [] });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const updateCart = async (req, res) => {
    try {
        const { userId, items } = req.body;
        let cart = await Cart.findOne({ userId });
        if (cart) {
            cart.items = items;
            await cart.save();
        } else {
            cart = new Cart({ userId, items });
            await cart.save();
        }
        res.status(200).json(cart);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
