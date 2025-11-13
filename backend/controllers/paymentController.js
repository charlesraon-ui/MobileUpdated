// backend/controllers/paymentController.js
import axios from "axios";
import Cart from "../models/Cart.js";
import Delivery from "../models/Delivery.js";
import Order from "../models/Order.js";
import { updateLoyaltyAfterPurchase } from "./loyaltyController.js";

const PAYMONGO_SECRET = process.env.PAYMONGO_SECRET_KEY;
const PAYMONGO_API = "https://api.paymongo.com/v1";
const API_URL = process.env.API_URL || "http://localhost:5000";

const getPayMongoAuth = () => {
  const auth = Buffer.from(PAYMONGO_SECRET + ":").toString("base64");
  return {
    Authorization: `Basic ${auth}`,
    "Content-Type": "application/json",
    "Accept": "application/json",
  };
};

export const createSource = async (req, res) => {
  try {
    const { amount, type, userId, orderId } = req.body;

    if (!amount || !type || !orderId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: amount, type, orderId",
      });
    }

    if (!PAYMONGO_SECRET || !PAYMONGO_SECRET.startsWith('sk_')) {
      console.error("❌ PAYMONGO_SECRET_KEY is not set or invalid");
      return res.status(500).json({
        success: false,
        message: "Payment gateway not configured. Please add PayMongo keys to .env file.",
      });
    }

    console.log("💳 Creating PayMongo source:", { amount, type, userId, orderId });

    const amountInCentavos = Math.round(amount * 100);

    const response = await axios.post(
      `${PAYMONGO_API}/sources`,
      {
        data: {
          attributes: {
            amount: amountInCentavos,
            type, // "gcash" or "paymaya"
            currency: "PHP",
            redirect: {
              success: `${API_URL}/payment/success?orderId=${orderId}`,
              failed: `${API_URL}/payment/failed?orderId=${orderId}`,
            },
            metadata: {
              userId: String(userId || ""),
              orderId: String(orderId),
            },
          },
        },
      },
      { headers: getPayMongoAuth() }
    );

    const source = response.data.data;
    console.log("✅ PayMongo source created:", source.id);
    console.log("🔗 Checkout URL:", source.attributes.redirect.checkout_url);

    await Order.findByIdAndUpdate(orderId, {
      paymentSourceId: source.id,
      paymentStatus: "pending",
    });

    res.json({
      success: true,
      source: source,
      checkoutUrl: source.attributes.redirect.checkout_url,
    });
  } catch (error) {
    console.error("❌ PayMongo Source Error:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: error.response?.data?.errors?.[0]?.detail || "Source creation failed",
      details: error.response?.data,
    });
  }
};

/**
 * Create order with GCash payment - COMPLETE FLOW
 * POST /api/payment/gcash/order
 */
