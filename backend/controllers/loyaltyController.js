import LoyaltyReward from "../models/LoyaltyReward.js";
import Order from "../models/Order.js";
import LoyaltyTier from "../models/LoyaltyTier.js";
import User from "../models/User.js";
import { rewards } from "../config/loyaltyConfig.js";

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
        discountPercentage: loyalty.discountPercentage,
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
    await loyalty.save();

    res.json({
      success: true,
      message: "Loyalty card issued successfully",
      card: {
        cardId: loyalty.cardId,
        cardType: loyalty.cardType,
        discountPercentage: loyalty.discountPercentage,
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

    const pointsEarned = Math.floor(validAmount / 100);
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
    const tiers = await LoyaltyTier.find({ isActive: true }).sort({ pointThreshold: 1 });
    if (!tiers || tiers.length === 0) return;
    let userTier = "";
    for (const tier of tiers) {
      if (loyalty.points >= tier.pointThreshold) userTier = tier.name; else break;
    }
    if (userTier && userTier !== loyalty.tier) loyalty.tier = userTier;
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
        discountPercentage: loyalty.discountPercentage,
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

    const reward = rewards.find((r) => r.name === rewardName);
    if (!reward) {
      return res.status(400).json({ success: false, message: "Invalid reward" });
    }

    const currentPoints = Number(loyalty.points) || 0;
    if (currentPoints < reward.cost) {
      return res.status(400).json({ 
        success: false, 
        message: "Not enough points",
        required: reward.cost,
        available: currentPoints
      });
    }

    // Deduct points and add to history
    loyalty.points = currentPoints - reward.cost;
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
      reward: {
        name: rewardName,
        description: reward.description,
        cost: reward.cost
      },
      remainingPoints: loyalty.points
    });
  } catch (err) {
    console.error("REDEEM_REWARD_ERROR:", err);
    res.status(500).json({ success: false, message: "Error redeeming reward" });
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

    const availableRewards = rewards.map(reward => ({
      ...reward,
      canRedeem: currentPoints >= reward.cost,
      pointsNeeded: Math.max(0, reward.cost - currentPoints)
    }));

    res.json({
      success: true,
      rewards: availableRewards,
      currentPoints
    });
  } catch (error) {
    console.error("GET_AVAILABLE_REWARDS_ERROR:", error);
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
