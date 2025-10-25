// controllers/adminLoyaltyController.js
import LoyaltyReward from "../models/LoyaltyReward.js";
import LoyaltyTier from "../models/LoyaltyTier.js";
import PointRule from "../models/PointRule.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import loyaltyService from "../services/loyaltyService.js";
import { initializeLoyaltyTiers, checkTierConsistency } from "../scripts/initializeLoyaltyTiers.js";

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
    
    const loyalty = await LoyaltyReward.findOne({ userId });
    if (!loyalty) {
      return res.status(404).json({ success: false, message: "Loyalty record not found" });
    }
    
    const history = loyalty.pointsHistory
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(entry => ({
        points: entry.points,
        source: entry.source,
        orderId: entry.orderId,
        rewardName: entry.rewardName,
        reason: entry.reason,
        createdAt: entry.createdAt
      }));
    
    res.json({ 
      success: true, 
      history,
      totalPoints: loyalty.points,
      tier: loyalty.tier
    });
  } catch (error) {
    console.error("GET_LOYALTY_HISTORY_ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// LOYALTY STATISTICS
export const getLoyaltyStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const loyaltyUsers = await LoyaltyReward.countDocuments();
    const activeCards = await LoyaltyReward.countDocuments({ cardIssued: true, isActive: true });
    
    const tierStats = await LoyaltyReward.aggregate([
      { $group: { _id: "$tier", count: { $sum: 1 } } }
    ]);
    
    const totalPointsIssued = await LoyaltyReward.aggregate([
      { $group: { _id: null, total: { $sum: "$points" } } }
    ]);
    
    const totalPointsRedeemed = await LoyaltyReward.aggregate([
      { $unwind: "$pointsHistory" },
      { $match: { "pointsHistory.source": "reward_redeemed" } },
      { $group: { _id: null, total: { $sum: { $abs: "$pointsHistory.points" } } } }
    ]);
    
    const recentRedemptions = await LoyaltyReward.aggregate([
      { $unwind: "$pointsHistory" },
      { $match: { "pointsHistory.source": "reward_redeemed" } },
      { $sort: { "pointsHistory.createdAt": -1 } },
      { $limit: 10 },
      { $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user"
      }},
      { $project: {
        userId: 1,
        userName: { $arrayElemAt: ["$user.name", 0] },
        rewardName: "$pointsHistory.rewardName",
        points: "$pointsHistory.points",
        redeemedAt: "$pointsHistory.createdAt"
      }}
    ]);

    const topSpenders = await LoyaltyReward.find()
      .populate("userId", "name email")
      .sort({ totalSpent: -1 })
      .limit(10)
      .select("userId totalSpent points tier");

    res.json({
      success: true,
      stats: {
        totalUsers,
        loyaltyUsers,
        activeCards,
        participationRate: totalUsers > 0 ? ((loyaltyUsers / totalUsers) * 100).toFixed(2) : 0,
        tierDistribution: tierStats,
        totalPointsIssued: totalPointsIssued[0]?.total || 0,
        totalPointsRedeemed: totalPointsRedeemed[0]?.total || 0,
        recentRedemptions,
        topSpenders
      }
    });
  } catch (error) {
    console.error("GET_LOYALTY_STATS_ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// TIER INITIALIZATION AND MANAGEMENT
export const initializeTiers = async (req, res) => {
  try {
    const result = await initializeLoyaltyTiers();
    res.json(result);
  } catch (error) {
    console.error("INITIALIZE_TIERS_ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const checkTiers = async (req, res) => {
  try {
    const result = await checkTierConsistency();
    res.json(result);
  } catch (error) {
    console.error("CHECK_TIERS_ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// BULK OPERATIONS
export const bulkUpdateLoyalty = async (req, res) => {
  try {
    const { operation, userIds, points, reason } = req.body;
    
    if (!operation || !userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ 
        success: false, 
        message: "operation and userIds array are required" 
      });
    }

    const results = [];
    
    for (const userId of userIds) {
      try {
        let loyalty = await LoyaltyReward.findOne({ userId });
        if (!loyalty) {
          loyalty = new LoyaltyReward({ userId });
        }

        switch (operation) {
          case 'add_points':
            if (!points || points <= 0) {
              results.push({ userId, success: false, error: 'Invalid points value' });
              continue;
            }
            loyalty.points = (loyalty.points || 0) + points;
            loyalty.pointsHistory.push({
              points: points,
              source: "admin_bulk_adjustment",
              reason: reason || "Bulk points addition",
              createdAt: new Date(),
            });
            break;
            
          case 'recalculate':
            // Recalculate points based on orders
            const orders = await Order.find({ userId, status: { $in: ['completed', 'confirmed'] } });
            const totalSpent = orders.reduce((sum, order) => sum + (order.total || 0), 0);
            loyalty.totalSpent = totalSpent;
            loyalty.purchaseCount = orders.length;
            loyalty.points = loyaltyService.calculatePoints({ total: totalSpent });
            loyalty.pointsHistory.push({
              points: loyalty.points,
              source: "admin_recalculation",
              reason: reason || "Points recalculated",
              createdAt: new Date(),
            });
            break;
            
          default:
            results.push({ userId, success: false, error: 'Invalid operation' });
            continue;
        }

        // Update tier
        const newTier = loyaltyService.getTier(loyalty.points);
        loyalty.tier = newTier;
        
        await loyalty.save();
        
        // Update user model
        await User.findByIdAndUpdate(userId, {
          loyaltyTier: newTier,
          loyaltyPoints: loyalty.points
        });
        
        results.push({ 
          userId, 
          success: true, 
          newPoints: loyalty.points, 
          tier: newTier 
        });
      } catch (error) {
        results.push({ userId, success: false, error: error.message });
      }
    }

    res.json({
      success: true,
      message: `Bulk operation ${operation} completed`,
      results
    });
  } catch (error) {
    console.error("BULK_UPDATE_LOYALTY_ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};