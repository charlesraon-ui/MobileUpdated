import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Constants from "expo-constants";

/** ------------- Config (single source of truth) ------------- */
// Prefer app.json extra over environment; include manifestExtra fallback on web
const configApiUrl = (Constants?.expoConfig?.extra?.apiUrl) || (Constants?.manifestExtra?.apiUrl);
const envApiUrl = process.env.EXPO_PUBLIC_API_URL;
let API_URL = configApiUrl || envApiUrl || "http://localhost:5000";

// Guard against unexpected/stale domains; default to the new backend
try {
  const host = new URL(API_URL).hostname;
  const allowed = ["goagritrading-backend.onrender.com", "localhost", "127.0.0.1"];
  if (!allowed.some(h => host.includes(h))) {
    API_URL = "https://goagritrading-backend.onrender.com";
  }
} catch {
  // Non-URL string; force to new backend
  API_URL = "https://goagritrading-backend.onrender.com";
}

/** ------------- Axios instance ------------- */
export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // Increased timeout to 30 seconds
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
  (r) => {
    return r;
  },
  (err) => {
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

/** ------------- Fallback helpers (handle older '/api/app' mounts) ------------- */
const withFallbackGet = async (primary, fallback) => {
  try {
    return await api.get(primary);
  } catch (err) {
    const status = err?.response?.status;
    // Retry on 404/401 or network errors
    if (status === 404 || status === 401 || !status) {
      return await api.get(fallback);
    }
    throw err;
  }
};

const withFallbackPost = async (primary, payload, fallback) => {
  try {
    return await api.post(primary, payload);
  } catch (err) {
    const status = err?.response?.status;
    if (status === 404 || status === 401 || !status) {
      return await api.post(fallback, payload);
    }
    throw err;
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
export const initiateRegister = (payload) => api.post(`/api/auth/register/initiate`, payload);
export const verifyRegisterOtp = (email, otp) => api.post(`/api/auth/register/otp/verify`, { email, otp });
export const login    = (payload) => api.post(`/api/auth/login`, payload);
export const googleAuth = (payload) => api.post(`/api/auth/google`, payload);
// Forgot password
export const requestPasswordReset = (email) => api.post(`/api/auth/password/forgot`, { email });
export const completePasswordReset = (token, password) => api.post(`/api/auth/password/reset`, { token, password });

export const getProducts = async () => {
  console.log("🔥 API: getProducts() called");
  try {
    console.log("🔥 API: Making request to /api/products...");
    const response = await api.get(`/api/products`);
    console.log("🔥 API: getProducts() response status:", response.status);
    console.log("🔥 API: getProducts() response data:", response.data);
    console.log("🔥 API: getProducts() response data type:", typeof response.data);
    console.log("🔥 API: getProducts() response data length:", response.data?.length);
    return response;
  } catch (error) {
    console.error("🔥 API: getProducts() error:", error);
    console.error("🔥 API: getProducts() error message:", error.message);
    console.error("🔥 API: getProducts() error response:", error.response);
    throw error;
  }
};
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
export const createMyOrder = (payload) => api.post(`/api/orders/me`, payload);

/** ------------- Bundles ------------- */
export const getBundles = async () => {
  console.log("🔥 API: getBundles() called");
  try {
    console.log("🔥 API: Making request to /api/bundles...");
    const response = await api.get(`/api/bundles`);
    console.log("🔥 API: getBundles() response status:", response.status);
    console.log("🔥 API: getBundles() response data:", response.data);
    console.log("🔥 API: getBundles() response data type:", typeof response.data);
    console.log("🔥 API: getBundles() response data length:", response.data?.length);
    return response;
  } catch (error) {
    console.error("🔥 API: getBundles() error:", error);
    console.error("🔥 API: getBundles() error message:", error.message);
    console.error("🔥 API: getBundles() error response:", error.response);
    throw error;
  }
};
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

/** ------------- Notifications ------------- */
export const registerPushToken = (pushToken) =>
  api.post(`/api/notifications/register`, { pushToken });

/** ------------- Loyalty ------------- */
export const getDigitalCard = () =>
  withFallbackGet(`/api/loyalty/digital-card`, `/api/app/loyalty/digital-card`);

export const getLoyaltyStatus = async () => {
  console.log('getLoyaltyStatus called');
  try {
    const result = await withFallbackGet(`/api/loyalty/status`, `/api/app/loyalty/status`);
    console.log('getLoyaltyStatus success:', result);
    return result;
  } catch (error) {
    console.error('getLoyaltyStatus error:', error);
    throw error;
  }
};

export const issueLoyaltyCard = () =>
  withFallbackPost(`/api/loyalty/issue-card`, {}, `/api/app/loyalty/issue-card`);

export const getAvailableRewards = () =>
  withFallbackGet(`/api/loyalty/rewards`, `/api/app/loyalty/rewards`);

export const getUsableRewards = () =>
  withFallbackGet(`/api/loyalty/usable-rewards`, `/api/app/loyalty/usable-rewards`);

export const redeemReward = (rewardName) =>
  withFallbackPost(`/api/loyalty/redeem`, { rewardName }, `/api/app/loyalty/redeem`);

export const getRedemptionHistory = () =>
  withFallbackGet(`/api/loyalty/redemptions`, `/api/app/loyalty/redemptions`);

/** ------------- Refunds ------------- */
export const getOrderRefundStatus = (orderId) =>
  api.get(`/api/refund-tickets/order/${orderId}`);

export const getMyRefundTicketsApi = () =>
  api.get(`/api/refund-tickets/my-tickets`);

export const getRefundTicketApi = (ticketId) =>
  api.get(`/api/refund-tickets/${ticketId}`);

export const createRefundTicketApi = (payload) =>
  api.post(`/api/refund-tickets`, payload);

// React Native image upload via FormData: files as { uri, name, type }
export const uploadRefundImagesFromUris = async (images = []) => {
  const form = new FormData();
  images.forEach((img, idx) => {
    if (!img) return;
    const uri = typeof img === 'string' ? img : img.uri;
    const name = (typeof img === 'object' && img.fileName) || `refund_${Date.now()}_${idx}.jpg`;
    const type = (typeof img === 'object' && img.type) || 'image/jpeg';
    form.append('images', { uri, name, type });
  });
  const res = await api.post(`/api/refund-tickets/upload`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

// Upload a single profile image and return server response
export const uploadProfileImageFromUri = async (img) => {
  if (!img) return null;
  const form = new FormData();
  const uri = typeof img === 'string' ? img : img.uri;
  const name = (typeof img === 'object' && (img.fileName || img.name)) || `avatar_${Date.now()}.jpg`;
  const type = (typeof img === 'object' && img.type) || 'image/jpeg';
  form.append('image', { uri, name, type });
  const res = await api.post(`/api/users/profile/upload`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data; // expect { url } or similar
};

/** ------------- In-app Messaging ------------- */
export const getMyMessagesApi = () => api.get(`/api/messages`);
export const sendMessageApi = (text) => api.post(`/api/messages`, { text });

// Profile update
export const updateProfileApi = (payload) => api.put(`/api/users/profile`, payload);

/** ------------- Wishlist ------------- */
export const getWishlistApi = () => api.get(`/api/wishlist`);
export const addToWishlistApi = (productId) => api.post(`/api/wishlist/add`, { productId });
export const removeFromWishlistApi = (productId) => api.delete(`/api/wishlist/remove`, { data: { productId } });
export const toggleWishlistApi = (productId) => api.post(`/api/wishlist/toggle`, { productId });

/** ------------- Support Chat (Custom Backend) ------------- */
// Create separate axios instance for support chat
const supportChatApi = axios.create({
  baseURL: API_URL, // Use the same API_URL as the main API
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// Add auth interceptor for support chat API
supportChatApi.interceptors.request.use(async (config) => {
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

supportChatApi.interceptors.response.use(
  (r) => r,
  (err) => Promise.reject(err)
);

export const createSupportChatApi = () => supportChatApi.post(`/api/support-chat/create`);
export const getSupportMessagesApi = (roomId) => supportChatApi.get(`/api/support-chat/${roomId}/messages`);
export const sendSupportMessageApi = (roomId, message) => supportChatApi.post(`/api/support-chat/${roomId}/message`, { message });
export const closeSupportChatApi = (roomId) => supportChatApi.post(`/api/support-chat/${roomId}/close`);

// Admin functions
export const getPendingSupportChatsApi = () => supportChatApi.get(`/api/support-chat/pending`);
export const acceptSupportChatApi = (roomId) => supportChatApi.post(`/api/support-chat/${roomId}/accept`);

/** ------------- Exports ------------- */
export { API_URL }; // if other modules need the absolute string




