// mobile/src/context/AppContext.js
import { useRouter } from "expo-router";
import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import {
  addReviewApi,
  createOrder as apiCreateOrder,
  getCart as apiGetCart,
  getOrders as apiGetOrders,
  login as apiLogin,
  register as apiRegister,
  clearAuth,
  getCategories,
  getDeliveryForOrder,
  getDriverContact,
  getMyReviewsApi,
  getProductApi,
  getProducts,
  getRecommendations,
  getToken,
  isValidGcash,
  listMyDeliveries,
  setUser as persistUser,
  getUser as readUser,
  setCartApi,
  setToken,
  toAbsoluteUrl,
} from "../api/apiClient";
import { clearCart, loadCart, saveCart } from "./cartOrdersServices";

export const AppCtx = createContext(null);

export default function AppProvider({ children }) {
  const router = useRouter();

  // data state
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [productDetail, setProductDetail] = useState(null);
  const [myReviews, setMyReviews] = useState([]);
  const [recoItems, setRecoItems] = useState([]);

  // UX flags
  const [justMergedFromGuest, setJustMergedFromGuest] = useState(false);
  const [justLoggedInName, setJustLoggedInName] = useState(null);
  const [justRegistered, setJustRegistered] = useState(false);

  // categories map {id: name}
  const [categoryMap, setCategoryMap] = useState({});

  // UI/filter state
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [lastAddedCategory, setLastAddedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // checkout state
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [gcashNumber, setGcashNumber] = useState("");

  // derived
  const isLoggedIn = !!user?._id || !!user?.id || !!user?.email;
  const userId = useMemo(() => user?._id || user?.id || user?.email || "guest", [user]);

  // boot
  useEffect(() => {
    (async () => {
      try {
        await getToken(); // prime axios Authorization if token exists
        const u = await readUser();
        if (u) setUserState(u);

        const [prod, cats] = await Promise.all([
          getProducts(),
          getCategories().catch(() => ({ data: [] })),
        ]);

        setProducts(Array.isArray(prod?.data) ? prod.data : []);
        const map = {};
        (cats.data || []).forEach((c) => {
          map[String(c._id)] = c.name || c.categoryName || "";
        });
        setCategoryMap(map);

        if (u) {
          await refreshAuthedData(u);
        } else {
          const guestCart = await loadCart();
          setCart(Array.isArray(guestCart?.items) ? guestCart.items : []);
        }
      } catch (e) {
        console.warn("App boot failed:", e?.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // fetch AI recommendations whenever user/cart changes
  useEffect(() => {
    (async () => {
      try {
        const cartIds = (cart || []).map((i) => i?.productId).filter(Boolean);
        const { data } = await getRecommendations({ userId, cartIds, limit: 8 });
        setRecoItems(Array.isArray(data?.items) ? data.items : []);
      } catch (e) {
        console.warn("reco fetch failed:", e?.message);
        setRecoItems([]);
      }
    })();
  }, [userId, (cart || []).map((i) => i?.productId).join(",")]);

  const refreshAuthedData = useCallback(
  async (u = user) => {
    if (!u) return;
    const id = u?._id || u?.id || u?.email;
    if (!id) return;

    try {
      // 1) pull cart & orders in parallel
      const [cartResp, ordersResp] = await Promise.allSettled([
        apiGetCart(id),
        apiGetOrders(id),
      ]);

      // cart
      if (cartResp.status === "fulfilled") {
        const items = cartResp.value?.data?.items;
        setCart(Array.isArray(items) ? items : []);
      } else {
        setCart([]);
      }

      // orders (base list)
      const baseOrders = ordersResp.status === "fulfilled" && Array.isArray(ordersResp.value?.data)
        ? ordersResp.value.data
        : [];

      // 2) fetch all deliveries once, map by orderId
      let byOrderId = {};
        try {
          const { data: deliveriesResp } = await listMyDeliveries();
          const list = deliveriesResp?.success ? deliveriesResp.deliveries : [];
          byOrderId = list.reduce((acc, d) => {
            // d.order could be an ObjectId string or a populated object with _id
            const orderKey = typeof d.order === 'string' 
              ? d.order 
              : String(d.order?._id || '');
            if (orderKey) {
              acc[orderKey] = d;
            }
            return acc;
          }, {});
        } catch (e) {
          console.warn('fetch deliveries failed:', e.message);
        }

      // 3) attach delivery onto each order (if exists)
      const mergedOrders = baseOrders.map((o) => {
        const key = String(o._id);
        const delivery = byOrderId[key];
        return delivery ? { ...o, delivery } : o;
      });

      setOrders(mergedOrders);
    } catch {
      setCart([]);
      setOrders([]);
    }
  },
  [user]
);

  // guard with alert
  const ensureAuthed = () => {
    if (!isLoggedIn) {
      Alert.alert(
        "Login Required",
        "You need to login or create an account to continue.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Login", onPress: () => router.push("/login") },
        ]
      );
      return false;
    }
    return true;
  };

  // ---- cart persistence helper ----
  const persistCart = async (items) => {
    try {
      if (isLoggedIn) {
        await setCartApi({ userId, items });
      } else {
        await saveCart({ items, total: 0 });
      }
    } catch (e) {
      console.warn("persist cart failed:", e?.message);
    }
  };

  // ---------------- CART ACTIONS ----------------
  const handleAddToCart = async (product) => {
    const idx = cart.findIndex((i) => i.productId === product._id);
    const updated =
      idx > -1
        ? cart.map((i, k) => (k === idx ? { ...i, quantity: Number(i.quantity || 0) + 1 } : i))
        : [
            ...cart,
            {
              productId: product._id,
              name: product.name,
              price: Number(product.price || 0),
              imageUrl: product.imageUrl || product.images?.[0] || "",
              quantity: 1,
            },
          ];

    setCart(updated);
    persistCart(updated);
    setLastAddedCategory(product?.category ?? "Uncategorized");
  };

  const setQty = async (productId, qty) => {
    const nextQty = Math.max(0, Number(qty) || 0);
    const updated = cart
      .map((i) => (i.productId === productId ? { ...i, quantity: nextQty } : i))
      .filter((i) => Number(i.quantity || 0) > 0);

    setCart(updated);
    persistCart(updated);
  };

  const incrementCartQty = (productId) => {
    const current = cart.find((i) => i.productId === productId)?.quantity || 0;
    return setQty(productId, Number(current) + 1);
  };
  const decrementCartQty = (productId) => {
    const current = cart.find((i) => i.productId === productId)?.quantity || 0;
    return setQty(productId, Number(current) - 1);
  };

  const handleRemoveFromCart = (productId) => decrementCartQty(productId);
  const handleRemoveLine = async (productId) => {
    const updated = cart.filter((i) => i.productId !== productId);
    setCart(updated);
    persistCart(updated);
  };

  // ---------------- PLACE ORDER ----------------
  const handlePlaceOrder = async () => {
    if (!ensureAuthed()) return { success: false, message: "Not logged in" };

    const addr = String((deliveryAddress || "").trim());
    if (!addr) return { success: false, message: "Delivery address is required" };

    if (paymentMethod === "GCash" && !isValidGcash(gcashNumber)) {
      return { success: false, message: "Invalid GCash number" };
    }

    const total = Array.isArray(cart)
      ? cart.reduce((s, it) => s + Number(it.price || 0) * Number(it.quantity || 0), 0)
      : 0;
    if (!Array.isArray(cart) || cart.length === 0 || total <= 0) {
      return { success: false, message: "Your cart is empty." };
    }

    const deliveryType = "in-house";

    const payload = {
      userId,
      items: cart,
      total,
      address: addr,
      paymentMethod,
      status: "Pending",
      deliveryType,
      gcashNumber: paymentMethod === "GCash" ? String(gcashNumber || "").trim() : undefined,
    };

    try {
      const resp = await apiCreateOrder(payload);
      const order =
        resp?.data?._id ? resp.data : resp?.data?.order ? resp.data.order : resp?._id ? resp : null;
      if (!order?._id) return { success: false, message: "Order creation failed." };

      setOrders((prev) => (order ? [order, ...(prev || [])] : prev || []));
      setCart([]);
      setDeliveryAddress("");
      setGcashNumber("");

      refreshAuthedData?.(user);
      return { success: true, order };
    } catch (e) {
      console.error("place order failed:", e?.message);
      return { success: false, message: e?.response?.data?.message || e?.message || "Order failed" };
    }
  };

  // -------- merge guest cart into authed cart (combine quantities) --------
  const mergeGuestCartInto = async (u) => {
    try {
      const guestCart = await loadCart();
      const guestItems = Array.isArray(guestCart?.items) ? guestCart.items : [];
      if (guestItems.length === 0) return;

      const userKey = u._id || u.id || u.email;
      if (!userKey) return;

      // Fetch existing server cart
      let serverItems = [];
      try {
        const resp = await apiGetCart(userKey);
        serverItems = Array.isArray(resp?.data?.items) ? resp.data.items : [];
      } catch {
        serverItems = [];
      }

      // Merge by productId (sum quantities)
      const byId = new Map();
      const addAll = (arr) => {
        for (const it of arr) {
          const id = it.productId || it._id;
          if (!id) continue;
          const prev = byId.get(id) || {
            productId: id,
            name: it.name,
            price: Number(it.price || 0),
            imageUrl: it.imageUrl || it.images?.[0] || "",
            quantity: 0,
          };
          prev.quantity = Number(prev.quantity || 0) + Number(it.quantity || 0);
          byId.set(id, prev);
        }
      };
      addAll(serverItems);
      addAll(guestItems);

      const mergedItems = Array.from(byId.values()).map((it) => ({
        ...it,
        quantity: Math.max(1, Math.min(99, Number(it.quantity || 1))),
      }));

      // Save to server
      await setCartApi({ userId: userKey, items: mergedItems });

      // Clear guest cart and update UI
      await clearCart();
      setCart(mergedItems);

      // set banner flag for CartScreen
      setJustMergedFromGuest(true);
    } catch (e) {
      console.warn("merge guest cart failed:", e?.message);
    }
  };

  // ---- auth actions ----
  const doLogin = async ({ email, password }) => {
    const resp = await apiLogin({ email, password });
    const { token, user: u } = resp.data || {};
    await setToken(token);
    await persistUser(u);
    setUserState(u);

    setJustLoggedInName(u?.name || u?.email || "there");
    setJustRegistered(false);

    await mergeGuestCartInto(u);
    await refreshAuthedData(u);

    router.replace("/tabs/home");
  };

  const doRegister = async ({ name, email, password }) => {
    const resp = await apiRegister({ name, email, password });
    const { token, user: u } = resp.data || {};
    await setToken(token);
    await persistUser(u);
    setUserState(u);

    setJustLoggedInName(u?.name || u?.email || "there");
    setJustRegistered(true);

    await mergeGuestCartInto(u);
    await refreshAuthedData(u);

    router.replace("/tabs/home");
  };

  const handleLogout = async () => {
    await clearAuth();
    setUserState(null);
    setCart([]);
    setOrders([]);
    router.replace("/tabs/home");
  };

  // --- category helpers ---
  const categoryLabelOf = (p) => {
    const c = p?.category;
    if (!c) return "Uncategorized";
    if (typeof c === "string") return categoryMap[c] || c;
    if (typeof c === "object") return c?.name || c?.categoryName || "Uncategorized";
    return "Uncategorized";
  };

  // derived UI helpers
  const categories = useMemo(() => {
    const set = new Set((products || []).map((p) => categoryLabelOf(p)));
    return ["All", ...Array.from(set)];
  }, [products, categoryMap]);

  const filteredProducts = useMemo(() => {
    const q = (searchQuery || "").toLowerCase();
    return (products || []).filter((p) => {
      const name = (p?.name || "").toLowerCase();
      const cat = categoryLabelOf(p);
      return (selectedCategory === "All" || cat === selectedCategory) && name.includes(q);
    });
  }, [products, selectedCategory, searchQuery, categoryMap]);

  const recommendedProducts = useMemo(() => {
    return lastAddedCategory
      ? (products || []).filter((p) => categoryLabelOf(p) === lastAddedCategory).slice(0, 3)
      : (products || []).slice(0, 3);
  }, [products, lastAddedCategory, categoryMap]);

  const cartTotal = useMemo(
    () => cart.reduce((s, it) => s + Number(it.price || 0) * Number(it.quantity || 0), 0),
    [cart]
  );

  // Product details + reviews
  const fetchProductDetail = async (id) => {
    try {
      const res = await getProductApi(id);
      setProductDetail(res.data);
    } catch (e) {
      console.warn("fetchProductDetail failed:", e.message);
    }
  };

  const submitReview = async (productId, rating, comment, imageUrls = []) => {
    const token = await getToken();
    if (!token) {
      Alert.alert(
        "Login Required",
        "You need to login or create an account before posting a review.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Login", onPress: () => router.push("/login") },
        ]
      );
      return;
    }
    try {
      const res = await addReviewApi(productId, { rating, comment, imageUrls }, token);
      setProductDetail(res.data);
    } catch (e) {
      console.warn("submitReview failed:", e.message);
    }
  };

  const fetchMyReviews = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await getMyReviewsApi(token);
      setMyReviews(res.data || []);
    } catch (e) {
      console.warn("fetchMyReviews failed:", e.message);
    }
  };

  const value = {
    // state
    loading, products, cart, setCart, orders, user,
    selectedCategory, setSelectedCategory,
    lastAddedCategory, setLastAddedCategory,
    searchQuery, setSearchQuery,
    deliveryAddress, setDeliveryAddress,
    paymentMethod, setPaymentMethod,
    gcashNumber, setGcashNumber,
    recoItems,
    justMergedFromGuest, setJustMergedFromGuest,
    justLoggedInName, setJustLoggedInName,
    justRegistered, setJustRegistered,

    // derived
    isLoggedIn, categories, filteredProducts, recommendedProducts, cartTotal,

    // actions
    ensureAuthed,
    handleAddToCart,
    handleRemoveFromCart,
    handleRemoveLine,
    incrementCartQty,
    decrementCartQty,
    setQty,
    handlePlaceOrder,
    handleLogout,
    doLogin,
    doRegister,
    refreshAuthedData,

    // product & reviews
    productDetail,
    fetchProductDetail,
    submitReview,
    myReviews,
    fetchMyReviews,

    // helpers
    categoryMap,
    categoryLabelOf,
    toAbsoluteUrl,
    setUserState,
    persistUser,

     // deliveries
    listMyDeliveries,
    getDeliveryForOrder,
    getDriverContact,
  };

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
