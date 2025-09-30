// mobile/src/api/apiClient.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Constants from 'expo-constants';

/* -------------------- Axios auth header -------------------- */
axios.interceptors.request.use(async (config) => {
  try {
    if (!config.headers?.Authorization) {
      const t = await AsyncStorage.getItem("pos-token");
      if (t) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${t}`;
      }
    }
  } catch {}
  return config;
});

/* -------------------- API base -------------------- */
const BASE_URL = Constants.expoConfig?.extra?.apiUrl || process.env.API_URL || "https://goagritrading-backend.onrender.com"
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});
const ENV_URL = process.env.EXPO_PUBLIC_API_URL;
export const API_URL = ENV_URL || "http://192.168.100.196:5000/api";
export const API_ORIGIN = API_URL.replace(/\/api$/, "");
console.log("API_URL in app:", API_URL);

/* -------------------- Axios error log -------------------- */
axios.interceptors.response.use(
  (r) => r,
  (err) => {
    console.warn("AXIOS ERR:", err?.message, "url:", err?.config?.url);
    return Promise.reject(err);
  }
);

/* -------------------- Helpers -------------------- */
export const toAbsoluteUrl = (u) => {
  if (!u) return null;
  try { return new URL(u).href; }
  catch { return `${API_ORIGIN}/${String(u).replace(/^\/+/, "")}`; }
};

/* -------------------- Auth / Storage -------------------- */
export const setToken = async (token) => {
  if (token) {
    await AsyncStorage.setItem("pos-token", token);
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    await AsyncStorage.removeItem("pos-token");
    delete axios.defaults.headers.common.Authorization;
  }
};
export const getToken = async () => {
  const t = await AsyncStorage.getItem("pos-token");
  if (t) axios.defaults.headers.common.Authorization = `Bearer ${t}`;
  return t;
};
export const setUser = async (user) => AsyncStorage.setItem("pos-user", JSON.stringify(user || {}));
export const getUser = async () => {
  const raw = await AsyncStorage.getItem("pos-user");
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
};
export const clearAuth = async () => {
  await AsyncStorage.multiRemove(["pos-token", "pos-user"]);
  delete axios.defaults.headers.common.Authorization;
};
export const isValidGcash = (num) => /^09\d{9}$/.test((num || "").trim());

/* -------------------- Core APIs -------------------- */
export const register = (payload) => axios.post(`${API_URL}/auth/register`, payload);
export const login    = (payload) => axios.post(`${API_URL}/auth/login`, payload);

export const getProducts   = () => axios.get(`${API_URL}/products`);
export const getProductApi = (id) => axios.get(`${API_URL}/products/${id}`);
export const getCategories = () => axios.get(`${API_URL}/categories`);

export const addReviewApi = (productId, payload, token) =>
  axios.post(`${API_URL}/products/${productId}/reviews`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
export const getMyReviewsApi = (token) =>
  axios.get(`${API_URL}/products/my/reviews`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getCart    = (userId) => axios.get(`${API_URL}/cart/${userId}`);
export const setCartApi = (payload) => axios.post(`${API_URL}/cart`, payload);

export const getOrders   = (userId) => axios.get(`${API_URL}/orders/${userId}`);
export const createOrder = (payload) => axios.post(`${API_URL}/orders`, payload);

/* -------------------- Deliveries -------------------- */
export const listMyDeliveries    = () => axios.get(`${API_URL}/delivery/mine`);
export const getDeliveryForOrder = (orderId) => axios.get(`${API_URL}/delivery/by-order/${orderId}`);
export const getDriverContact    = (deliveryId) => axios.get(`${API_URL}/delivery/${deliveryId}/driver`);

/* -------------------- Recommendations -------------------- */
export const getRecommendations = ({ userId, cartIds = [], limit = 10 }) => {
  const params = new URLSearchParams();
  if (userId) params.set("userId", userId);
  if (cartIds.length) params.set("cart", cartIds.join(","));
  if (limit) params.set("limit", String(limit));
  return axios.get(`${API_URL}/recommendations?${params.toString()}`);
};
export const getProductRecommendations = (productId, limit = 8) =>
  axios.get(`${API_URL}/recommendations/product/${productId}`, { params: { limit } });

/* -------------------- Payments (PayMongo) -------------------- */
// Card/intent style (if you still use these)
export const createPaymentIntent = (amount, description, userId) =>
  axios.post(`${API_URL}/payment/payment-intent`, { amount, description, userId });
export const createPaymentMethod = (type, details) =>
  axios.post(`${API_URL}/payment/payment-method`, { type, details });
export const attachPaymentMethod = (paymentIntentId, paymentMethodId, clientKey) =>
  axios.post(`${API_URL}/payment/attach`, { paymentIntentId, paymentMethodId, clientKey });

// Source/hosted checkout style
export const createPaymentSource = (amount, type, userId, orderId) =>
  axios.post(`${API_URL}/payment/source`, { amount, type, userId, orderId });

// Your existing backend entrypoint for hosted checkout
export const createEPaymentOrder = (payload) =>
  axios.post(`${API_URL}/orders/epayment`, payload);

// 🔹 NEW: export name that your CheckoutScreen calls
// Expects backend to return: { success: true, payment: { checkoutUrl: "https://..." } }
export const createGCashOrder = (payload) =>
  createEPaymentOrder(payload);

export const checkPaymentStatus = (sourceId) =>
  axios.get(`${API_URL}/payment/status/${sourceId}`);