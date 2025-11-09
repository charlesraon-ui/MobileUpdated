// Updated orderController.js with inventory management
import Cart from "../models/Cart.js";
import Delivery from "../models/Delivery.js";
import Order from "../models/Order.js";
import Product from "../models/Products.js";
import User from "../models/User.js";
import { processOrderInventory } from "../utils/orderHelpers.js";
import { updateLoyaltyAfterPurchase, markRewardsAsUsed } from "./loyaltyController.js";
import { redeemPromoOnOrder } from "./promoController.js";

/* ---------------- PayMongo E-Payment (with inventory) ---------------------- */
export const createEPaymentOrder = async (req, res) => {
  try {
    const me = req.user?.userId || req.user?.id;
    if (!me) return res.status(401).json({ success: false, message: "Unauthorized" });

    const {
      items: rawItems = [],
      deliveryType = "in-house",
      address = "",
      deliveryFee: deliveryFeeInBody = 0,
      total: totalInBody,
      channel = "multi",
      promoCode = null,
      loyaltyReward = null,
    } = req.body || {};

    if (!process.env.PAYMONGO_SECRET_KEY) {
      return res.status(500).json({
        success: false,
        message: "Payment system not configured.",
      });
    }

    const toNum = (v) => {
      if (typeof v === "number") return v;
      if (typeof v === "string") {
        const cleaned = v.replace(/[, ]+/g, "");
        const n = Number(cleaned);
        return Number.isFinite(n) ? n : NaN;
      }
      return NaN;
    };

    // Normalize items and fetch weights
    const itemsWithWeights = await Promise.all(
      (Array.isArray(rawItems) ? rawItems : []).map(async (it, idx) => {
        const qty = toNum(it?.quantity ?? it?.qty ?? 1);
        let pricePeso =
          it?.price != null ? toNum(it.price)
          : it?.unitPrice != null ? toNum(it.unitPrice)
          : it?.unit_price != null ? toNum(it.unit_price)
          : it?.product?.price != null ? toNum(it.product.price)
          : it?.amount != null ? toNum(it.amount) / 100
          : NaN;

        if (!Number.isFinite(pricePeso)) {
          return { __invalid: true, __error: `items[${idx}].price missing` };
        }
        if (!Number.isFinite(qty) || qty <= 0) {
          return { __invalid: true, __error: `items[${idx}].quantity invalid` };
        }

        pricePeso = Math.round(pricePeso * 100) / 100;
        
        let weightKg = toNum(it?.weightKg ?? 0);
        const productId = it?.productId || it?.id || it?._id;
        
        if (productId && weightKg === 0) {
          try {
            const product = await Product.findById(productId).select('weightKg').lean();
            if (product?.weightKg) weightKg = Number(product.weightKg);
          } catch (err) {
            console.warn(`Failed to fetch weight for product ${productId}`);
          }
        }

        return {
          productId,
          name: it?.name || it?.productName || it?.product?.name || "Item",
          imageUrl: it?.imageUrl || it?.image || it?.product?.imageUrl || undefined,
          price: pricePeso,
          quantity: Math.floor(qty),
          weightKg: Math.round(weightKg * 100) / 100,
        };
      })
    );

    const bad = itemsWithWeights.find(x => x?.__invalid);
    if (bad) {
      return res.status(400).json({ success: false, message: bad.__error });
    }

    const items = itemsWithWeights;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty." });
    }

    const deliveryFee =
      Number.isFinite(toNum(deliveryFeeInBody)) ? toNum(deliveryFeeInBody)
      : deliveryType === "pickup" ? 0
      : deliveryType === "third-party" ? 80
      : 50;

    const subtotal = items.reduce((s, it) => s + Number(it.price) * Number(it.quantity), 0);
    const totalWeight = items.reduce((s, it) => s + Number(it.weightKg || 0) * Number(it.quantity), 0);
    
    const total = Number.isFinite(toNum(totalInBody)) && toNum(totalInBody) > 0
      ? toNum(totalInBody)
      : Math.round((subtotal + deliveryFee) * 100) / 100;

    // ⭐ CHECK INVENTORY BEFORE CREATING ORDER
   // ⭐ CHECK INVENTORY BEFORE CREATING ORDER
    try {
      for (const item of items) {
        if (!item.productId) continue;
        const product = await Product.findById(item.productId);
        if (!product) {
          return res.status(404).json({ 
            success: false, 
            message: `Product not found: ${item.name}` 
          });
        }
        // ✅ Changed from 'quantity' to 'stock'
        if (product.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`
          });
        }
      }
    } catch (err) {
      return res.status(500).json({ 
        success: false, 
        message: "Inventory check failed" 
      });
    }

    // Fetch user information for customer fields
    const user = await User.findById(me).select('name email address').lean();
    
    // Create order (inventory will decrease on payment success)
    const order = await Order.create({
      userId: String(me),
      customerName: user?.name || "",
      customerEmail: user?.email || "",
      customerPhone: user?.address || "", // Using address field as phone for now
      items,
      subtotal,
      deliveryFee,
      total,
      totalWeight: Math.round(totalWeight * 100) / 100,
      address,
      deliveryType,
      status: "pending_payment",
      paymentMethod: "E-Payment",
      promoCode: promoCode ? {
        code: promoCode.code,
        discount: promoCode.discount || 0,
        freeShipping: promoCode.freeShipping || false
      } : null,
      loyaltyReward: loyaltyReward ? {
        rewardId: loyaltyReward.rewardId,
        name: loyaltyReward.name,
        type: loyaltyReward.type,
        value: loyaltyReward.value,
        discount: loyaltyReward.discount || 0,
        freeShipping: loyaltyReward.freeShipping || false
      } : null,
    });

    await Delivery.create({
      order: order._id,
      type: deliveryType,
      deliveryAddress: address,
      status: "pending",
    });

    // PayMongo Checkout Session
    const amountInCentavos = Math.round(Number(order.total) * 100);
    const lineItems = order.items.map((item) => ({
      currency: "PHP",
      amount: Math.round(Number(item.price) * 100),
      name: item.name,
      quantity: item.quantity,
    }));

    const backendUrl = process.env.BACKEND_URL || 'https://goagritrading-backend.onrender.com';

    const paymongoResponse = await fetch("https://api.paymongo.com/v1/checkout_sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${process.env.PAYMONGO_SECRET_KEY}:`).toString("base64")}`,
        "Accept": "application/json",
      },
      body: JSON.stringify({
        data: {
          attributes: {
            send_email_receipt: false,
            show_description: true,
            show_line_items: true,
            description: `Order #${String(order._id).slice(-6).toUpperCase()}`,
            line_items: lineItems,
            payment_method_types:
              channel === "gcash" ? ["gcash"]
              : channel === "card" ? ["card"]
              : ["gcash", "grab_pay", "paymaya", "card"],
            success_url: `${backendUrl}/api/payment/success?orderId=${order._id}`,
            cancel_url: `${backendUrl}/api/payment/cancel?orderId=${order._id}`,
            reference_number: String(order._id),
            metadata: {
              userId: String(me),
              deliveryType,
              deliveryFee: String(deliveryFee),
              totalWeight: String(totalWeight),
              address,
            },
          },
        },
      }),
    });

    const paymongoData = await paymongoResponse.json();
    
    if (!paymongoResponse.ok) {
      return res.status(paymongoResponse.status).json({
        success: false,
        message: paymongoData?.errors?.[0]?.detail || "PayMongo API error",
      });
    }

    const session = paymongoData?.data;
    const checkoutUrl = session?.attributes?.checkout_url;
    
    if (!checkoutUrl) {
      return res.status(502).json({ 
        success: false, 
        message: "Missing checkout_url from PayMongo" 
      });
    }

    order.paymongoSessionId = session.id;
    await order.save();

    return res.status(201).json({
      success: true,
      payment: { checkoutUrl },
      orderId: order._id,
      sessionId: session.id,
      totalWeight: order.totalWeight,
      message: "E-Payment checkout created",
    });

  } catch (err) {
    console.error("CREATE_EPAYMENT_ORDER_ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to create payment",
    });
  }
};