export async function createGCashOrder(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { items, total, address, gcashNumber, deliveryType, taxAmount } = req.body;

    console.log("📱 Creating GCash order:", { userId, total, itemCount: items?.length });

    // Validate
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }
    if (!total || total <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }
    if (!address) {
      return res.status(400).json({ success: false, message: "Address is required" });
    }
    if (!PAYMONGO_SECRET || !PAYMONGO_SECRET.startsWith('sk_')) {
      console.error("❌ PAYMONGO_SECRET_KEY not configured");
      return res.status(500).json({ 
        success: false, 
        message: "Payment system not configured. Please contact support." 
      });
    }

    // 1. Create order (pending payment)
    const order = await Order.create({
      userId: String(userId),
      items,
      tax: Number.isFinite(Number(taxAmount)) ? Math.round(Number(taxAmount) * 100) / 100 : undefined,
      total,
      address,
      paymentMethod: "GCash",
      gcashNumber,
      status: "confirmed", // auto-confirm e-payment
      paymentStatus: "pending",
    });

    console.log("✅ Order created:", order._id);
    // Award loyalty points immediately upon e-payment order creation
    try {
      await updateLoyaltyAfterPurchase(order.userId, order.total, order._id);
    } catch (e) {
      console.warn("LOYALTY_UPDATE_ON_CREATE_ERROR:", e?.message || e);
    }

    // 2. Create delivery record
    await Delivery.create({
      order: order._id,
      type: deliveryType || "in-house",
      deliveryAddress: address,
      status: "pending",
    });

    console.log("✅ Delivery record created");

    // 3. Create PayMongo GCash source
    const amountInCentavos = Math.round(total * 100);
    const orderId = String(order._id);

    console.log("💳 Creating PayMongo source:", amountInCentavos, "centavos");

    const paymongoResponse = await axios.post(
      `${PAYMONGO_API}/sources`,
      {
        data: {
          attributes: {
            amount: amountInCentavos,
            type: "gcash",
            currency: "PHP",
            redirect: {
              success: `${API_URL}/payment/success?orderId=${orderId}`,
              failed: `${API_URL}/payment/failed?orderId=${orderId}`,
            },
            metadata: {
              orderId: orderId,
              userId: String(userId),
            },
          },
        },
      },
      { headers: getPayMongoAuth() }
    );

    const source = paymongoResponse.data.data;
    const checkoutUrl = source.attributes.redirect.checkout_url;

    console.log("✅ PayMongo source created:", source.id);
    console.log("🔗 Checkout URL:", checkoutUrl);

    // 4. Store source ID in order
    order.paymentSourceId = source.id;
    await order.save();

    // 5. Clear user's cart
    await Cart.deleteOne({ userId: String(userId) });

    console.log("🎉 Order ready for payment. OrderID:", orderId);

    res.status(201).json({
      success: true,
      order: {
        id: order._id,
        total: order.total,
        status: order.status,
      },
      payment: {
        checkoutUrl,
        sourceId: source.id,
      },
    });
  } catch (error) {
    console.error("❌ Create GCash order error:", error.response?.data || error.message);

    res.status(500).json({
      success: false,
      message: "Failed to create payment",
      error: error.response?.data?.errors?.[0]?.detail || error.message,
      details: process.env.NODE_ENV === 'development' ? error.response?.data : undefined,
    });
  }
}

/**
 * Check payment status
 * GET /api/payment/status/:sourceId
 */
export async function checkPaymentStatus(req, res) {
  try {
    const { sourceId } = req.params;

    console.log("🔍 Checking payment status:", sourceId);

    const response = await axios.get(`${PAYMONGO_API}/sources/${sourceId}`, {
      headers: getPayMongoAuth(),
    });

    const source = response.data.data;
    const status = source.attributes.status;

    console.log("✅ Payment status:", status);

    // Update order if payment is successful
    if (status === "chargeable" || status === "paid") {
      const order = await Order.findOne({ paymentSourceId: sourceId });
      if (order && order.paymentStatus !== "paid") {
        order.paymentStatus = "paid";
        order.status = "confirmed";
        order.paidAt = new Date();
        await order.save();
        console.log("✅ Order updated to paid:", order._id);
      }
    }

    res.json({
      success: true,
      status,
      paid: status === "chargeable" || status === "paid",
    });
  } catch (error) {
    console.error("❌ Check status error:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: "Failed to check payment status",
    });
  }
}

/**
 * Handle payment success redirect
 * GET /payment/success?orderId=xxx
 */
export async function handlePaymentSuccess(req, res) {
  try {
    const { orderId } = req.query;

    console.log("✅ Payment success for order:", orderId);

    // Update order
    const order = await Order.findById(orderId);
    if (order) {
      order.paymentStatus = "paid";
      order.status = "confirmed";
      order.paidAt = new Date();
      await order.save();
      console.log("✅ Order confirmed:", orderId);
    }

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Successful</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
          }
          .container {
            text-align: center;
            background: white;
            padding: 3rem 2rem;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 400px;
            width: 100%;
          }
          .success-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
            animation: bounce 0.6s ease;
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
          }
          h1 {
            color: #10B981;
            margin-bottom: 0.5rem;
            font-size: 1.8rem;
          }
          p { color: #6B7280; margin-bottom: 1rem; font-size: 1rem; }
          .order-info {
            background: #F3F4F6;
            padding: 1rem;
            border-radius: 10px;
            margin: 1.5rem 0;
          }
          .order-id {
            font-weight: 700;
            color: #111827;
            font-size: 1.1rem;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success-icon">✅</div>
          <h1>Payment Successful!</h1>
          <p>Your order has been confirmed and is being processed.</p>
          <div class="order-info">
            <div class="order-id">Order #${String(orderId).slice(-8).toUpperCase()}</div>
          </div>
          <p style="font-size: 0.9rem; color: #9CA3AF;">You can close this page now.</p>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error("❌ Payment success handler error:", error);
    res.status(500).send(`
      <html><body style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h1 style="color: #EF4444;">Error</h1>
        <p>There was an error processing your payment confirmation.</p>
      </body></html>
    `);
  }
}

