// controllers/adminLoyaltyController.js
import LoyaltyReward from "../models/LoyaltyReward.js";
import LoyaltyTier from "../models/LoyaltyTier.js";
import PointRule from "../models/PointRule.js";
import mongoose from "mongoose";

// TIER MANAGEMENT
export const getAllTiers = async (req, res) => {
  try {
    const tiers = await LoyaltyTier.find().sort({ displayOrder: 1 });
    res.json({ success: true, tiers });
  } catch (error) {
    console.error("GET_ALL_TIERS_ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createTier = async (req, res) => {
  try {
    const { name, pointThreshold, discountPercentage, benefits, displayOrder } = req.body;
    
    const tier = new LoyaltyTier({
      name,
      pointThreshold,
      discountPercentage,
      benefits: Array.isArray(benefits) ? benefits : [],
      displayOrder
    });
    
    await tier.save();
    res.status(201).json({ success: true, tier });
  } catch (error) {
    console.error("CREATE_TIER_ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTier = async (req, res) => {
  try {
    const { tierId } = req.params;
    const updates = req.body;
    
    const tier = await LoyaltyTier.findByIdAndUpdate(
      tierId,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!tier) {
      return res.status(404).json({ success: false, message: "Tier not found" });
    }
    
    res.json({ success: true, tier });
  } catch (error) {
    console.error("UPDATE_TIER_ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POINT RULE MANAGEMENT
export const getAllPointRules = async (req, res) => {
  try {
    const rules = await PointRule.find()
      .populate("productId", "name")
      .populate("categoryId", "name");
    
    res.json({ success: true, rules });
  } catch (error) {
    console.error("GET_ALL_POINT_RULES_ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createPointRule = async (req, res) => {
  try {
    const { name, type, pointsPerUnit, unitAmount, productId, categoryId, isActive, startDate, endDate } = req.body;
    
    const rule = new PointRule({
      name,
      type,
      pointsPerUnit,
      unitAmount,
      productId: type === "product_specific" ? productId : undefined,
      categoryId: type === "category_specific" ? categoryId : undefined,
      isActive,
      startDate,
      endDate
    });
    
    await rule.save();
    res.status(201).json({ success: true, rule });
  } catch (error) {
    console.error("CREATE_POINT_RULE_ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePointRule = async (req, res) => {
  try {
    const { ruleId } = req.params;
    const updates = req.body;
    
    const rule = await PointRule.findByIdAndUpdate(
      ruleId,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!rule) {
      return res.status(404).json({ success: false, message: "Rule not found" });
    }
    
    res.json({ success: true, rule });
  } catch (error) {
    console.error("UPDATE_POINT_RULE_ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// CUSTOMER LOYALTY MANAGEMENT
export const getAllCustomerLoyalty = async (req, res) => {
  try {
    const loyalties = await LoyaltyReward.find()
      .populate("userId", "name email phone")
      .sort({ totalSpent: -1 });
    
    res.json({ success: true, loyalties });
  } catch (error) {
    console.error("GET_ALL_CUSTOMER_LOYALTY_ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCustomerLoyalty = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const loyalty = await LoyaltyReward.findOne({ userId })
      .populate("userId", "name email phone");
    
    if (!loyalty) {
      return res.status(404).json({ success: false, message: "Loyalty record not found" });
    }
    
    res.json({ success: true, loyalty });
  } catch (error) {
    console.error("GET_CUSTOMER_LOYALTY_ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCustomerLoyalty = async (req, res) => {
  try {
    const { userId } = req.params;
    const { points, purchaseCount, totalSpent } = req.body;
    
    const loyalty = await LoyaltyReward.findOne({ userId });
    
    if (!loyalty) {
      return res.status(404).json({ success: false, message: "Loyalty record not found" });
    }
    
    if (points !== undefined) loyalty.points = points;
    if (purchaseCount !== undefined) loyalty.purchaseCount = purchaseCount;
    if (totalSpent !== undefined) loyalty.totalSpent = totalSpent;
    
    loyalty.checkEligibility();
    await loyalty.save();
    
    res.json({ success: true, loyalty });
  } catch (error) {
    console.error("UPDATE_CUSTOMER_LOYALTY_ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// LOYALTY HISTORY
export const getLoyaltyHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // This would be implemented with a LoyaltyHistory model
    // For now, we'll return a placeholder
    res.json({ 
      success: true, 
      message: "Loyalty history feature will be implemented with a dedicated model" 
    });
  } catch (error) {
    console.error("GET_LOYALTY_HISTORY_ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};