import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Configure your backend URL here (or read from process.env.EXPO_PUBLIC_API_URL)
 * Example: http://192.168.1.100:5000
 */
const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:5000"; // 10.0.2.2 for Android emulator

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

// ---- Backend API calls ----
export async function fetchCart(userId) {
  try {
    const res = await fetch(`${API_URL}/api/cart/${userId}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch cart: ${res.status}`);
    }
    return await res.json();
  } catch (e) {
    console.warn("fetchCart error:", e.message);
    throw e;
  }
}

export async function fetchOrdersFor(userId) {
  try {
    const res = await fetch(`${API_URL}/api/orders/${userId}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch orders: ${res.status}`);
    }
    return await res.json();
  } catch (e) {
    console.warn("fetchOrdersFor error:", e.message);
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
    const res = await fetch(`${API_URL}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ items, total, address, paymentMethod, gcashNumber, userId }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Order failed with ${res.status}`);
    }

    const data = await res.json();
    // if successful, clear local cart
    await clearCart();
    return data;
  } catch (e) {
    console.warn("placeOrder error:", e.message);
    throw e;
  }
}