/**
 * Handle payment failure redirect
 * GET /payment/failed?orderId=xxx
 */
export async function handlePaymentFailed(req, res) {
  try {
    const { orderId } = req.query;

    console.log("❌ Payment failed for order:", orderId);

    // Update order
    const order = await Order.findById(orderId);
    if (order) {
      order.paymentStatus = "failed";
      order.status = "cancelled";
      await order.save();
      console.log("❌ Order cancelled:", orderId);
    }

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Failed</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            padding: 20px;
          }
          .container {
            text-align: center;
            background: white;
            padding: 3rem 2rem;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 400px;
            width: 100%;
          }
          .error-icon { font-size: 4rem; margin-bottom: 1rem; }
          h1 { color: #EF4444; margin-bottom: 0.5rem; font-size: 1.8rem; }
          p { color: #6B7280; margin-bottom: 1.5rem; font-size: 1rem; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="error-icon">❌</div>
          <h1>Payment Failed</h1>
          <p>Your payment could not be processed.</p>
          <p style="font-size: 0.9rem;">Please try again or contact support if the problem persists.</p>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error("❌ Payment failed handler error:", error);
    res.status(500).send(`
      <html><body style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h1 style="color: #EF4444;">Error</h1>
        <p>There was an error processing your payment failure.</p>
      </body></html>
    `);
  }
}

/**
 * Webhook handler for PayMongo events
 * POST /api/payment/webhook
 */
export const handleWebhook = async (req, res) => {
  try {
    const event = req.body.data;

    console.log("🔔 PayMongo Webhook received:", event?.attributes?.type);

    switch (event?.attributes?.type) {
      case "payment.paid":
        const paymentIntent = event.attributes.data;
        const metadata = paymentIntent.attributes.metadata;
        console.log("✅ Payment successful webhook:", metadata);
        
        if (metadata?.orderId) {
          await Order.findByIdAndUpdate(metadata.orderId, {
            paymentStatus: "paid",
            status: "confirmed",
            paidAt: new Date(),
          });
          console.log("✅ Order updated via webhook:", metadata.orderId);
        }
        break;

      case "payment.failed":
        console.log("❌ Payment failed webhook");
        break;

      case "source.chargeable":
        const sourceId = event.attributes.data.id;
        const sourceAmount = event.attributes.data.attributes.amount;
        console.log("💰 Source chargeable:", sourceId);
        
        await createPaymentFromSource(sourceId, sourceAmount);
        break;
    }

    res.json({ success: true });
  } catch (error) {
    console.error("❌ Webhook Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Helper: Create payment from chargeable source
 */
const createPaymentFromSource = async (sourceId, amount) => {
  try {
    console.log("💳 Creating payment from source:", sourceId);

    const response = await axios.post(
      `${PAYMONGO_API}/payments`,
      {
        data: {
          attributes: {
            amount: amount,
            source: { id: sourceId, type: "source" },
            currency: "PHP",
            description: "Order Payment",
          },
        },
      },
      { headers: getPayMongoAuth() }
    );

    console.log("✅ Payment created from source:", response.data.data.id);
    
    const source = await axios.get(`${PAYMONGO_API}/sources/${sourceId}`, {
      headers: getPayMongoAuth(),
    });
    
    const orderId = source.data.data.attributes.metadata?.orderId;
    if (orderId) {
      await Order.findByIdAndUpdate(orderId, {
        paymentStatus: "paid",
        status: "confirmed",
        paidAt: new Date(),
      });
      console.log("✅ Order updated from webhook:", orderId);

      // Award loyalty points upon payment confirmation via webhook
      try {
        const order = await Order.findById(orderId).lean();
        if (order) {
          await updateLoyaltyAfterPurchase(order.userId, order.total, order._id);
        }
      } catch (e) {
        console.warn("LOYALTY_UPDATE_ON_WEBHOOK_ERROR:", e?.message || e);
      }
    }
    
    return response.data;
  } catch (error) {
    console.error("❌ Payment from source error:", error.response?.data);
    throw error;
  }
};