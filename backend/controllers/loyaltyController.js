// controllers/loyaltyController.js
import LoyaltyReward from "../models/LoyaltyReward.js";
import Order from "../models/Order.js";
import LoyaltyTier from "../models/LoyaltyTier.js";

// Get loyalty status for a user
export const getLoyaltyStatus = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Find or create loyalty record
    let loyalty = await LoyaltyReward.findOne({ userId });
    
    if (!loyalty) {
      // Calculate totals from order history
      const orders = await Order.find({ userId, status: "completed" });
      const purchaseCount = orders.length;
      const totalSpent = orders.reduce((sum, order) => sum + (order.total || 0), 0);
      
      // Create new loyalty record
      loyalty = new LoyaltyReward({
        userId,
        purchaseCount,
        totalSpent
      });
      
      // Check eligibility based on criteria
      loyalty.checkEligibility();
      await loyalty.save();
    }

    // Get criteria for display
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
        criteria: {
          purchaseCount: criteria.PURCHASE_COUNT,
          totalSpent: criteria.TOTAL_SPENT
        }
      }
    });
  } catch (error) {
    console.error("GET_LOYALTY_STATUS_ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Issue a loyalty card to eligible user
export const issueLoyaltyCard = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Find loyalty record
    let loyalty = await LoyaltyReward.findOne({ userId });
    
    if (!loyalty) {
      return res.status(404).json({ 
        success: false, 
        message: "Loyalty record not found" 
      });
    }

    // Check eligibility
    if (!loyalty.isEligible) {
      return res.status(400).json({ 
        success: false, 
        message: "Not eligible for loyalty card yet" 
      });
    }

    // Issue card if eligible
    const issued = loyalty.issueCard();
    
    if (!issued) {
      return res.status(400).json({ 
        success: false, 
        message: "Failed to issue loyalty card" 
      });
    }

    await loyalty.save();

    res.json({
      success: true,
      message: "Loyalty card issued successfully",
      card: {
        cardId: loyalty.cardId,
        cardType: loyalty.cardType,
        discountPercentage: loyalty.discountPercentage,
        expiryDate: loyalty.expiryDate
      }
    });
  } catch (error) {
    console.error("ISSUE_LOYALTY_CARD_ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update loyalty status after purchase
export const updateLoyaltyAfterPurchase = async (userId, amount, orderId) => {
  try {
    if (!userId || !amount) return;
    
    // Find or create loyalty record
    let loyalty = await LoyaltyReward.findOne({ userId });
    
    if (!loyalty) {
      loyalty = new LoyaltyReward({ userId });
    }
    
    // Prevent double-award for the same order
    if (orderId) {
      const alreadyRecorded = Array.isArray(loyalty.pointsHistory)
        && loyalty.pointsHistory.some((h) => String(h.orderId) === String(orderId));
      if (alreadyRecorded) {
        return loyalty;
      }
    }
    
    // Update purchase count and total spent
    loyalty.purchaseCount += 1;
    loyalty.totalSpent += amount;
    
    // Calculate points (1 point per 100 pesos spent)
    const pointsEarned = Math.floor(amount / 100);
    loyalty.points += pointsEarned;
    
    // Add to points history
    if (pointsEarned > 0) {
      loyalty.pointsHistory.push({
        points: pointsEarned,
        source: "order_created",
        orderId: orderId,
        createdAt: new Date()
      });
    }
    
    // Check eligibility
    loyalty.checkEligibility();
    
    // Update tier based on points
    await updateLoyaltyTier(loyalty);
    
    await loyalty.save();
    
    return loyalty;
  } catch (error) {
    console.error("UPDATE_LOYALTY_ERROR:", error);
    return null;
  }
};

// Helper function to update loyalty tier based on points
const updateLoyaltyTier = async (loyalty) => {
  try {
    // Get all tiers sorted by point threshold
    const tiers = await LoyaltyTier.find({ isActive: true }).sort({ pointThreshold: 1 });
    
    if (!tiers || tiers.length === 0) return;
    
    // Find the highest tier the user qualifies for
    let userTier = "";
    for (const tier of tiers) {
      if (loyalty.points >= tier.pointThreshold) {
        userTier = tier.name;
      } else {
        break;
      }
    }
    
    // Update user's tier
    if (userTier && userTier !== loyalty.tier) {
      loyalty.tier = userTier;
    }
  } catch (error) {
    console.error("UPDATE_LOYALTY_TIER_ERROR:", error);
  }
};

// Get digital loyalty card details
export const getDigitalCard = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Find loyalty record
    const loyalty = await LoyaltyReward.findOne({ userId });
    
    if (!loyalty || !loyalty.cardIssued) {
      return res.status(404).json({ 
        success: false, 
        message: "No loyalty card found" 
      });
    }

    res.json({
      success: true,
      card: {
        cardId: loyalty.cardId,
        cardType: loyalty.cardType,
        issuedDate: loyalty.cardIssuedDate,
        expiryDate: loyalty.expiryDate,
        discountPercentage: loyalty.discountPercentage,
        isActive: loyalty.isActive
      }
    });
  } catch (error) {
    console.error("GET_DIGITAL_CARD_ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};