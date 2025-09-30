import { Router } from "express";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";

const router = Router();

/* Success redirect */
router.get("/success", async (req, res) => {
  try {
    const { orderId } = req.query;
    
    if (!orderId) {
      return res.redirect('exp://payment-failed'); // or your app scheme
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.redirect('exp://payment-failed');
    }

    // Update order status
    order.status = "confirmed";
    order.paymentStatus = "paid";
    await order.save();

    console.log("✅ Payment success for order:", orderId);
    
    // Redirect to mobile app with deep link
    res.redirect(`exp://payment-success?orderId=${orderId}`);
    
  } catch (err) {
    console.error("PAYMENT_SUCCESS_ERROR:", err);
    res.redirect('exp://payment-failed');
  }
});

/* Cancel redirect */
router.get("/cancel", async (req, res) => {
  try {
    const { orderId } = req.query;
    
    if (orderId) {
      const order = await Order.findById(orderId);
      if (order) {
        order.status = "payment_cancelled";
        await order.save();
      }
    }

    console.log("❌ Payment cancelled for order:", orderId);
    res.redirect(`${process.env.FRONTEND_FAILED_URL}?orderId=${orderId}`);
    
  } catch (err) {
    console.error("PAYMENT_CANCEL_ERROR:", err);
    res.redirect(process.env.FRONTEND_FAILED_URL);
  }
});

/* Webhook */
router.post("/webhook", async (req, res) => {
  try {
    const event = req.body.data;
    console.log("🔔 PayMongo webhook:", event.attributes.type);

    if (event.attributes.type === "checkout_session.payment.paid") {
      const sessionId = event.attributes.data.id;
      const order = await Order.findOne({ paymongoSessionId: sessionId });
      
      if (!order) {
        console.warn("⚠️ Order not found for session:", sessionId);
        return res.json({ received: true });
      }

      order.status = "confirmed";
      order.paymongoPaymentId = event.attributes.data.attributes.payments?.[0]?.id;
      await order.save();

      await Cart.deleteOne({ userId: order.userId });
      console.log("✅ Payment confirmed for order:", order._id);
    }

    res.json({ received: true });
  } catch (err) {
    console.error("WEBHOOK_ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* Verify status */
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
      isPaid: order.status === "confirmed"
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: err.message 
    });
  }
});

export default router;