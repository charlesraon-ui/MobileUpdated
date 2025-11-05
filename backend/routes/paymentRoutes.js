// backend/routes/paymentRoutes.js
import { Router } from "express";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import { sendPush } from "../controllers/notificationController.js";
import { updateLoyaltyAfterPurchase } from "../controllers/loyaltyController.js";
import { redeemPromoOnOrder } from "../controllers/promoController.js";

const router = Router();

/* Success redirect - handles both web and mobile app redirects */
router.get("/success", async (req, res) => {
  try {
    const { orderId } = req.query;
    const successUrlBase = process.env.FRONTEND_SUCCESS_URL || 'goagritrading://payment/success';
    
    if (!orderId) {
      console.log("❌ No orderId in success callback");
      return res.redirect(successUrlBase);
    }

    const order = await Order.findById(orderId);
    if (!order) {
      console.log("❌ Order not found:", orderId);
      return res.redirect(`goagritrading://payment/cancel?orderId=${orderId}`);
    }

    // Update order status
    order.status = "confirmed";
    order.paymentStatus = "paid";
    order.paidAt = new Date();
    await order.save();

    // Award loyalty points upon payment confirmation (e-payment success)
    try {
      await updateLoyaltyAfterPurchase(order.userId, order.total, order._id);
    } catch (e) {
      console.warn("LOYALTY_UPDATE_ON_PAYMENT_SUCCESS_ERROR:", e?.message || e);
    }

    // Redeem promo code if used
    if (order.promoCode && order.promoCode.code) {
      try {
        await redeemPromoOnOrder(order.promoCode.code, order.userId, order._id);
        console.log(`✅ Promo code ${order.promoCode.code} redeemed for order ${order._id}`);
      } catch (e) {
        console.warn("PROMO_REDEMPTION_ON_PAYMENT_SUCCESS_ERROR:", e?.message || e);
      }
    }

    // Clear cart
    await Cart.deleteOne({ userId: order.userId });

    console.log("✅ Payment success for order:", orderId);

    // Send push notification if user has token
    try {
      const user = await User.findById(order.userId).lean();
      if (user?.pushToken) {
        await sendPush({
          to: user.pushToken,
          title: "Payment Successful",
          body: `Order #${order._id} placed successfully`,
          data: { orderId: String(order._id) },
        });
      }
    } catch (e) {
      console.warn("push send failed:", e?.message);
    }
    
    // ✅ Redirect to app deep link or configured URL
    const successUrl = `${successUrlBase}${successUrlBase.includes('?') ? '&' : '?'}orderId=${orderId}`;
    res.redirect(successUrl);
    
  } catch (err) {
    console.error("PAYMENT_SUCCESS_ERROR:", err);
    const failedUrlBase = process.env.FRONTEND_FAILED_URL || 'goagritrading://payment/cancel';
    res.redirect(failedUrlBase);
  }
});

/* Cancel redirect - handles payment cancellation */
router.get("/cancel", async (req, res) => {
  try {
    const { orderId } = req.query;
    const failedUrlBase = process.env.FRONTEND_FAILED_URL || 'goagritrading://payment/cancel';
    
    if (orderId) {
      const order = await Order.findById(orderId);
      if (order && order.status === "pending_payment") {
        order.status = "cancelled";
        await order.save();
      }
    }

    console.log("❌ Payment cancelled for order:", orderId);
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Cancelled</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <script>
          window.location.href = '${failedUrlBase}${failedUrlBase.includes('?') ? '&' : '?'}orderId=${orderId || ''}';
          
          setTimeout(function() {
            document.getElementById('message').style.display = 'block';
          }, 2000);
        </script>
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
          .icon { font-size: 4rem; margin-bottom: 1rem; }
          h1 { 
            color: #EF4444; 
            margin-bottom: 0.5rem; 
            font-size: 1.8rem;
          }
          p { 
            color: #6B7280;
            margin: 0.5rem 0;
            font-size: 1rem;
          }
          #message { 
            display: none; 
            margin-top: 1rem;
            font-size: 0.9rem;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">❌</div>
          <h1>Payment Cancelled</h1>
          <p>Your payment was not completed</p>
          <div id="message">
            <p>Redirecting back to app...</p>
          </div>
        </div>
      </body>
      </html>
    `);
    
  } catch (err) {
    console.error("PAYMENT_CANCEL_ERROR:", err);
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <script>
          window.location.href = '${process.env.FRONTEND_FAILED_URL || 'goagritrading://payment/cancel'}';
        </script>
      </head>
      <body style="font-family: sans-serif; text-align: center; padding: 50px;">
        <p>Redirecting...</p>
      </body>
      </html>
    `);
  }
});

/* Webhook - PayMongo server-to-server notifications */
router.post("/webhook", async (req, res) => {
  try {
    const event = req.body.data;
    console.log("🔔 PayMongo webhook:", event?.attributes?.type);

    // Handle both checkout session and direct payment events
    if (event?.attributes?.type === "checkout_session.payment.paid" || 
        event?.attributes?.type === "payment.paid") {
      const sessionId = event.attributes.data.id;
      const order = await Order.findOne({ paymongoSessionId: sessionId });
      
      if (!order) {
        console.warn("⚠️ Order not found for session:", sessionId);
        return res.json({ received: true });
      }

      order.status = "confirmed";
      order.paymentStatus = "paid";
      order.paidAt = new Date();
      order.paymongoPaymentId = event.attributes.data.attributes.payments?.[0]?.id;
      await order.save();

      await Cart.deleteOne({ userId: order.userId });
      console.log("✅ Payment confirmed via webhook for order:", order._id);
    }

    res.json({ received: true });
  } catch (err) {
    console.error("WEBHOOK_ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* Verify order payment status - used by mobile app to check status */
router.get("/verify/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }

    res.json({
      success: true,
      orderId: order._id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      isPaid: order.status === "confirmed" && order.paymentStatus === "paid",
      paidAt: order.paidAt || null
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
});

export default router;