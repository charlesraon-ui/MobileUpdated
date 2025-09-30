import Cart from "../models/Cart.js";
import Delivery from "../models/Delivery.js";
import Order from "../models/Order.js";

/* ---------------- Authenticated: create order for current user ---------------------- */
export const createMyOrder = async (req, res) => {
  try {
    const me = req.user?.userId;
    if (!me) return res.status(401).json({ message: "Unauthorized" });

    // 1) Create the order
    const order = await Order.create({ ...req.body, userId: String(me) });

    // 2) Create linked delivery (basic info from user)
    await Delivery.create({
      order: order._id,
      type: req.body.deliveryType,       // pickup | in-house | third-party
      deliveryAddress: req.body.address || "",
      status: "pending",
    });

    // 3) Clear cart
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
    const order = await Order.create(req.body);

    await Delivery.create({
      order: order._id,
      type: req.body.deliveryType,
      deliveryAddress: req.body.address || "",
      status: "pending",
    });

    if (req.body?.userId) {
      await Cart.deleteOne({ userId: String(req.body.userId) });
    }
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

/* ---------------- PayMongo E-Payment (All Methods) ---------------------- */
export const createEPaymentOrder = async (req, res) => {
  try {
    const me = req.user?.userId;
    if (!me) return res.status(401).json({ message: "Unauthorized" });

    console.log("💳 E-Payment order request:", req.body);

    // 1) Create order in database
    const order = await Order.create({ 
      ...req.body, 
      userId: String(me),
      status: "pending_payment",
      paymentMethod: "E-Payment"
    });

    console.log("✅ Order created:", order._id);

    // 2) Create linked delivery
    await Delivery.create({
      order: order._id,
      type: req.body.deliveryType || "in-house",
      deliveryAddress: req.body.address || "",
      status: "pending",
    });

    // 3) Create PayMongo Checkout Session (supports ALL payment methods)
    const amountInCentavos = Math.round(order.total * 100);

    const paymongoResponse = await fetch("https://api.paymongo.com/v1/checkout_sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY + ":").toString("base64")}`
      },
      body: JSON.stringify({
        data: {
          attributes: {
            send_email_receipt: false,
            show_description: true,
            show_line_items: true,
            description: `Order #${String(order._id).slice(-6).toUpperCase()}`,
            line_items: order.items.map(item => ({
              currency: "PHP",
              amount: Math.round(item.price * 100),
              name: item.name,
              quantity: item.quantity
            })),
            payment_method_types: [
              "gcash",      // GCash
              "grab_pay",   // GrabPay  
              "paymaya",    // Maya
              "card",       // Credit/Debit Cards
              "dob",        // Online Banking
            ],
            success_url: `${process.env.API_URL}/api/payment/success?orderId=${order._id}`,
            cancel_url: `${process.env.API_URL}/api/payment/cancel?orderId=${order._id}`,
            reference_number: String(order._id)
          }
        }
      })
    });

    const paymongoData = await paymongoResponse.json();
    
    if (!paymongoResponse.ok) {
      console.error("❌ PayMongo error:", paymongoData);
      throw new Error(paymongoData.errors?.[0]?.detail || "PayMongo API error");
    }

    const session = paymongoData.data;
    const checkoutUrl = session.attributes.checkout_url;

    console.log("🔗 PayMongo Checkout URL:", checkoutUrl);

    // 4) Save session ID to order
    order.paymongoSessionId = session.id;
    await order.save();

    // 5) Return checkout URL
    res.status(201).json({
      success: true,
      orderId: order._id,
      checkoutUrl,
      sessionId: session.id,
      message: "E-Payment checkout created"
    });

  } catch (err) {
    console.error("CREATE_EPAYMENT_ORDER_ERROR:", err);
    res.status(500).json({ 
      success: false,
      message: err.message || "Failed to create payment" 
    });
  }
};

