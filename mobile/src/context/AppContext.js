import { useRouter } from "expo-router";
import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import Toast from "../../components/Toast";
import {
  addReviewApi,
  createOrder as apiCreateOrder,
  createMyOrder,
  getCart as apiGetCart,
  getOrders as apiGetOrders,
  login as apiLogin,
  register as apiRegister,
  initiateRegister,
  clearAuth,
  createEPaymentOrder,
  getBundleApi,
  getBundles,
  getCategories,
  getDeliveryForOrder,
  getDriverContact,
  getMyReviewsApi,
  getProductApi,
  getProducts,
  getRecommendations,
  getToken,
  listMyDeliveries,
  setUser as persistUser,
  getUser as readUser,
  setCartApi,
  setToken,
  toAbsoluteUrl,
  googleAuth,
} from "../api/apiClient";
import { registerPushToken } from "../api/apiClient";
import { getLoyaltyStatus, issueLoyaltyCard, getDigitalCard } from "../api/apiClient";
import { registerForPushNotificationsAsync } from "../utils/notifications";
import { clearCart, loadCart, saveCart } from "./cartOrdersServices";
import socketService from "../services/socketService";

export const AppCtx = createContext(null);

export default function AppProvider({ children }) {
  const router = useRouter();

  // data state
  const [products, setProducts] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [productDetail, setProductDetail] = useState(null);
  const [bundleDetail, setBundleDetail] = useState(null);
  const [myReviews, setMyReviews] = useState([]);
  const [recoItems, setRecoItems] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  // global toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState("success");
  const [toastMessage, setToastMessage] = useState("");
  const [toastActionLabel, setToastActionLabel] = useState("");
  const [toastAction, setToastAction] = useState(null);

  const showToast = useCallback(({ type = "success", message = "", actionLabel = "", onAction = null }) => {
    setToastType(type);
    setToastMessage(String(message || ""));
    setToastActionLabel(String(actionLabel || ""));
    setToastAction(() => onAction);
    setToastVisible(true);
  }, []);
  const hideToast = useCallback(() => {
    setToastVisible(false);
    setToastMessage("");
    setToastActionLabel("");
    setToastAction(null);
  }, []);

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
  // UI preferences
  const [viewMode, setViewMode] = useState("grid");

  // checkout state
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [gcashNumber, setGcashNumber] = useState("");
  // addresses (saved per user)
  const [addresses, setAddresses] = useState([]);
  const [defaultAddress, setDefaultAddressState] = useState("");
  const ADDR_KEY_PREFIX = "addresses:";
  const addrKey = useMemo(() => {
    const uid = user?._id || user?.id || user?.email || "guest";
    return `${ADDR_KEY_PREFIX}${uid}`;
  }, [user]);
  const DEFAULT_ADDR_KEY_PREFIX = "defaultAddress:";
  const defaultAddrKey = useMemo(() => {
    const uid = user?._id || user?.id || user?.email || "guest";
    return `${DEFAULT_ADDR_KEY_PREFIX}${uid}`;
  }, [user]);

  const loadAddresses = useCallback(async (key = addrKey) => {
    try {
      const json = await AsyncStorage.getItem(key);
      const arr = json ? JSON.parse(json) : [];
      setAddresses(Array.isArray(arr) ? arr : []);
    } catch (e) {
      console.warn("loadAddresses failed:", e?.message);
      setAddresses([]);
    }
  }, [addrKey]);

  const loadDefaultAddress = useCallback(async (key = defaultAddrKey) => {
    try {
      const raw = await AsyncStorage.getItem(key);
      const val = raw ? JSON.parse(raw) : "";
      const addr = typeof val === "string" ? val : String(val || "");
      setDefaultAddressState(addr);
      if (addr && !String(deliveryAddress || "").trim()) {
        setDeliveryAddress(addr);
      }
    } catch (e) {
      console.warn("loadDefaultAddress failed:", e?.message);
      setDefaultAddressState("");
    }
  }, [defaultAddrKey, deliveryAddress]);

  const saveAddresses = useCallback(async (next, key = addrKey) => {
    try {
      setAddresses(next);
      await AsyncStorage.setItem(key, JSON.stringify(next));
    } catch (e) {
      console.warn("saveAddresses failed:", e?.message);
    }
  }, [addrKey]);

  const setDefaultAddress = useCallback(async (addr) => {
    try {
      const val = String(addr || "").trim();
      setDefaultAddressState(val);
      await AsyncStorage.setItem(defaultAddrKey, JSON.stringify(val));
      if (val) setDeliveryAddress(val);
    } catch (e) {
      console.warn("setDefaultAddress failed:", e?.message);
    }
  }, [defaultAddrKey]);

  const addAddress = useCallback(async (addressText) => {
    const a = String(addressText || "").trim();
    if (!a) return;
    const next = Array.from(new Set([...(addresses || []), a]));
    await saveAddresses(next);
    if ((addresses || []).length === 0) {
      await setDefaultAddress(a);
    }
    setDeliveryAddress(a);
  }, [addresses, saveAddresses, setDefaultAddress]);

  const removeAddress = useCallback(async (addressText) => {
    const next = (addresses || []).filter((x) => x !== addressText);
    await saveAddresses(next);
    if (String(defaultAddress || "").trim() === String(addressText || "").trim()) {
      await setDefaultAddress("");
    }
    if (String(deliveryAddress || "").trim() === String(addressText || "").trim()) {
      setDeliveryAddress(next[0] || "");
    }
  }, [addresses, saveAddresses, deliveryAddress, defaultAddress, setDefaultAddress]);

  // derived
  const isLoggedIn = !!user?._id || !!user?.id || !!user?.email;
  const userId = useMemo(() => user?._id || user?.id || user?.email || "guest", [user]);

  // Loyalty state
  const [loyalty, setLoyalty] = useState(null);

  // wishlist persistence (client-side)
  const WISHLIST_KEY = "wishlist";
  const loadWishlist = useCallback(async () => {
    try {
      const json = await AsyncStorage.getItem(WISHLIST_KEY);
      const ids = json ? JSON.parse(json) : [];
      setWishlist(Array.isArray(ids) ? ids : []);
    } catch (e) {
      console.warn("loadWishlist failed:", e?.message);
      setWishlist([]);
    }
  }, []);

  const saveWishlist = useCallback(async (ids) => {
    try {
      setWishlist(ids);
      await AsyncStorage.setItem(WISHLIST_KEY, JSON.stringify(ids));
    } catch (e) {
      console.warn("saveWishlist failed:", e?.message);
    }
  }, []);

  const isInWishlist = useCallback(
    (productId) => (productId ? wishlist.includes(String(productId)) : false),
    [wishlist]
  );

  const toggleWishlist = useCallback(
    async (product) => {
      const productId = typeof product === "string" ? product : product?._id;
      if (!productId) return null;
      const idStr = String(productId);
      const exists = wishlist.includes(idStr);
      const next = exists ? wishlist.filter((id) => id !== idStr) : [...wishlist, idStr];
      await saveWishlist(next);
      return exists ? "removed" : "added";
    },
    [wishlist, saveWishlist]
  );

  // boot
  useEffect(() => {
    (async () => {
      try {
        await getToken(); // prime axios Authorization if token exists
        const u = await readUser();
        if (u) setUserState(u);

        await loadWishlist();
        // load addresses for current user
        const uid = (u?._id || u?.id || u?.email || "guest");
        await loadAddresses(`${ADDR_KEY_PREFIX}${uid}`);
        await loadDefaultAddress(`${DEFAULT_ADDR_KEY_PREFIX}${uid}`);

        // load persisted UI preferences
        try {
          const vm = await AsyncStorage.getItem("ui:viewMode");
          if (vm === "grid" || vm === "list") setViewMode(vm);
        } catch (e) {
          // ignore
        }

        const [prod, cats, bundlesResp] = await Promise.all([
          getProducts(),
          getCategories().catch(() => ({ data: [] })),
          getBundles().catch(() => ({ data: [] })),
        ]);

        setProducts(Array.isArray(prod?.data) ? prod.data : []);
        setBundles(Array.isArray(bundlesResp?.data) ? bundlesResp.data : []);
        
        const map = {};
        (cats.data || []).forEach((c) => {
          map[String(c._id)] = c.name || c.categoryName || "";
        });
        setCategoryMap(map);

        if (u) {
          await refreshAuthedData(u);
          // seed delivery address from user profile if available
          const seedAddr = String(u?.address || "").trim();
          if (seedAddr && !String(deliveryAddress || "").trim()) {
            setDeliveryAddress(seedAddr);
            // ensure seed address is saved
            const existing = (addresses || []);
            if (!existing.includes(seedAddr)) {
              await saveAddresses([seedAddr, ...existing]);
            }
          }
          // seed default address if not set
          if (seedAddr && !String(defaultAddress || "").trim()) {
            await setDefaultAddress(seedAddr);
          }
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

  // persist UI preferences
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem("ui:viewMode", String(viewMode || "grid"));
      } catch (e) {
        // ignore
      }
    })();
  }, [viewMode]);

  // reload addresses when user changes (e.g., after login/logout)
  useEffect(() => {
    loadAddresses();
  }, [addrKey, loadAddresses]);

  // reload default address when user changes
  useEffect(() => {
    loadDefaultAddress();
  }, [defaultAddrKey, loadDefaultAddress]);

  // keep deliveryAddress aligned with default when appropriate
  useEffect(() => {
    if (defaultAddress && (addresses || []).includes(defaultAddress)) {
      const current = String(deliveryAddress || "").trim();
      if (!current || !addresses.includes(current)) {
        setDeliveryAddress(defaultAddress);
      }
    }
  }, [defaultAddress, addresses]);

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
      setLoyalty(null);
    }
  },
  [user]
);

  // Auto-activate loyalty upon login/register and refresh loyalty state
  const refreshLoyalty = useCallback(async () => {
    try {
      const { data } = await getLoyaltyStatus();
      const current = data?.loyalty || null;
      let next = current;

      // Auto-issue card if eligible and not yet issued
      if (current?.isEligible && !current?.cardIssued) {
        try {
          await issueLoyaltyCard();
          // fetch updated digital card
          const cardRes = await getDigitalCard();
          const card = cardRes?.data?.card || null;
          next = { ...(current || {}), cardIssued: true, isActive: Boolean(card?.isActive), cardId: card?.cardId, cardType: card?.cardType, discountPercentage: card?.discountPercentage ?? current?.discountPercentage };

          // Inform user
          showToast({
            type: "success",
            message: "Loyalty activated",
            actionLabel: "View Card",
            onAction: () => router.push("/profile"),
          });
        } catch (e) {
          // If issuing fails, still set status so user can view
          next = current;
        }
      }

      setLoyalty(next);
    } catch (e) {
      setLoyalty(null);
    }
  }, [router]);

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

    // show success toast with action to view cart
    showToast({
      type: "success",
      message: "Product added to cart",
      actionLabel: "View Cart",
      onAction: () => router.push("/tabs/cart"),
    });
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

  // ---------------- BUNDLE ACTIONS ----------------
  const fetchBundleDetail = async (id) => {
    try {
      const res = await getBundleApi(id);
      setBundleDetail(res.data);
    } catch (e) {
      console.warn("fetchBundleDetail failed:", e.message);
      setBundleDetail(null);
    }
  };

  const handleAddBundleToCart = async (bundle) => {
    if (!bundle?.items || !Array.isArray(bundle.items)) {
      throw new Error("Invalid bundle data");
    }

    // Get all products from the bundle
    const bundleProducts = bundle.items.map(item => {
      const product = item.productId;
      if (!product) return null;
      
      return {
        productId: product._id,
        name: product.name,
        price: Number(product.price || 0),
        imageUrl: product.imageUrl || product.images?.[0] || "",
        quantity: Number(item.quantity || 1),
      };
    }).filter(Boolean);

    // Add each bundle product to cart (merge if already exists)
    let updated = [...cart];
    
    for (const bundleItem of bundleProducts) {
      const idx = updated.findIndex((i) => i.productId === bundleItem.productId);
      
      if (idx > -1) {
        // Product exists, increase quantity
        updated = updated.map((i, k) => 
          k === idx 
            ? { ...i, quantity: Number(i.quantity || 0) + Number(bundleItem.quantity) }
            : i
        );
      } else {
        // New product, add to cart
        updated.push(bundleItem);
      }
    }

    setCart(updated);
    await persistCart(updated);
  };

