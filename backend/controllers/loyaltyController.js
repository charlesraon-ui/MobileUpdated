import LoyaltyReward from "../models/LoyaltyReward.js";
import Order from "../models/Order.js";
import LoyaltyTier from "../models/LoyaltyTier.js";
import User from "../models/User.js";
import { rewards } from "../config/loyaltyConfig.js";
import loyaltyService from "../services/loyaltyService.js";

export const getLoyaltyStatus = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    let loyalty = await LoyaltyReward.findOne({ userId });

    if (!loyalty) {
      const orders = await Order.find({
        userId,
        $or: [
          { status: "completed" },
          { status: "confirmed", paymentStatus: "paid" },
        ],
      });
      const purchaseCount = orders.length;
      const totalSpent = orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);

      loyalty = new LoyaltyReward({ userId, purchaseCount, totalSpent });
      loyalty.checkEligibility();
      await loyalty.save();
    }

    const criteria = LoyaltyReward.CRITERIA;
    res.json({
      success: true,
      loyalty: {
        isEligible: loyalty.isEligible,
        cardIssued: loyalty.cardIssued,
        cardId: loyalty.cardId,
        cardType: loyalty.cardType,
        purchaseCount: loyalty.purchaseCount,
        totalSpent: loyalty.totalSpent,
        points: loyalty.points || 0,
        discountAmount: loyalty.discountAmount || 0,
        expiryDate: loyalty.expiryDate,
        isActive: loyalty.isActive,
        criteria: { purchaseCount: criteria.PURCHASE_COUNT, totalSpent: criteria.TOTAL_SPENT },
      },
    });
  } catch (error) {
    console.error("GET_LOYALTY_STATUS_ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const issueLoyaltyCard = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const loyalty = await LoyaltyReward.findOne({ userId });
    if (!loyalty) {
      return res.status(404).json({ success: false, message: "Loyalty record not found" });
    }
    if (!loyalty.isEligible) {
      return res.status(400).json({ success: false, message: "Not eligible for loyalty card yet" });
    }

    const issued = loyalty.issueCard();
    if (!issued) {
      return res.status(400).json({ success: false, message: "Failed to issue loyalty card" });
    }
    
    // Set the discount percentage based on current tier
    const discountPercentage = loyaltyService.getTierDiscountPercentage(loyalty.tier);
    loyalty.discountAmount = discountPercentage;
    
    await loyalty.save();

    res.json({
      success: true,
      message: "Loyalty card issued successfully",
      card: {
        cardId: loyalty.cardId,
        cardType: loyalty.cardType,
        discountAmount: loyalty.discountAmount || 0,
        discountPercentage: loyalty.discountAmount || 0, // discountAmount now stores percentage
        expiryDate: loyalty.expiryDate,
      },
    });
  } catch (error) {
    console.error("ISSUE_LOYALTY_CARD_ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateLoyaltyAfterPurchase = async (userId, amount, orderId) => {
  try {
    if (!userId) return;
    const amountNum = Number(amount);
    const validAmount = Number.isFinite(amountNum) && amountNum > 0 ? amountNum : 0;

    let loyalty = await LoyaltyReward.findOne({ userId });
    if (!loyalty) {
      loyalty = new LoyaltyReward({ userId });
    }

    if (orderId) {
      const alreadyRecorded = Array.isArray(loyalty.pointsHistory) &&
        loyalty.pointsHistory.some((h) => String(h.orderId) === String(orderId));
      if (alreadyRecorded) return loyalty;
    }

    loyalty.purchaseCount += 1;
    loyalty.totalSpent += validAmount;

    // Use loyalty service to calculate points
    const pointsEarned = loyaltyService.calculatePoints({ total: validAmount });
    loyalty.points += pointsEarned;

    loyalty.pointsHistory.push({
      points: pointsEarned,
      source: "order_processed",
      orderId: orderId,
      createdAt: new Date(),
    });

    loyalty.checkEligibility();
    await updateLoyaltyTier(loyalty);
    await loyalty.save();
    return loyalty;
  } catch (error) {
    console.error("UPDATE_LOYALTY_ERROR:", error);
    return null;
  }
};

const updateLoyaltyTier = async (loyalty) => {
  try {
    // Use loyalty service to determine tier
    const newTier = loyaltyService.getTier(loyalty.points);
    
    // Always update the user's loyalty points, and tier if it changed
    const updateData = {
      loyaltyPoints: loyalty.points
    };
    
    if (newTier && newTier !== loyalty.tier) {
      loyalty.tier = newTier;
      updateData.loyaltyTier = newTier;
    }
    
    // Update discount amount to be the percentage for the current tier
    const discountPercentage = loyaltyService.getTierDiscountPercentage(loyalty.tier || newTier);
    loyalty.discountAmount = discountPercentage;
    
    // Update user model with current points and tier
    await User.findByIdAndUpdate(loyalty.userId, updateData);
  } catch (error) {
    console.error("UPDATE_LOYALTY_TIER_ERROR:", error);
  }
};

export const getDigitalCard = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const loyalty = await LoyaltyReward.findOne({ userId });
    if (!loyalty || !loyalty.cardIssued) {
      return res.status(404).json({ success: false, message: "No loyalty card found" });
    }
    res.json({
      success: true,
      card: {
        cardId: loyalty.cardId,
        cardType: loyalty.cardType,
        issuedDate: loyalty.cardIssuedDate,
        expiryDate: loyalty.expiryDate,
        points: loyalty.points,
        discountAmount: loyalty.discountAmount || 0,
        discountPercentage: loyalty.discountAmount || 0, // discountAmount now stores percentage
        isActive: loyalty.isActive,
      },
    });
  } catch (error) {
    console.error("GET_DIGITAL_CARD_ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Legacy endpoints (optional)
export const getLoyaltyInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("loyaltyPoints loyaltyTier loyaltyHistory");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Error fetching loyalty info" });
  }
};

export const redeemReward = async (req, res) => {
  try {
    const { rewardName } = req.body;
    const userId = req.user?.userId || req.user?.id;
    
    if (!rewardName) {
      return res.status(400).json({ success: false, message: "rewardName is required" });
    }
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const loyalty = await LoyaltyReward.findOne({ userId });
    if (!loyalty) {
      return res.status(404).json({ success: false, message: "Loyalty record not found" });
    }

    // Use loyalty service to check if reward can be redeemed
    const redemptionCheck = loyaltyService.canRedeemReward(loyalty.points, rewardName);
    if (!redemptionCheck.canRedeem) {
      return res.status(400).json({ 
        success: false, 
        message: redemptionCheck.error || "Cannot redeem reward",
        pointsNeeded: redemptionCheck.pointsNeeded
      });
    }

    const reward = redemptionCheck.reward;
    
    // Validate points transaction
    const validation = loyaltyService.validatePointsTransaction(loyalty.points, reward.cost);
    if (!validation.valid) {
      return res.status(400).json({ 
        success: false, 
        message: validation.error,
        shortfall: validation.shortfall
      });
    }

    // Deduct points and add to history
    loyalty.points = validation.remainingPoints;
    loyalty.pointsHistory.push({
      points: -reward.cost,
      source: "reward_redeemed",
      rewardName: rewardName,
      createdAt: new Date(),
    });

    await loyalty.save();

    res.json({ 
      success: true,
      message: `Reward redeemed: ${reward.description}`,
      remainingPoints: loyalty.points
    });
  } catch (err) {
    console.error("REDEEM_REWARD_ERROR:", err);
    res.status(500).json({ success: false, message: "Error redeeming reward" });
  }
};

// Test endpoint to add points for testing
export const addTestPoints = async (req, res) => {
  try {
    // Use authenticated user ID or default test user ID
    const userId = req.user?.userId || req.user?.id || "675a7b8b123456789abcdef0";
    const { points } = req.body;

    let loyalty = await LoyaltyReward.findOne({ userId });
    if (!loyalty) {
      loyalty = new LoyaltyReward({ userId });
    }

    const pointsToAdd = Number(points) || 100;
    loyalty.points = (loyalty.points || 0) + pointsToAdd;
    loyalty.pointsHistory.push({
      points: pointsToAdd,
      source: "test_points",
      createdAt: new Date(),
    });

    await loyalty.save();

    res.json({ 
      success: true,
      message: `Added ${pointsToAdd} test points`,
      totalPoints: loyalty.points
    });
  } catch (err) {
    console.error("ADD_TEST_POINTS_ERROR:", err);
    res.status(500).json({ success: false, message: "Error adding test points" });
  }
};

// Get available rewards
export const getAvailableRewards = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const loyalty = await LoyaltyReward.findOne({ userId });
    const currentPoints = loyalty?.points || 0;

    // Use loyalty service to get available rewards
    const availableRewards = loyaltyService.getAvailableRewards(currentPoints);

    res.json({
      success: true,
      rewards: availableRewards,
      currentPoints,
      tier: loyalty?.tier || loyaltyService.getTier(currentPoints),
      tierBenefits: loyaltyService.getTierBenefits(loyalty?.tier || loyaltyService.getTier(currentPoints))
    });
  } catch (error) {
    console.error("GET_AVAILABLE_REWARDS_ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get loyalty statistics (admin function)
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
    
    const recentRedemptions = await LoyaltyReward.aggregate([
      { $unwind: "$pointsHistory" },
      { $match: { "pointsHistory.source": "reward_redeemed" } },
      { $sort: { "pointsHistory.createdAt": -1 } },
      { $limit: 10 },
      { $project: {
        userId: 1,
        rewardName: "$pointsHistory.rewardName",
        points: "$pointsHistory.points",
        redeemedAt: "$pointsHistory.createdAt"
      }}
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        loyaltyUsers,
        activeCards,
        participationRate: totalUsers > 0 ? ((loyaltyUsers / totalUsers) * 100).toFixed(2) : 0,
        tierDistribution: tierStats,
        totalPointsIssued: totalPointsIssued[0]?.total || 0,
        recentRedemptions
      }
    });
  } catch (error) {
    console.error("GET_LOYALTY_STATS_ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get redemption history
export const getRedemptionHistory = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const loyalty = await LoyaltyReward.findOne({ userId });
    if (!loyalty) {
      return res.status(404).json({ success: false, message: "Loyalty record not found" });
    }

    const redemptions = loyalty.pointsHistory
      .filter(entry => entry.source === "reward_redeemed")
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(entry => ({
        rewardName: entry.rewardName,
        points: Math.abs(entry.points),
        redeemedAt: entry.createdAt,
        description: rewards.find(r => r.name === entry.rewardName)?.description || "Unknown reward"
      }));

    res.json({
      success: true,
      redemptions
    });
  } catch (error) {
    console.error("GET_REDEMPTION_HISTORY_ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add loyalty points (admin function)
export const addLoyaltyPoints = async (req, res) => {
  try {
    const { userId, points, reason } = req.body;
    
    if (!userId || !points) {
      return res.status(400).json({ 
        success: false, 
        message: "userId and points are required" 
      });
    }

    const pointsToAdd = Number(points);
    if (!Number.isFinite(pointsToAdd) || pointsToAdd <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Points must be a positive number" 
      });
    }

    let loyalty = await LoyaltyReward.findOne({ userId });
    if (!loyalty) {
      loyalty = new LoyaltyReward({ userId });
    }

    loyalty.points = (loyalty.points || 0) + pointsToAdd;
    loyalty.pointsHistory.push({
      points: pointsToAdd,
      source: "admin_adjustment",
      reason: reason || "Manual adjustment by admin",
      createdAt: new Date(),
    });

    // Update tier based on new points
    await updateLoyaltyTier(loyalty);
    await loyalty.save();

    res.json({
      success: true,
      message: `Added ${pointsToAdd} points to user`,
      newTotal: loyalty.points,
      tier: loyalty.tier
    });
  } catch (error) {
    console.error("ADD_LOYALTY_POINTS_ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