/* ---------------- Create My Order (COD with inventory) ---------------------- */
export const createMyOrder = async (req, res) => {
  try {
    // Accept both shapes from auth middleware
    const me = req.user?.userId || req.user?.id;
    if (!me) return res.status(401).json({ message: "Unauthorized" });

    const {
      items: rawItems = [],
      deliveryType = "in-house",
      address = "",
      deliveryFee: deliveryFeeInBody = 0,
      total: totalInBody,
      paymentMethod = "COD",
      promoCode = null,
      loyaltyReward = null,
    } = req.body || {};

    // Normalize items and fetch weights
    const itemsWithWeights = await Promise.all(
      rawItems.map(async (it, idx) => {
        const qty = Number(it?.quantity ?? it?.qty ?? 1);
        const pricePeso =
          it?.price != null ? Number(it.price)
          : it?.amount != null ? Number(it.amount) / 100
          : NaN;

        if (!Number.isFinite(pricePeso)) {
          throw new Error(`items[${idx}].price/amount missing or invalid`);
        }
        if (!Number.isFinite(qty) || qty <= 0) {
          throw new Error(`items[${idx}].quantity must be > 0`);
        }

        let weightKg = Number(it?.weightKg ?? 0);
        const productId = it.productId || it.id || it._id;
        
        if (productId && weightKg === 0) {
          try {
            const product = await Product.findById(productId).select('weightKg').lean();
            if (product?.weightKg) weightKg = Number(product.weightKg);
          } catch (err) {
            console.warn(`Failed to fetch weight for product ${productId}`);
          }
        }

        return {
          productId,
          name: it.name || "Item",
          imageUrl: it.imageUrl || it.image,
          price: Math.round(pricePeso * 100) / 100,
          quantity: Math.floor(qty),
          weightKg: Math.round(weightKg * 100) / 100,
        };
      })
    );

    const items = itemsWithWeights;

    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const totalWeight = items.reduce((s, i) => s + (i.weightKg || 0) * i.quantity, 0);
    
    const deliveryFee =
      Number.isFinite(Number(deliveryFeeInBody)) ? Number(deliveryFeeInBody)
      : deliveryType === "pickup" ? 0
      : deliveryType === "third-party" ? 80
      : 50;

    const total = Number.isFinite(Number(totalInBody)) && Number(totalInBody) > 0
      ? Number(totalInBody)
      : Math.round((subtotal + deliveryFee) * 100) / 100;

    // ⭐ DECREASE INVENTORY
    await processOrderInventory(items);

    // Fetch user information for customer fields
    const user = await User.findById(me).select('name email address').lean();

    // Create order
    const order = await Order.create({
      userId: String(me),
      customerName: user?.name || "",
      customerEmail: user?.email || "",
      customerPhone: user?.address || "", // Using address field as phone for now
      items,
      subtotal,
      deliveryFee,
      total,
      totalWeight: Math.round(totalWeight * 100) / 100,
      address,
      deliveryType,
      status: "pending",
      paymentMethod,
      promoCode: promoCode ? {
        code: promoCode.code,
        discount: promoCode.discount || 0,
        freeShipping: promoCode.freeShipping || false
      } : null,
      loyaltyReward: loyaltyReward ? {
        rewardId: loyaltyReward.rewardId,
        name: loyaltyReward.name,
        type: loyaltyReward.type,
        value: loyaltyReward.value,
        discount: loyaltyReward.discount || 0,
        freeShipping: loyaltyReward.freeShipping || false
      } : null,
    });

    await Delivery.create({
      order: order._id,
      type: deliveryType,
      deliveryAddress: address,
      status: "pending",
    });

    await Cart.deleteOne({ userId: String(me) });

    // ⭐ Award loyalty points immediately for COD orders (similar to E-Payment)
    try {
      await updateLoyaltyAfterPurchase(order.userId, order.total, order._id);
      console.log(`✅ Loyalty points awarded for COD order ${order._id}`);
    } catch (e) {
      console.warn("LOYALTY_UPDATE_ON_COD_ORDER_ERROR:", e?.message || e);
    }

    // Redeem promo code if used
    if (promoCode && promoCode.code) {
      try {
        await redeemPromoOnOrder(promoCode.code, order.userId, order._id);
        console.log(`✅ Promo code ${promoCode.code} redeemed for COD order ${order._id}`);
      } catch (e) {
        console.warn("PROMO_REDEMPTION_ON_COD_ORDER_ERROR:", e?.message || e);
      }
    }

    const populatedOrder = await Order.findById(order._id)
      .populate("userId", "name email address loyaltyPoints loyaltyTier")
      .populate("items.productId", "name price category weightKg");

    res.status(201).json(populatedOrder);
  } catch (err) {
    console.error("CREATE_MY_ORDER_ERROR:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

/* ---------------- Admin: Update Order Status (with loyalty) ---------------------- */
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    if (!orderId || !status) {
      return res.status(400).json({ 
        success: false, 
        message: "Order ID and status are required" 
      });
    }
    
    const order = await Order.findById(orderId)
      .populate("userId", "name email address loyaltyPoints loyaltyTier");
      
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }

    const previousStatus = order.status;
    order.status = status;
    
    // ⭐ Handle inventory for payment success
    if (status === "pending" && previousStatus === "pending_payment") {
      try {
        await processOrderInventory(order.items);
        console.log(`✅ Inventory decreased for order ${orderId} on payment success`);
      } catch (invErr) {
        return res.status(400).json({
          success: false,
          message: invErr.message || "Inventory update failed"
        });
      }
    }
    
    await order.save();
    
    // ⭐ Award loyalty points on completion
    if (status === "completed") {
      await updateLoyaltyAfterPurchase(order.userId._id, order.total, order._id);
      
      // ⭐ Mark loyalty rewards as used if order had rewards applied
      if (order.loyaltyReward && order.loyaltyReward.rewardId) {
        try {
          const result = await markRewardsAsUsed(order.userId._id, [order.loyaltyReward.rewardId]);
          console.log(`✅ Loyalty reward marking result:`, result);
        } catch (error) {
          console.warn("MARK_REWARDS_AS_USED_ERROR:", error.message);
        }
      }
    }
    
    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order
    });
  } catch (err) {
    console.error("UPDATE_ORDER_STATUS_ERROR:", err);
    res.status(500).json({ 
      success: false, 
      message: err.message || "Server error" 
    });
  }
};

