import Promotion from "../models/Promotion.js";
import mongoose from "mongoose";

// Apply promo code and calculate discount
export const applyPromo = async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    
    // Validate input
    if (!code || !subtotal) {
      return res.status(400).json({ message: "Code and subtotal are required" });
    }
    
    if (subtotal <= 0) {
      return res.status(400).json({ message: "Invalid subtotal amount" });
    }
    
    const now = new Date();
    
    // Find promo code (case insensitive)
    const promo = await Promotion.findOne({ 
      code: String(code).toUpperCase().trim() 
    });
    
    if (!promo) {
      return res.status(404).json({ message: "Invalid code" });
    }
    
    // Validation checks
    if (promo.status === "Paused") {
      return res.status(400).json({ message: "Promo is paused" });
    }
    
    if (promo.startsAt && now < promo.startsAt) {
      return res.status(400).json({ message: "Promo not started" });
    }
    
    if (promo.endsAt && now > promo.endsAt) {
      return res.status(400).json({ message: "Promo expired" });
    }
    
    if (promo.limit > 0 && promo.used >= promo.limit) {
      return res.status(400).json({ message: "Promo usage limit reached" });
    }
    
    if (subtotal < (promo.minSpend || 0)) {
      return res.status(400).json({ 
        message: `Minimum spend is ₱${promo.minSpend}` 
      });
    }
    
    // Calculate discount
    let discount = 0;
    let freeShipping = false;
    
    if (promo.type === "Percentage") {
      discount = (Number(promo.value || 0) / 100) * subtotal;
      if (promo.maxDiscount && promo.maxDiscount > 0) {
        discount = Math.min(discount, promo.maxDiscount);
      }
    } else if (promo.type === "Fixed Amount") {
      discount = Math.min(Number(promo.value || 0), subtotal);
    } else if (promo.type === "Free Shipping") {
      // Free shipping doesn't reduce subtotal but removes delivery fee
      freeShipping = true;
      discount = 0;
    }
    
    // Round discount to 2 decimal places
    discount = Math.round(discount * 100) / 100;
    
    const response = {
      ok: true,
      type: promo.type,
      discount: discount,
      promo: {
        _id: promo._id,
        code: promo.code,
        name: promo.name,
        type: promo.type,
        value: promo.value,
        minSpend: promo.minSpend,
        maxDiscount: promo.maxDiscount,
        used: promo.used,
        limit: promo.limit,
        status: promo.status,
        startsAt: promo.startsAt,
        endsAt: promo.endsAt
      }
    };
    
    if (freeShipping) {
      response.freeShipping = true;
    }
    
    res.json(response);
    
  } catch (err) {
    console.error("Apply promo error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Redeem promo code during order creation (called within transaction)
export const redeemPromoOnOrder = async (session, promoId) => {
  try {
    const result = await Promotion.updateOne(
      { 
        _id: promoId, 
        $or: [
          { limit: 0 }, // No limit
          { used: { $lt: "$limit" } } // Usage under limit
        ]
      },
      { $inc: { used: 1 } },
      { session }
    );
    
    return result;
  } catch (err) {
    console.error("Redeem promo error:", err);
    throw err;
  }
};

// List all promos (admin only)
export const listPromos = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    
    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get promos with pagination
    const promos = await Promotion.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const total = await Promotion.countDocuments(filter);
    
    res.json({
      promos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (err) {
    console.error("List promos error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Create new promo (admin only)
export const createPromo = async (req, res) => {
  try {
    const {
      code,
      name,
      type,
      value,
      minSpend,
      maxDiscount,
      limit,
      status,
      startsAt,
      endsAt
    } = req.body;
    
    // Validate required fields
    if (!code || !name || !type) {
      return res.status(400).json({ 
        message: "Code, name, and type are required" 
      });
    }
    
    // Check if code already exists
    const existingPromo = await Promotion.findOne({ 
      code: code.toUpperCase().trim() 
    });
    
    if (existingPromo) {
      return res.status(400).json({ 
        message: "Promo code already exists" 
      });
    }
    
    // Create new promo
    const promo = new Promotion({
      code: code.toUpperCase().trim(),
      name: name.trim(),
      type,
      value: value || 0,
      minSpend: minSpend || 0,
      maxDiscount: maxDiscount || 0,
      limit: limit || 0,
      status: status || "Active",
      startsAt: startsAt ? new Date(startsAt) : null,
      endsAt: endsAt ? new Date(endsAt) : null
    });
    
    await promo.save();
    
    res.status(201).json({
      message: "Promo created successfully",
      promo
    });
    
  } catch (err) {
    console.error("Create promo error:", err);
    if (err.code === 11000) {
      return res.status(400).json({ 
        message: "Promo code already exists" 
      });
    }
    res.status(500).json({ message: "Server error" });
  }
};

// Toggle promo status (admin only)
export const togglePromoStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    const promo = await Promotion.findById(id);
    if (!promo) {
      return res.status(404).json({ message: "Promo not found" });
    }
    
    // Toggle between Active and Paused
    promo.status = promo.status === "Active" ? "Paused" : "Active";
    await promo.save();
    
    res.json({
      message: `Promo ${promo.status.toLowerCase()} successfully`,
      promo
    });
    
  } catch (err) {
    console.error("Toggle promo status error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete promo (admin only)
export const deletePromo = async (req, res) => {
  try {
    const { id } = req.params;
    
    const promo = await Promotion.findByIdAndDelete(id);
    if (!promo) {
      return res.status(404).json({ message: "Promo not found" });
    }
    
    res.json({ message: "Promo deleted successfully" });
    
  } catch (err) {
    console.error("Delete promo error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update promo (admin only)
export const updatePromo = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Don't allow updating the code after creation
    delete updates.code;
    
    const promo = await Promotion.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!promo) {
      return res.status(404).json({ message: "Promo not found" });
    }
    
    res.json({
      message: "Promo updated successfully",
      promo
    });
    
  } catch (err) {
    console.error("Update promo error:", err);
    res.status(500).json({ message: "Server error" });
  }
};