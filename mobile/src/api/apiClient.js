import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Constants from "expo-constants";

/** ------------- Config (single source of truth) ------------- */
const API_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  process.env.EXPO_PUBLIC_API_URL ||
  "http://localhost:5000";

console.log("API_URL in app:", API_URL);

/** ------------- Axios instance ------------- */
export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

/** ------------- Interceptors (attach to instance) ------------- */
api.interceptors.request.use(async (config) => {
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

api.interceptors.response.use(
  (r) => r,
  (err) => {
    console.warn("AXIOS ERR:", err?.message, "url:", err?.config?.url);
    return Promise.reject(err);
  }
);

/** ------------- Helpers ------------- */
export const toAbsoluteUrl = (u) => {
  if (!u) return null;
  try {
    return new URL(u).href; // already absolute
  } catch {
    return `${API_URL.replace(/\/+$/, "")}/${String(u).replace(/^\/+/, "")}`;
  }
};

/** ------------- Auth / Storage ------------- */
export const setToken = async (token) => {
  if (token) {
    await AsyncStorage.setItem("pos-token", token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    await AsyncStorage.removeItem("pos-token");
    delete api.defaults.headers.common.Authorization;
  }
};

export const getToken = async () => {
  const t = await AsyncStorage.getItem("pos-token");
  if (t) api.defaults.headers.common.Authorization = `Bearer ${t}`;
  return t;
};

export const setUser  = async (user) => AsyncStorage.setItem("pos-user", JSON.stringify(user || {}));
export const getUser  = async () => { const raw = await AsyncStorage.getItem("pos-user"); try { return raw ? JSON.parse(raw) : null; } catch { return null; } };
export const clearAuth = async () => {
  await AsyncStorage.multiRemove(["pos-token", "pos-user"]);
  delete api.defaults.headers.common.Authorization;
};

export const isValidGcash = (num) => /^09\d{9}$/.test((num || "").trim());

/** ------------- Core APIs (relative paths) ------------- */
export const register = (payload) => api.post(`/api/auth/register`, payload);
export const login    = (payload) => api.post(`/api/auth/login`, payload);

export const getProducts   = () => api.get(`/api/products`);
export const getProductApi = (id) => api.get(`/api/products/${id}`);
export const getCategories = () => api.get(`/api/categories`);

export const addReviewApi = (productId, payload, token) =>
  api.post(`/api/products/${productId}/reviews`, payload, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

export const getMyReviewsApi = (token) =>
  api.get(`/api/products/my/reviews`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

export const getCart    = (userId) => api.get(`/api/cart/${userId}`);
export const setCartApi = (payload) => api.post(`/api/cart`, payload);

export const getOrders   = (userId) => api.get(`/api/orders/${userId}`);
export const createOrder = (payload) => api.post(`/api/orders`, payload);

/** ------------- Bundles ------------- */
export const getBundles = () => api.get(`/api/bundles`);
export const getBundleApi = (id) => api.get(`/api/bundles/${id}`);

/** ------------- Deliveries ------------- */
export const listMyDeliveries    = () => api.get(`/api/delivery/mine`);
export const getDeliveryForOrder = (orderId) => api.get(`/api/delivery/by-order/${orderId}`);
export const getDriverContact    = (deliveryId) => api.get(`/api/delivery/${deliveryId}/driver`);

/** ------------- Recommendations ------------- */
export const getRecommendations = ({ userId, cartIds = [], limit = 10 }) => {
  const params = new URLSearchParams();
  if (userId) params.set("userId", userId);
  if (cartIds?.length) params.set("cart", cartIds.join(","));
  if (limit) params.set("limit", String(limit));
  return api.get(`/api/recommendations?${params.toString()}`);
};

export const getProductRecommendations = (productId, limit = 8) =>
  api.get(`/api/recommendations/product/${productId}`, { params: { limit } });

/** ------------- Payments (PayMongo) ------------- */
export const createPaymentIntent = (amount, description, userId) =>
  api.post(`/api/payment/payment-intent`, { amount, description, userId });

export const createPaymentMethod = (type, details) =>
  api.post(`/api/payment/payment-method`, { type, details });

export const attachPaymentMethod = (paymentIntentId, paymentMethodId, clientKey) =>
  api.post(`/api/payment/attach`, { paymentIntentId, paymentMethodId, clientKey });

export const createPaymentSource = (amount, type, userId, orderId) =>
  api.post(`/api/payment/source`, { amount, type, userId, orderId });

export const createEPaymentOrder = (payload) => api.post(`/api/orders/epayment`, payload);
export const createGCashOrder   = (payload) => createEPaymentOrder(payload);

/** ------------- Exports ------------- */
export { API_URL }; // if other modules need the absolute string

