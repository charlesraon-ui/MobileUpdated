import Delivery from "../models/Delivery.js";
import Order from "../models/Order.js";

/** Helper: assert the order belongs to the current user */
async function ensureOrderOwnership(orderId, userId) {
  const order = await Order.findById(orderId).select("userId").lean();
  if (!order) return { ok: false, code: 404, msg: "Order not found" };
  if (String(order.userId) !== String(userId)) {
    return { ok: false, code: 403, msg: "Forbidden" };
  }
  return { ok: true, order };
}

/** GET /api/deliveries/mine
 * Returns all deliveries for the authenticated user (driver phone only)
 */
export const listMyDeliveries = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id || req.query.userId; // adjust to your auth
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const myOrderIds = await Order.find({ userId }).select("_id").lean();
    const ids = myOrderIds.map((o) => o._id);

    const deliveries = await Delivery.find({ order: { $in: ids } })
      .populate({ path: "order", select: "status total createdAt address" })
      .populate("assignedDriver", "phone") // phone only
      .populate("assignedVehicle", "plate capacityKg model")
      .sort({ createdAt: -1 })
      .lean();

    // sanitize: expose driverPhone only, omit assignedDriver object
    const payload = deliveries.map((d) => {
      const driverPhone = d.assignedDriver?.phone || null;
      return {
        ...d,
        driverPhone,
        assignedDriver: undefined, // removed from JSON
      };
    });

    res.json({ success: true, deliveries: payload });
  } catch (e) {
    res
      .status(500)
      .json({ success: false, message: e.message || "Server error" });
  }
};

/** GET /api/deliveries/by-order/:orderId
 * Returns the single delivery for a specific order (driver phone only; ownership enforced)
 */
export const getDeliveryForOrder = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id || req.query.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { orderId } = req.params;
    const own = await ensureOrderOwnership(orderId, userId);
    if (!own.ok) {
      return res.status(own.code).json({ success: false, message: own.msg });
    }

    const delivery = await Delivery.findOne({ order: orderId })
      .populate({ path: "order", select: "status total createdAt address" })
      .populate("assignedDriver", "phone") // phone only
      .populate("assignedVehicle", "plate capacityKg model")
      .lean();

    if (!delivery) {
      return res
        .status(404)
        .json({ success: false, message: "Delivery not found" });
    }

    const driverPhone = delivery.assignedDriver?.phone || null;
    const payload = {
      ...delivery,
      driverPhone,
      assignedDriver: undefined, // hide full object
    };

    res.json({ success: true, delivery: payload });
  } catch (e) {
    res
      .status(500)
      .json({ success: false, message: e.message || "Server error" });
  }
};

/** GET /api/deliveries/:id/driver
 * Returns only the driver phone for the current user's delivery
 */
export const getDriverContact = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id || req.query.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { id } = req.params; // deliveryId
    const delivery = await Delivery.findById(id)
      .populate({ path: "order", select: "userId" })
      .populate("assignedDriver", "phone") // phone only
      .lean();

    if (!delivery) {
      return res
        .status(404)
        .json({ success: false, message: "Delivery not found" });
    }
    if (String(delivery.order.userId) !== String(userId)) {
      return res
        .status(403)
        .json({ success: false, message: "Forbidden" });
    }
    if (!delivery.assignedDriver) {
      return res.json({
        success: true,
        driver: null,
        message: "No driver assigned yet",
      });
    }

    res.json({
      success: true,
      driver: { phone: delivery.assignedDriver.phone },
    });
  } catch (e) {
    res
      .status(500)
      .json({ success: false, message: e.message || "Server error" });
  }
};