/* ---------------- Admin: Create Order (with inventory) ---------------------- */
export const createOrder = async (req, res) => {
  try {
    const {
      userId,
      items: rawItems = [],
      deliveryType = "in-house",
      address = "",
      deliveryFee: deliveryFeeInBody = 0,
      total: totalInBody,
      paymentMethod = "Manual",
    } = req.body || {};

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    // Normalize items
    const itemsWithWeights = await Promise.all(
      rawItems.map(async (it, idx) => {
        const qty = Number(it?.quantity ?? it?.qty ?? 1);
        const pricePeso =
          it?.price != null ? Number(it.price)
          : it?.amount != null ? Number(it.amount) / 100
          : NaN;

        if (!Number.isFinite(pricePeso)) {
          throw new Error(`items[${idx}].price/amount missing or invalid`);
        }
        if (!Number.isFinite(qty) || qty <= 0) {
          throw new Error(`items[${idx}].quantity must be > 0`);
        }

        let weightKg = Number(it?.weightKg ?? 0);
        const productId = it.productId || it.id || it._id;
        
        if (productId && weightKg === 0) {
          try {
            const product = await Product.findById(productId).select('weightKg').lean();
            if (product?.weightKg) weightKg = Number(product.weightKg);
          } catch (err) {
            console.warn(`Failed to fetch weight for product ${productId}`);
          }
        }

        return {
          productId,
          name: it.name || "Item",
          imageUrl: it.imageUrl || it.image,
          price: Math.round(pricePeso * 100) / 100,
          quantity: Math.floor(qty),
          weightKg: Math.round(weightKg * 100) / 100,
        };
      })
    );

    const items = itemsWithWeights;

    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const totalWeight = items.reduce((s, i) => s + (i.weightKg || 0) * i.quantity, 0);
    
    const deliveryFee =
      Number.isFinite(Number(deliveryFeeInBody)) ? Number(deliveryFeeInBody)
      : deliveryType === "pickup" ? 0
      : deliveryType === "third-party" ? 80
      : 50;

    const total = Number.isFinite(Number(totalInBody)) && Number(totalInBody) > 0
      ? Number(totalInBody)
      : Math.round((subtotal + deliveryFee) * 100) / 100;

    // ⭐ DECREASE INVENTORY
    await processOrderInventory(items);

    // Fetch user information for customer fields
    const user = await User.findById(userId).select('name email address').lean();

    const order = await Order.create({
      userId: String(userId),
      customerName: user?.name || "",
      customerEmail: user?.email || "",
      customerPhone: user?.address || "", // Using address field as phone for now
      items,
      subtotal,
      deliveryFee,
      total,
      totalWeight: Math.round(totalWeight * 100) / 100,
      address,
      deliveryType,
      status: "pending",
      paymentMethod,
    });

    await Delivery.create({
      order: order._id,
      type: deliveryType,
      deliveryAddress: address,
      status: "pending",
    });

    await Cart.deleteOne({ userId: String(userId) });

    const populatedOrder = await Order.findById(order._id)
      .populate("userId", "name email address loyaltyPoints loyaltyTier")
      .populate("items.productId", "name price category weightKg");

    res.status(201).json(populatedOrder);
  } catch (err) {
    console.error("CREATE_ORDER_ERROR:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

/* ---------------- List Orders by userId (public/admin) ---------------------- */
export const getOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const orders = await Order.find({ userId: String(userId) })
      .sort({ createdAt: -1 })
      .populate("items.productId", "name price category weightKg")
      .lean();

    res.json(orders || []);
  } catch (err) {
    console.error("GET_ORDERS_ERROR:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

/* ---------------- List Orders for current user (protected) ------------------ */
export const getMyOrders = async (req, res) => {
  try {
    const me = req.user?.userId || req.user?.id;
    if (!me) return res.status(401).json({ message: "Unauthorized" });

    const orders = await Order.find({ userId: String(me) })
      .sort({ createdAt: -1 })
      .populate("items.productId", "name price category weightKg")
      .lean();

    res.json(orders || []);
  } catch (err) {
    console.error("GET_MY_ORDERS_ERROR:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};