// ---------------- PLACE ORDER ----------------
// Accept options so checkout can pass deliveryType (e.g., "pickup") and address
const handlePlaceOrder = async (opts = {}) => {
  if (!ensureAuthed()) return { success: false, message: "Not logged in" };

  const {
    deliveryType: deliveryTypeInput,
    address: addressInput,
    total: totalInput,
    deliveryFee: deliveryFeeInput,
  } = opts || {};

  const deliveryType = String(deliveryTypeInput || "in-house");
  const addrRaw = addressInput != null ? String(addressInput) : String((deliveryAddress || ""));
  const addr = addrRaw.trim();

  // Require address for delivery types, but allow empty for pickup
  if (deliveryType !== "pickup" && !addr) {
    return { success: false, message: "Delivery address is required" };
  }
  
  // Calculate delivery fee based on delivery method
  const getDeliveryFee = (method) => {
    if (method === "pickup") return 0;
    if (method === "in-house") return 50;
    if (method === "third-party") return 80;
    return 50; // default
  };

  // Calculate totals (apply loyalty discount)
  const rawSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountedSubtotal = cartTotalAfterDiscount != null ? cartTotalAfterDiscount : rawSubtotal;
  const deliveryFee = Number.isFinite(Number(deliveryFeeInput)) ? Number(deliveryFeeInput) : getDeliveryFee(deliveryType);
  const total = Number.isFinite(Number(totalInput)) && Number(totalInput) > 0 ? Number(totalInput) : (discountedSubtotal + deliveryFee);

  try {
    // 🎯 CHECK PAYMENT METHOD
    if (paymentMethod === "E-Payment") {
      console.log("💳 E-Payment selected, redirecting to PayMongo...");
      
      try {
        // Build proper payload structure for E-Payment
        const ePaymentPayload = {
          items: cart.map(item => ({
            productId: item.productId || item._id,
            name: item.name,
            price: Number(item.price || 0),
            imageUrl: item.imageUrl || "",
            quantity: Number(item.quantity || 1)
          })),
          total: total,
          deliveryFee: deliveryFee,
          address: addr.trim(),
          deliveryType: deliveryType,
          channel: "multi" // Support all payment methods
        };

        console.log("📤 Sending E-Payment payload:", JSON.stringify(ePaymentPayload, null, 2));
        
        const response = await createEPaymentOrder(ePaymentPayload);
        console.log("✅ E-Payment response:", response.data);
        
        const checkoutUrl = response.data?.payment?.checkoutUrl;
        if (!checkoutUrl) {
          return { success: false, message: "Failed to create payment link" };
        }

        // Open PayMongo checkout
        console.log("🔗 Opening PayMongo URL:", checkoutUrl);
        const canOpen = await Linking.canOpenURL(checkoutUrl);
        
        if (canOpen) {
          await Linking.openURL(checkoutUrl);
          
          // Don't clear cart yet - wait for success callback
          return { 
            success: true, 
            message: "Redirecting to payment...",
            order: response.data,
            pending: true
          };
        } else {
          return { success: false, message: "Cannot open payment URL" };
        }
      } catch (error) {
        console.error("E-Payment error:", error.response?.data || error.message);
        return { 
          success: false, 
          message: error.response?.data?.message || "Payment processing failed. Please try again." 
        };
      }
      
    } else {
      // COD flow
      console.log("💵 COD payment selected");
      
      // Build proper payload structure for COD
      const codPayload = {
        items: cart.map(item => ({
          productId: item.productId || item._id,
          name: item.name,
          price: Number(item.price || 0),
          imageUrl: item.imageUrl || "",
          quantity: Number(item.quantity || 1)
        })),
        total: total,
        deliveryFee: deliveryFee,
        address: addr.trim(),
        deliveryType: deliveryType,
        paymentMethod: "COD"
      };

      console.log("📤 Sending COD payload:", JSON.stringify(codPayload, null, 2));
       
       const resp = await createMyOrder(codPayload);
      const order =
        resp?.data?._id ? resp.data : resp?.data?.order ? resp.data.order : resp?._id ? resp : null;
      if (!order?._id) return { success: false, message: "Order creation failed." };

      setOrders((prev) => (order ? [order, ...(prev || [])] : prev || []));
      setCart([]);
      setDeliveryAddress("");
      setGcashNumber("");

      refreshAuthedData?.(user);
      return { success: true, order };
    }
    
  } catch (e) {
    console.error("❌ Place order failed:", e?.message);
    return { 
      success: false, 
      message: e?.response?.data?.message || e?.message || "Order failed" 
    };
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

    // Register push token
    try {
      const expoToken = await registerForPushNotificationsAsync();
      if (expoToken) await registerPushToken(expoToken);
    } catch (e) {
      console.warn("push token register (login) failed:", e?.message);
    }

    setJustLoggedInName(u?.name || u?.email || "there");
    setJustRegistered(false);

    await mergeGuestCartInto(u);
    await refreshAuthedData(u);
    await refreshLoyalty();

    // Connect to socket for real-time messaging
    await socketService.connect();

    router.replace("/tabs/home");
  };

  const doRegister = async ({ name, email, password, address }) => {
    const resp = await apiRegister({ name, email, password, address });
    const { token, user: u } = resp.data || {};
    await setToken(token);
    await persistUser(u);
    setUserState(u);

    // Register push token
    try {
      const expoToken = await registerForPushNotificationsAsync();
      if (expoToken) await registerPushToken(expoToken);
    } catch (e) {
      console.warn("push token register (register) failed:", e?.message);
    }

    setJustLoggedInName(u?.name || u?.email || "there");
    setJustRegistered(true);

    await mergeGuestCartInto(u);
    await refreshAuthedData(u);
    await refreshLoyalty();

    // Connect to socket for real-time messaging
    await socketService.connect();

    router.replace("/tabs/home");
  };

  // Email verification flow: initiate registration without immediate login
  const doRegisterInitiate = async ({ name, email, password, address }) => {
    await initiateRegister({ name, email, password, address });
    setJustLoggedInName(name || email || "there");
    setJustRegistered(false);
    // Show info and route user to login; they can login after confirming via email
    Alert.alert(
      "Check your email",
      "We sent a verification link to your Gmail. Open it to confirm account creation. After confirming, return to the app to login.",
      [{ text: "OK", onPress: () => router.replace("/login") }]
    );
  };

  const doGoogleAuth = async ({ accessToken }) => {
    const resp = await googleAuth({ accessToken });
    const { token, user: u } = resp.data || {};
    await setToken(token);
    await persistUser(u);
    setUserState(u);

    try {
      const expoToken = await registerForPushNotificationsAsync();
      if (expoToken) await registerPushToken(expoToken);
    } catch (e) {
      console.warn("push token register (google) failed:", e?.message);
    }

    setJustLoggedInName(u?.name || u?.email || "there");
    setJustRegistered(!Boolean(u?._id));

    await mergeGuestCartInto(u);
    await refreshAuthedData(u);
    await refreshLoyalty();

    router.replace("/tabs/home");
  };

  const handleLogout = async () => {
    // Disconnect socket before clearing auth
    socketService.disconnect();
    
    await clearAuth();
    setUserState(null);
    setCart([]);
    setOrders([]);
    setLoyalty(null);
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

  const loyaltyDiscountPct = Number(loyalty?.discountPercentage || 0);
  const cartTotalAfterDiscount = useMemo(() => {
    const pct = loyaltyDiscountPct > 0 ? loyaltyDiscountPct : 0;
    return Math.max(0, cartTotal * (1 - pct / 100));
  }, [cartTotal, loyaltyDiscountPct]);

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
    loading, products, bundles, cart, setCart, orders, user,
    selectedCategory, setSelectedCategory,
    lastAddedCategory, setLastAddedCategory,
    searchQuery, setSearchQuery,
    viewMode, setViewMode,
    deliveryAddress, setDeliveryAddress,
    paymentMethod, setPaymentMethod,
    gcashNumber, setGcashNumber,
    addresses,
    defaultAddress,
    recoItems,
    justMergedFromGuest, setJustMergedFromGuest,
    justLoggedInName, setJustLoggedInName,
    justRegistered, setJustRegistered,

    // derived
    isLoggedIn, categories, filteredProducts, recommendedProducts, cartTotal, loyaltyDiscountPct, cartTotalAfterDiscount,

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
    doRegisterInitiate,
    doGoogleAuth,
    refreshAuthedData,
    refreshLoyalty,

    // product & reviews
    productDetail,
    fetchProductDetail,
    submitReview,
    myReviews,
    fetchMyReviews,

    // wishlist
    wishlist,
    toggleWishlist,
    isInWishlist,

    // bundles
    bundleDetail,
    fetchBundleDetail,
    handleAddBundleToCart,

    // helpers
    categoryMap,
    categoryLabelOf,
    toAbsoluteUrl,
    setUserState,
    persistUser,

    // loyalty
    loyalty,

    // toast helpers
    showToast,
    hideToast,

     // deliveries
    listMyDeliveries,
    getDeliveryForOrder,
    getDriverContact,

    // addresses helpers
    addAddress,
    removeAddress,
    saveAddresses,
    setDefaultAddress,
  };

  return (
    <AppCtx.Provider value={value}>
      {children}
      <Toast
        visible={toastVisible}
        type={toastType}
        message={toastMessage}
        actionLabel={toastActionLabel}
        onAction={toastAction}
        onClose={hideToast}
      />
    </AppCtx.Provider>
  );
}