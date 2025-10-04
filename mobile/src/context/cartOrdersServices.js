import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../api/apiClient";

const CART_KEY = "goat_cart_v1";

// ---- Local cart helpers (fallback or guest users) ----
export async function loadCart() {
  try {
    const raw = await AsyncStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : { items: [], total: 0 };
  } catch (e) {
    console.warn("loadCart error:", e);
    return { items: [], total: 0 };
  }
}

export async function saveCart(cart) {
  try {
    await AsyncStorage.setItem(CART_KEY, JSON.stringify(cart));
    return true;
  } catch (e) {
    console.warn("saveCart error:", e);
    return false;
  }
}

export async function clearCart() {
  try {
    await AsyncStorage.removeItem(CART_KEY);
    return true;
  } catch (e) {
    console.warn("clearCart error:", e);
    return false;
  }
}

// ---- Backend API calls (centralized base via axios client) ----
export async function fetchCart(userId) {
  try {
    const res = await api.get(`/api/cart/${userId}`);
    return res.data;
  } catch (e) {
    console.warn("fetchCart error:", e?.message || e);
    throw e;
  }
}

export async function fetchOrdersFor(userId) {
  try {
    const res = await api.get(`/api/orders/${userId}`);
    return res.data;
  } catch (e) {
    console.warn("fetchOrdersFor error:", e?.message || e);
    throw e;
  }
}

/**
 * placeOrder hits your backend Orders endpoint.
 * @param {Object} params
 * @param {Array}  params.items   [{ productId, name, price, quantity }]
 * @param {Number} params.total
 * @param {String} params.token   (JWT) optional; include if your API is protected
 */
export async function placeOrder({ items, total, address, paymentMethod, gcashNumber, userId, token }) {
  try {
    const payload = { items, total, address, paymentMethod, gcashNumber, userId };
    const config = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
    const res = await api.post(`/api/orders`, payload, config);

    const data = res.data;
    // if successful, clear local cart
    await clearCart();
    return data;
  } catch (e) {
    const msg = e?.response?.data?.message || e?.message || "Order failed";
    console.warn("placeOrder error:", msg);
    throw e;
  }
}
