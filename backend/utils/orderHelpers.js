// backend/utils/orderHelpers.js
// Compatibility helpers for older controllers that import this module.
// These functions are intentionally generic and side-effect free.

/** Safely convert a value to a number (supports strings with commas/spaces). */
export function toNum(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : NaN;
  if (typeof v === "string") {
    const cleaned = v.replace(/[, ]+/g, "");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : NaN;
  }
  return NaN;
}

/**
 * Normalize cart items into a consistent shape used by orders.
 * This is a minimal, DB-agnostic normalizer that avoids side effects.
 */
export function normalizeItems(rawItems = []) {
  const items = Array.isArray(rawItems) ? rawItems : [];
  return items.map((it, idx) => {
    const qtyRaw = it?.quantity ?? it?.qty ?? 1;
    const qty = toNum(qtyRaw);

    let pricePeso =
      it?.price != null ? toNum(it.price)
      : it?.unitPrice != null ? toNum(it.unitPrice)
      : it?.unit_price != null ? toNum(it.unit_price)
      : it?.amount != null ? toNum(it.amount) / 100
      : NaN;

    if (!Number.isFinite(pricePeso)) {
      // Still return a sentinel object; caller may validate separately.
      pricePeso = NaN;
    }

    const name = it?.name || it?.productName || it?.product?.name || "Item";
    const productId = it?.productId || it?.id || it?._id;
    const imageUrl = it?.imageUrl || it?.image || it?.product?.imageUrl || undefined;
    const weightKgRaw = it?.weightKg ?? 0;
    const weightKg = Number.isFinite(toNum(weightKgRaw)) ? Math.round(toNum(weightKgRaw) * 100) / 100 : 0;

    return {
      productId,
      name,
      imageUrl,
      price: Number.isFinite(pricePeso) ? Math.round(pricePeso * 100) / 100 : NaN,
      quantity: Number.isFinite(qty) && qty > 0 ? Math.floor(qty) : 0,
      weightKg,
      __idx: idx,
    };
  });
}

/** Compute subtotal, deliveryFee, and total. */
export function computeTotals(items = [], deliveryType = "in-house", deliveryFeeInBody = 0, totalInBody) {
  const safeItems = Array.isArray(items) ? items : [];
  const subtotal = safeItems.reduce((s, it) => {
    const price = toNum(it?.price);
    const qty = toNum(it?.quantity);
    if (!Number.isFinite(price) || !Number.isFinite(qty) || qty <= 0) return s;
    return s + Number(price) * Number(qty);
  }, 0);

  const feeInBodyNum = toNum(deliveryFeeInBody);
  const deliveryFee = Number.isFinite(feeInBodyNum)
    ? feeInBodyNum
    : deliveryType === "pickup" ? 0
    : deliveryType === "third-party" ? 80
    : 50;

  const totalInBodyNum = toNum(totalInBody);
  const total = Number.isFinite(totalInBodyNum) && totalInBodyNum > 0
    ? totalInBodyNum
    : Math.round((subtotal + deliveryFee) * 100) / 100;

  return { subtotal, deliveryFee, total };
}

/** Basic item validation result (non-throwing). */
export function validateItems(items = []) {
  const errors = [];
  const normalized = normalizeItems(items);
  normalized.forEach((it) => {
    if (!Number.isFinite(it.price)) {
      errors.push({ idx: it.__idx, field: "price", message: "price missing or invalid" });
    }
    if (!Number.isFinite(it.quantity) || it.quantity <= 0) {
      errors.push({ idx: it.__idx, field: "quantity", message: "quantity must be a positive number" });
    }
  });
  return { ok: errors.length === 0, errors, items: normalized };
}

/** Default export for flexibility (supports default or named imports). */
const orderHelpers = { toNum, normalizeItems, computeTotals, validateItems };
export default orderHelpers;