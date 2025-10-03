import Cart from "../models/Cart.js";
import Delivery from "../models/Delivery.js";
import Order from "../models/Order.js";

/* ---------------- PayMongo E-Payment (All Methods) ---------------------- */
export const createEPaymentOrder = async (req, res) => {
  try {
    const me = req.user?.userId || req.user?.id;
    if (!me) return res.status(401).json({ success: false, message: "Unauthorized" });

    console.log("💳 E-Payment order request (body keys):", Object.keys(req.body || {}));
    
    const {
      items: rawItems = [],
      deliveryType = "in-house",
      address = "",
      deliveryFee: deliveryFeeInBody = 0,
      total: totalInBody,
      channel = "multi",
    } = req.body || {};

    // Validate PayMongo credentials
    if (!process.env.PAYMONGO_SECRET_KEY) {
      console.error("❌ PAYMONGO_SECRET_KEY is not configured");
      return res.status(500).json({
        success: false,
        message: "Payment system not configured. Please contact support.",
      });
    }

    console.log("RAW items[0]:", rawItems?.[0]);

    // Helper to convert values to numbers
    const toNum = (v) => {
      if (typeof v === "number") return v;
      if (typeof v === "string") {
        const cleaned = v.replace(/[, ]+/g, "");
        const n = Number(cleaned);
        return Number.isFinite(n) ? n : NaN;
      }
      return NaN;
    };

    // Normalize items
    const items = (Array.isArray(rawItems) ? rawItems : []).map((it, idx) => {
      const qty = toNum(it?.quantity ?? it?.qty ?? 1);

      let pricePeso =
        it?.price != null ? toNum(it.price)
        : it?.unitPrice != null ? toNum(it.unitPrice)
        : it?.unit_price != null ? toNum(it.unit_price)
        : it?.product?.price != null ? toNum(it.product.price)
        : it?.amount != null ? toNum(it.amount) / 100
        : NaN;

      if (!Number.isFinite(pricePeso)) {
        return {
          __invalid: true,
          __error: `items[${idx}].price/amount missing or invalid`,
          __debug: {
            price: it?.price,
            unitPrice: it?.unitPrice,
            unit_price: it?.unit_price,
            productPrice: it?.product?.price,
            amount: it?.amount
          }
        };
      }

      if (!Number.isFinite(qty) || qty <= 0) {
        return {
          __invalid: true,
          __error: `items[${idx}].quantity must be a positive number`,
          __debug: { quantity: it?.quantity, qty: it?.qty }
        };
      }

      pricePeso = Math.round(pricePeso * 100) / 100;

      return {
        productId: it?.productId || it?.id || it?._id || undefined,
        name: it?.name || it?.productName || it?.product?.name || "Item",
        imageUrl: it?.imageUrl || it?.image || it?.product?.imageUrl || undefined,
        price: pricePeso,
        quantity: Math.floor(qty),
      };
    });

    // Check for invalid items
    const bad = items.find(x => x?.__invalid);
    if (bad) {
      console.error("❌ Normalization error:", bad);
      return res.status(400).json({
        success: false,
        message: bad.__error,
        details: bad.__debug
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty." });
    }

    console.log("✅ NORM items[0]:", items?.[0]);

    // Calculate totals
    const deliveryFee =
      Number.isFinite(toNum(deliveryFeeInBody)) ? toNum(deliveryFeeInBody)
      : deliveryType === "pickup" ? 0
      : deliveryType === "third-party" ? 80
      : 50;

    const subtotal = items.reduce((s, it) => s + Number(it.price) * Number(it.quantity), 0);
    const total = Number.isFinite(toNum(totalInBody)) && toNum(totalInBody) > 0
      ? toNum(totalInBody)
      : Math.round((subtotal + deliveryFee) * 100) / 100;

    // 1) Create order in DB (pesos)
    const order = await Order.create({
      userId: String(me),
      items,
      subtotal,
      deliveryFee,
      total,
      address,
      deliveryType,
      status: "pending_payment",
      paymentMethod: "E-Payment",
    });

    console.log("✅ Order created:", order._id);

    // 2) Create linked delivery
    await Delivery.create({
      order: order._id,
      type: deliveryType,
      deliveryAddress: address,
      status: "pending",
    });

    // 3) PayMongo Checkout Session
    const amountInCentavos = Math.round(Number(order.total) * 100);
    const lineItems = order.items.map((item) => ({
      currency: "PHP",
      amount: Math.round(Number(item.price) * 100),
      name: item.name,
      quantity: item.quantity,
    }));

    const backendUrl = process.env.BACKEND_URL || 'https://goagritrading-backend.onrender.com';

    // Create PayMongo checkout session
    const paymongoResponse = await fetch("https://api.paymongo.com/v1/checkout_sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${process.env.PAYMONGO_SECRET_KEY}:`).toString("base64")}`,
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
              address,
            },
          },
        },
      }),
    });

    const paymongoData = await paymongoResponse.json();
    
    if (!paymongoResponse.ok) {
      console.error("❌ PayMongo error:", JSON.stringify(paymongoData, null, 2));
      return res.status(paymongoResponse.status).json({
        success: false,
        message:
          paymongoData?.errors?.[0]?.detail ||
          paymongoData?.errors?.[0]?.title ||
          "PayMongo API error",
        provider: paymongoData,
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

    // 4) Save session id
    order.paymongoSessionId = session.id;
    await order.save();

    // 5) Respond for the app
    return res.status(201).json({
      success: true,
      payment: { checkoutUrl },
      orderId: order._id,
      sessionId: session.id,
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

/* ---------------- Authenticated: create order for current user ---------------------- */
export const createMyOrder = async (req, res) => {
  try {
    const me = req.user?.userId;
    if (!me) return res.status(401).json({ message: "Unauthorized" });

    const {
      items: rawItems = [],
      deliveryType = "in-house",
      address = "",
      deliveryFee: deliveryFeeInBody = 0,
      total: totalInBody,
      paymentMethod = "COD",
    } = req.body || {};

    // Normalize items -> ensure price (PESOS) & quantity
    const items = rawItems.map((it, idx) => {
      const qty = Number(it?.quantity ?? it?.qty ?? 1);
      const pricePeso =
        it?.price != null
          ? Number(it.price)
          : it?.amount != null
          ? Number(it.amount) / 100 // convert centavos to pesos
          : NaN;

      if (!Number.isFinite(pricePeso)) {
        throw new Error(`items[${idx}].price/amount missing or invalid`);
      }
      if (!Number.isFinite(qty) || qty <= 0) {
        throw new Error(`items[${idx}].quantity must be > 0`);
      }

      return {
        productId: it.productId || it.id || it._id,
        name: it.name || "Item",
        imageUrl: it.imageUrl || it.image,
        price: Math.round(pricePeso * 100) / 100, // PESOS rounded to 2dp
        quantity: Math.floor(qty),
      };
    });

    // Totals (PESOS)
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const deliveryFee =
      Number.isFinite(Number(deliveryFeeInBody)) ? Number(deliveryFeeInBody)
      : deliveryType === "pickup" ? 0
      : deliveryType === "third-party" ? 80
      : 50;

    const total = Number.isFinite(Number(totalInBody)) && Number(totalInBody) > 0
      ? Number(totalInBody)
      : Math.round((subtotal + deliveryFee) * 100) / 100;

    // Create order
    const order = await Order.create({
      userId: String(me),
      items,
      subtotal,
      deliveryFee,
      total,
      address,
      deliveryType,
      status: "pending",
      paymentMethod,
    });

    // Create delivery
    await Delivery.create({
      order: order._id,
      type: deliveryType,
      deliveryAddress: address,
      status: "pending",
    });

    // Clear cart
    await Cart.deleteOne({ userId: String(me) });

    res.status(201).json(order);
  } catch (err) {
    console.error("CREATE_MY_ORDER_ERROR:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

/* ---------------- Authenticated: list my orders + delivery -------------------------- */
export const getMyOrders = async (req, res) => {
  try {
    const me = req.user?.userId;
    if (!me) return res.status(401).json({ message: "Unauthorized" });

    // Get my orders
    const orders = await Order.find({ userId: String(me) })
      .sort({ createdAt: -1 })
      .populate("items.productId", "name price category")
      .lean();

    // Get deliveries linked to my orders
    const orderIds = orders.map(o => o._id);
    const deliveries = await Delivery.find({ order: { $in: orderIds } })
      .select("order type status deliveryAddress assignedDriver assignedVehicle createdAt")
      .populate("assignedDriver", "name phone avatarUrl")
      .populate("assignedVehicle", "plate capacityKg model")
      .lean();

    // Map deliveries by orderId
    const deliveriesByOrder = Object.fromEntries(deliveries.map(d => [String(d.order), d]));

    // Merge order + delivery
    const ordersWithDelivery = orders.map(o => ({
      ...o,
      delivery: deliveriesByOrder[String(o._id)] || null,
    }));

    res.status(200).json(ordersWithDelivery);
  } catch (err) {
    console.error("GET_MY_ORDERS_ERROR:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

/* ---------------- Admin/Service: list orders of a specific user --------------------- */
export const getOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.find({ userId: String(userId) })
      .sort({ createdAt: -1 })
      .populate("items.productId", "name price category");
    res.status(200).json(orders);
  } catch (err) {
    console.error("GET_ORDERS_ERROR:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

/* ---------------- Admin/Service: create order for any user -------------------------- */
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

    const items = rawItems.map((it, idx) => {
      const qty = Number(it?.quantity ?? it?.qty ?? 1);
      const pricePeso =
        it?.price != null
          ? Number(it.price)
          : it?.amount != null
          ? Number(it.amount) / 100
          : NaN;

      if (!Number.isFinite(pricePeso)) {
        throw new Error(`items[${idx}].price/amount missing or invalid`);
      }
      if (!Number.isFinite(qty) || qty <= 0) {
        throw new Error(`items[${idx}].quantity must be > 0`);
      }

      return {
        productId: it.productId || it.id || it._id,
        name: it.name || "Item",
        imageUrl: it.imageUrl || it.image,
        price: Math.round(pricePeso * 100) / 100,
        quantity: Math.floor(qty),
      };
    });

    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const deliveryFee =
      Number.isFinite(Number(deliveryFeeInBody)) ? Number(deliveryFeeInBody)
      : deliveryType === "pickup" ? 0
      : deliveryType === "third-party" ? 80
      : 50;

    const total = Number.isFinite(Number(totalInBody)) && Number(totalInBody) > 0
      ? Number(totalInBody)
      : Math.round((subtotal + deliveryFee) * 100) / 100;

    const order = await Order.create({
      userId: String(userId),
      items,
      subtotal,
      deliveryFee,
      total,
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

    // Optional: clear the user's cart if this came from their cart
    await Cart.deleteOne({ userId: String(userId) });

    res.status(201).json(order);
  } catch (err) {
    console.error("CREATE_ORDER_ERROR:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

/* ---------------- Deliveries list (admin/driver/user) ------------------------------- */
export const listDelivery = async (req, res) => {
  try {
    const { status, type, mine, from, to } = req.query;

    const q = {};
    if (status) q.status = status;
    if (type) q.type = type;
    if (mine === "1" && req.user?.userId) {
      // filter by orders that belong to this user
      const myOrders = await Order.find({ userId: String(req.user.userId) }).select("_id").lean();
      q.order = { $in: myOrders.map(o => o._id) };
    }
    if (from || to) {
      q.createdAt = {};
      if (from) q.createdAt.$gte = new Date(from);
      if (to) q.createdAt.$lte = new Date(to);
    }

    const deliveries = await Delivery.find(q)
      .populate("order", "userId items total address status deliveryType createdAt")
      .populate("assignedDriver", "name phone avatarUrl")
      .populate("assignedVehicle", "plate capacityKg model")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(deliveries);
  } catch (err) {
    console.error("LIST_DELIVERY_ERROR:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

/* ---------------- Aliases ----------------------------------------------------------- */
export { getMyOrders as listMyOrders, getOrders as listOrders };

export const createEPayment = async (req, res) => {
  try {
    console.log("[EPAYMENT] user:", req.user?.id);
    console.log("[EPAYMENT] body:", JSON.stringify(req.body, null, 2));

    const { items = [], amount, deliveryFee = 0, address, deliveryType, channel = "multi" } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "items[] required" });
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: "amount (centavos) required" });
    }

    // Example: create PayMongo Checkout Session (pseudo; adjust to your SDK)
    const session = await createCheckoutSession({
      line_items: items.map(i => ({
        name: i.name || "Item",
        amount: i.amount,      // centavos per item
        quantity: i.quantity || 1,
        currency: "PHP",
      })),
      amount,                  // total centavos (or let PayMongo compute)
      channel,                 // "gcash" | "multi"
      metadata: {
        userId: req.user?.id || "",
        deliveryType,
        deliveryFee,
        address,
      },
      success_url: `${baseUrl}/payment/success?orderId=${order._id}`,
      cancel_url: `${baseUrl}/payment/cancel?orderId=${order._id}`,
    });

    // Return URL for the app to open
    return res.json({
      success: true,
      payment: { checkoutUrl: session.checkout_url || session.url }, // match your provider's key
    });
  } catch (err) {
    console.error("[EPAYMENT ERROR]", err?.response?.data || err);
    return res.status(500).json({
      success: false,
      message: err?.response?.data?.message || err?.message || "Failed to create e-payment session",
    });
  }
};