// backend/routes/paymentRoutes.js
import { Router } from "express";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";

const router = Router();

/* Success redirect - handles both web and mobile app redirects */
router.get("/success", async (req, res) => {
  try {
    const { orderId } = req.query;
    
    if (!orderId) {
      console.log("❌ No orderId in success callback");
      // Return HTML with deep link redirect
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Payment Processed</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <script>
            window.location.href = 'goagritrading://payment/success';
          </script>
        </head>
        <body style="font-family: sans-serif; text-align: center; padding: 50px;">
          <p>Redirecting back to app...</p>
        </body>
        </html>
      `);
    }

    const order = await Order.findById(orderId);
    if (!order) {
      console.log("❌ Order not found:", orderId);
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Payment Status</title>
          <script>
            window.location.href = 'goagritrading://payment/cancel?orderId=${orderId}';
          </script>
        </head>
        <body style="font-family: sans-serif; text-align: center; padding: 50px;">
          <p>Redirecting back to app...</p>
        </body>
        </html>
      `);
    }

    // Update order status
    order.status = "confirmed";
    order.paymentStatus = "paid";
    order.paidAt = new Date();
    await order.save();

    // Clear cart
    await Cart.deleteOne({ userId: order.userId });

    console.log("✅ Payment success for order:", orderId);
    
    // Return HTML that redirects to deep link
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Successful</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <script>
          // Attempt deep link redirect
          window.location.href = 'goagritrading://payment/success?orderId=${orderId}';
          
          // Show fallback message after 2 seconds
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
          .icon { 
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
          p { 
            color: #6B7280; 
            margin: 0.5rem 0;
            font-size: 1rem;
          }
          .order-id {
            background: #F3F4F6;
            padding: 1rem;
            border-radius: 10px;
            margin: 1.5rem 0;
            font-weight: 700;
            color: #111827;
            font-size: 1.1rem;
          }
          #message { 
            display: none; 
            margin-top: 1rem;
            font-size: 0.9rem;
            color: #9CA3AF;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">✅</div>
          <h1>Payment Successful!</h1>
          <p>Your order has been confirmed</p>
          <div class="order-id">Order #${String(orderId).slice(-8).toUpperCase()}</div>
          <div id="message">
            <p>If you're not redirected automatically, please return to the app.</p>
          </div>
        </div>
      </body>
      </html>
    `);
    
  } catch (err) {
    console.error("PAYMENT_SUCCESS_ERROR:", err);
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <script>
          window.location.href = 'goagritrading://payment/cancel';
        </script>
      </head>
      <body style="font-family: sans-serif; text-align: center; padding: 50px;">
        <p>Processing payment status...</p>
      </body>
      </html>
    `);
  }
});

/* Cancel redirect - handles payment cancellation */
router.get("/cancel", async (req, res) => {
  try {
    const { orderId } = req.query;
    
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
          window.location.href = 'goagritrading://payment/cancel?orderId=${orderId || ''}';
          
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
          window.location.href = 'goagritrading://payment/cancel';
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

    if (event?.attributes?.type === "checkout_session.payment.paid") {
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