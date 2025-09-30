import crypto from "crypto";
import Order from "../models/Order.js";

/**
 * Verify PayMongo webhook signature
 */
function verifyWebhookSignature(payload, signature) {
  const hash = crypto
    .createHmac("sha256", process.env.PAYMONGO_WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest("hex");
  
  return hash === signature;
}

/**
 * Handle PayMongo webhooks
 * POST /api/webhooks/paymongo
 */
export async function handlePayMongoWebhook(req, res) {
  try {
    const signature = req.headers["paymongo-signature"];
    const payload = req.body;

    // Verify signature (optional but recommended)
    // if (!verifyWebhookSignature(payload, signature)) {
    //   return res.status(401).json({ error: "Invalid signature" });
    // }

    const event = payload.data.attributes;
    const eventType = event.type;

    console.log("Webhook received:", eventType);

    if (eventType === "source.chargeable") {
      // GCash payment authorized
      const sourceId = event.data.id;
      
      // Find order by source ID
      const order = await Order.findOne({ paymentSourceId: sourceId });
      
      if (order) {
        order.paymentStatus = "chargeable";
        order.status = "confirmed";
        await order.save();
        
        console.log("Order updated:", order._id);
      }
    }

    if (eventType === "payment.paid") {
      // Payment successful
      const payment = event.data;
      const orderId = payment.attributes.description?.match(/#(\w+)/)?.[1];
      
      if (orderId) {
        await Order.findByIdAndUpdate(orderId, {
          paymentStatus: "paid",
          paymentId: payment.id,
          paidAt: new Date(),
          status: "confirmed",
        });
        
        console.log("Payment confirmed for order:", orderId);
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).json({ error: "Webhook processing failed" });
  }
}