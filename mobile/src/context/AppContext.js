import { useRouter } from "expo-router";
import { createContext, useCallback, useEffect, useMemo, useState, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import { Alert } from "react-native";
import Toast from "../../components/Toast";
import { configureGoogleSignIn, signInWithGoogle } from "../config/googleSignIn";
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
  getWishlistApi,
  addToWishlistApi,
  removeFromWishlistApi,
  toggleWishlistApi,
  getLoyaltyStatus,
  issueLoyaltyCard,
  getDigitalCard,
  getAvailableRewards,
  redeemReward,
  getRedemptionHistory,
} from "../api/apiClient";
import { imageCache } from "../utils/imageCache";
// import { registerPushToken } from "../api/apiClient";
// import { registerForPushNotificationsAsync } from "../utils/notifications";
import { clearCart, loadCart, saveCart } from "./cartOrdersServices";
import socketService from "../services/socketService";

export const AppCtx = createContext(null);

export default function AppProvider({ children }) {
  const router = useRouter();
  const initRef = useRef(false);

  // data state - MOVED BEFORE INITIALIZATION
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
  }, []);

  // Ref-based initialization since useEffect doesn't run in SSR
  if (!initRef.current) {
    console.log("🚀 APPCONTEXT REF INIT: Starting initialization...");
    initRef.current = true;
    
    // Configure Google Sign-In
    try {
      configureGoogleSignIn();
      console.log("🚀 APPCONTEXT REF INIT: Google Sign-In configured successfully");
    } catch (error) {
      console.error("🚀 APPCONTEXT REF INIT: Google Sign-In configuration failed:", error);
    }
    
    // Initialize products immediately
    Promise.resolve().then(async () => {
      try {
        console.log("🚀 APPCONTEXT REF INIT: About to call getProducts()...");
        const prod = await getProducts();
        console.log("🚀 APPCONTEXT REF INIT: getProducts() SUCCESS:", prod);
        console.log("🚀 APPCONTEXT REF INIT: Products data:", prod?.data);
        console.log("🚀 APPCONTEXT REF INIT: Products length:", prod?.data?.length);
        
        const productsArray = Array.isArray(prod?.data) ? prod.data : [];
        console.log("🚀 APPCONTEXT REF INIT: Setting products array:", productsArray);
        console.log("🚀 APPCONTEXT REF INIT: Products array length:", productsArray.length);
        setProducts(productsArray);
      } catch (error) {
        console.error("🚀 APPCONTEXT REF INIT: getProducts() failed:", error);
        console.error("🚀 APPCONTEXT REF INIT: Error details:", error.message, error.stack);
        setProducts([]);
      }
     });
   }

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

  const loadAddresses = useCallback(async (key) => {
    try {
      const json = await AsyncStorage.getItem(key);
      const arr = json ? JSON.parse(json) : [];
      setAddresses(Array.isArray(arr) ? arr : []);
    } catch (e) {
      console.warn("loadAddresses failed:", e?.message);
      setAddresses([]);
    }
  }, []);

  const loadDefaultAddress = useCallback(async (key) => {
    try {
      const raw = await AsyncStorage.getItem(key);
      const val = raw ? JSON.parse(raw) : "";
      const addr = typeof val === "string" ? val : String(val || "");
      setDefaultAddressState(addr);
      // Note: We don't set deliveryAddress here to avoid circular dependency
      // The useEffect below will handle syncing deliveryAddress with defaultAddress
    } catch (e) {
      console.warn("loadDefaultAddress failed:", e?.message);
      setDefaultAddressState("");
    }
  }, []);

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
  
  // Reward state
  const [availableRewards, setAvailableRewards] = useState([]);
  const [redemptionHistory, setRedemptionHistory] = useState([]);
  const [rewardsLoading, setRewardsLoading] = useState(false);
  
  // Reward redemption state
  const [appliedReward, setAppliedReward] = useState(null);
  const [rewardDiscount, setRewardDiscount] = useState(0);

  // wishlist persistence (backend API)
  const loadWishlist = useCallback(async () => {
    try {
      if (!isLoggedIn) {
        // For guest users, use local storage as fallback
        const json = await AsyncStorage.getItem("wishlist");
        const ids = json ? JSON.parse(json) : [];
        setWishlist(Array.isArray(ids) ? ids : []);
        return;
      }
      
      const response = await getWishlistApi();
      const wishlistItems = response.data?.wishlist || [];
      // Store full product objects for display, not just IDs
      setWishlist(wishlistItems);
      
      // Preload wishlist images for better performance
      const imageUrls = wishlistItems
        .map(item => item?.imageUrl)
        .filter(Boolean)
        .map(url => toAbsoluteUrl(url));
      
      if (imageUrls.length > 0) {
        imageCache.preloadBatch(imageUrls).catch(e => 
          console.warn("Wishlist image preload failed:", e?.message)
        );
      }
    } catch (e) {
      console.warn("loadWishlist failed:", e?.message);
      setWishlist([]);
    }
  }, [isLoggedIn]);

  const isInWishlist = useCallback(
    (productId) => {
      if (!productId) return false;
      // Check if product exists in wishlist (wishlist now contains full objects)
      return wishlist.some(item => String(item._id || item) === String(productId));
    },
    [wishlist]
  );

  const toggleWishlist = useCallback(
    async (product) => {
      console.log("🔥 WISHLIST DEBUG: toggleWishlist called with:", product);
      const productId = typeof product === "string" ? product : product?._id;
      console.log("🔥 WISHLIST DEBUG: productId:", productId);
      console.log("🔥 WISHLIST DEBUG: isLoggedIn:", isLoggedIn);
      console.log("🔥 WISHLIST DEBUG: current wishlist:", wishlist);
      
      if (!productId) {
        console.log("🔥 WISHLIST DEBUG: No productId, returning null");
        return null;
      }
      
      try {
        if (!isLoggedIn) {
          console.log("🔥 WISHLIST DEBUG: Guest user - using local storage");
          // For guest users, use local storage (store IDs only for guests)
          const idStr = String(productId);
          const exists = wishlist.some(item => String(item._id || item) === idStr);
          console.log("🔥 WISHLIST DEBUG: Product exists in wishlist:", exists);
          const next = exists ? wishlist.filter((item) => String(item._id || item) !== idStr) : [...wishlist, idStr];
          console.log("🔥 WISHLIST DEBUG: Next wishlist state:", next);
          setWishlist(next);
          await AsyncStorage.setItem("wishlist", JSON.stringify(next));
          const action = exists ? "removed" : "added";
          console.log("🔥 WISHLIST DEBUG: Guest action:", action);
          return action;
        }

        console.log("🔥 WISHLIST DEBUG: Logged in user - calling API");
        const response = await toggleWishlistApi(productId);
        console.log("🔥 WISHLIST DEBUG: API response:", response);
        const action = response.data?.action; // 'added' or 'removed'
        console.log("🔥 WISHLIST DEBUG: API action:", action);
        
        // Reload wishlist to get updated full product objects
        await loadWishlist();
        
        return action;
      } catch (e) {
        console.error("🔥 WISHLIST DEBUG: toggleWishlist failed:", e);
        console.error("🔥 WISHLIST DEBUG: Error message:", e?.message);
        console.error("🔥 WISHLIST DEBUG: Error response:", e?.response);
        console.warn("toggleWishlist failed:", e?.message);
        showToast({ 
          type: "error", 
          message: "Failed to update wishlist. Please try again." 
        });
        return null;
      }
    },
    [wishlist, isLoggedIn, showToast, loadWishlist]
  );

  console.log("🔥 APPCONTEXT: About to register boot useEffect...");

  // boot
  useEffect(() => {
    console.log("🚀🚀🚀 APPCONTEXT USEEFFECT: Starting initialization...");
    console.warn("🚀🚀🚀 APPCONTEXT USEEFFECT: Starting initialization...");
    console.log("🚀 APPCONTEXT BOOT: Starting initialization...");
    (async () => {
      try {
        console.log("🚀 APPCONTEXT BOOT: Getting token...");
        await getToken(); // prime axios Authorization if token exists
        console.log("🚀 APPCONTEXT BOOT: Reading user...");
        const u = await readUser();
        if (u) {
          console.log("🚀 APPCONTEXT BOOT: User found:", u);
          setUserState(u);
        } else {
          console.log("🚀 APPCONTEXT BOOT: No user found");
        }

        console.log("🚀 APPCONTEXT BOOT: Loading wishlist...");
        await loadWishlist();
        // load addresses for current user
        const uid = (u?._id || u?.id || u?.email || "guest");
        console.log("🚀 APPCONTEXT BOOT: Loading addresses for uid:", uid);
        await loadAddresses(`${ADDR_KEY_PREFIX}${uid}`);
        await loadDefaultAddress(`${DEFAULT_ADDR_KEY_PREFIX}${uid}`);

        // load persisted UI preferences
        try {
          const vm = await AsyncStorage.getItem("ui:viewMode");
          if (vm === "grid" || vm === "list") setViewMode(vm);
        } catch (e) {
          // ignore
        }

        console.log("🚀 APPCONTEXT BOOT: Starting API calls...");
        let prod, cats, bundlesResp;
        try {
          console.log("🚀 APPCONTEXT BOOT: About to call getProducts()...");
          prod = await getProducts();
          console.log("🚀 APPCONTEXT BOOT: getProducts() SUCCESS:", prod);
          console.log("🚀 APPCONTEXT BOOT: Products data:", prod?.data);
          console.log("🚀 APPCONTEXT BOOT: Products length:", prod?.data?.length);
        } catch (error) {
          console.error("🚀 APPCONTEXT BOOT: getProducts() failed:", error);
          console.error("🚀 APPCONTEXT BOOT: Error details:", error.message, error.stack);
          console.error("🚀 APPCONTEXT BOOT: Error response:", error.response);
          prod = { data: [] };
        }

        try {
          console.log("🚀 APPCONTEXT BOOT: About to call getCategories()...");
          cats = await getCategories();
          console.log("🚀 APPCONTEXT BOOT: getCategories() SUCCESS:", cats);
        } catch (error) {
          console.error("🚀 APPCONTEXT BOOT: getCategories() failed:", error);
          cats = { data: [] };
        }

        try {
          console.log("🚀 APPCONTEXT BOOT: About to call getBundles()...");
          bundlesResp = await getBundles();
          console.log("🚀 APPCONTEXT BOOT: getBundles() SUCCESS:", bundlesResp);
        } catch (error) {
          console.error("🚀 APPCONTEXT BOOT: getBundles() failed:", error);
          bundlesResp = { data: [] };
        }

        const productsArray = Array.isArray(prod?.data) ? prod.data : [];
        console.log("🚀 APPCONTEXT BOOT: Setting products array:", productsArray);
        console.log("🚀 APPCONTEXT BOOT: Products array length:", productsArray.length);
        setProducts(productsArray);
        
        // Preload product images for better performance
        const productImageUrls = productsArray
          .map(item => item?.imageUrl)
          .filter(Boolean)
          .map(url => toAbsoluteUrl(url))
          .slice(0, 20); // Limit to first 20 images to avoid overwhelming the cache
        
        if (productImageUrls.length > 0) {
          imageCache.preloadBatch(productImageUrls).catch(e => 
            console.warn("Product image preload failed:", e?.message)
          );
        }
        
        const bundlesArray = Array.isArray(bundlesResp?.data) ? bundlesResp.data : [];
        console.log("🚀 APPCONTEXT BOOT: Setting bundles array:", bundlesArray);
        console.log("🚀 APPCONTEXT BOOT: Bundles array length:", bundlesArray.length);
        setBundles(bundlesArray);
        
        const map = {};
        (cats.data || []).forEach((c) => {
          map[String(c._id)] = c.name || c.categoryName || "";
        });
        console.log("🚀 APPCONTEXT BOOT: Setting category map:", map);
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
    loadAddresses(addrKey);
  }, [addrKey]);

  // reload default address when user changes
  useEffect(() => {
    loadDefaultAddress(defaultAddrKey);
  }, [defaultAddrKey]);

  // Note: Removed automatic deliveryAddress sync to prevent infinite loops
  // Users can manually select their delivery address from the saved addresses

  // fetch AI recommendations whenever user/cart changes
  const cartProductIds = useMemo(() => 
    (cart || []).map((i) => i?.productId).filter(Boolean).join(","), 
    [cart]
  );
  
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
  }, [userId, cartProductIds]);

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

  // Load available rewards
  const loadAvailableRewards = useCallback(async () => {
    if (!isLoggedIn) return;
    
    try {
      setRewardsLoading(true);
      const response = await getAvailableRewards();
      setAvailableRewards(response.data?.rewards || []);
    } catch (error) {
      console.error('Failed to load available rewards:', error);
      setAvailableRewards([]);
    } finally {
      setRewardsLoading(false);
    }
  }, [isLoggedIn]);

  // Load redemption history
  const loadRedemptionHistory = useCallback(async () => {
    if (!isLoggedIn) return;
    
    try {
      const response = await getRedemptionHistory();
      setRedemptionHistory(response.data?.redemptions || []);
    } catch (error) {
      console.error('Failed to load redemption history:', error);
      setRedemptionHistory([]);
    }
  }, [isLoggedIn]);

  // Redeem a reward
  const handleRedeemReward = useCallback(async (rewardName) => {
    if (!isLoggedIn) {
      showToast({
        type: "error",
        message: "Please login to redeem rewards"
      });
      return false;
    }

    try {
      setRewardsLoading(true);
      const response = await redeemReward(rewardName);
      
      if (response.data?.success) {
        showToast({
          type: "success",
          message: response.data.message || "Reward redeemed successfully!"
        });
        
        // Refresh loyalty status and rewards
        await refreshLoyalty();
        await loadAvailableRewards();
        await loadRedemptionHistory();
        
        return true;
      } else {
        showToast({
          type: "error",
          message: response.data?.message || "Failed to redeem reward"
        });
        return false;
      }
    } catch (error) {
      console.error('Failed to redeem reward:', error);
      showToast({
        type: "error",
        message: error.response?.data?.message || "Failed to redeem reward"
      });
      return false;
    } finally {
      setRewardsLoading(false);
    }
  }, [isLoggedIn, showToast, refreshLoyalty]);

  // Apply reward for checkout discount
  const applyRewardDiscount = useCallback((reward) => {
    if (!reward || !reward.discountAmount) return;
    
    setAppliedReward(reward);
    setRewardDiscount(Number(reward.discountAmount));
    
    showToast({
      type: "success",
      message: `Applied ${reward.name} - ₱${reward.discountAmount} discount!`
    });
  }, [showToast]);

  // Remove applied reward
  const removeRewardDiscount = useCallback(() => {
    setAppliedReward(null);
    setRewardDiscount(0);
    
    showToast({
      type: "info",
      message: "Reward discount removed"
    });
  }, [showToast]);

  // Clear reward discount (called after successful order)
  const clearRewardDiscount = useCallback(() => {
    setAppliedReward(null);
    setRewardDiscount(0);
  }, []);

  // ensureAuthedguard with alert
  const ensureAuthed = () => {
    if (!isLoggedIn) {
      // TODO: Replace with web-compatible alert
      // Alert.alert(
      //   "Login Required",
      //   "You need to login or create an account to continue.",
      //   [
      //     { text: "Cancel", style: "cancel" },
      //     { text: "Login", onPress: () => router.push("/login") },
      //   ]
      // );
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
    // Check if product is out of stock
    if (product.stock === 0 || product.stock < 0) {
      showToast({
        type: "error",
        message: "This product is out of stock",
      });
      return;
    }

    // Check if adding one more would exceed available stock
    const idx = cart.findIndex((i) => i.productId === product._id);
    const currentQuantity = idx > -1 ? cart[idx].quantity : 0;
    const newQuantity = currentQuantity + 1;

    if (product.stock && newQuantity > product.stock) {
      showToast({
        type: "error",
        message: `Only ${product.stock} items available in stock`,
      });
      return;
    }

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
    const product = products.find((p) => p._id === productId);
    
    // Check stock availability
    if (product && product.stock && Number(current) + 1 > product.stock) {
      showToast({
        type: "error",
        message: `Only ${product.stock} items available in stock`,
      });
      return;
    }
    
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
  const fetchBundles = async () => {
    try {
      console.log("🔍 fetchBundles: Starting to fetch bundles...");
      const res = await getBundles();
      console.log("🔍 fetchBundles: Raw response:", res);
      console.log("🔍 fetchBundles: Response data:", res?.data);
      const bundlesArray = Array.isArray(res?.data) ? res.data : [];
      console.log("🔍 fetchBundles: Bundles array:", bundlesArray);
      console.log("🔍 fetchBundles: Bundles array length:", bundlesArray.length);
      setBundles(bundlesArray);
      console.log("🔍 fetchBundles: Bundles set successfully");
    } catch (e) {
      console.warn("fetchBundles failed:", e.message);
      console.error("fetchBundles error details:", e);
      setBundles([]);
    }
  };

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
  console.log("🔥 ORDER PLACEMENT DEBUG: handlePlaceOrder called with:", opts);
  console.log("🔥 ORDER PLACEMENT DEBUG: isLoggedIn:", isLoggedIn);
  console.log("🔥 ORDER PLACEMENT DEBUG: user:", user);
  console.log("🔥 ORDER PLACEMENT DEBUG: cart:", cart);
  
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

  console.log("🔥 ORDER PLACEMENT DEBUG: deliveryType:", deliveryType);
  console.log("🔥 ORDER PLACEMENT DEBUG: address:", addr);
  console.log("🔥 ORDER PLACEMENT DEBUG: paymentMethod:", paymentMethod);

  // Require address for delivery types, but allow empty for pickup
  if (deliveryType !== "pickup" && !addr) {
    console.log("🔥 ORDER PLACEMENT DEBUG: No delivery address provided");
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

  console.log("🔥 ORDER PLACEMENT DEBUG: Calculated values:");
  console.log("🔥 ORDER PLACEMENT DEBUG: rawSubtotal:", rawSubtotal);
  console.log("🔥 ORDER PLACEMENT DEBUG: discountedSubtotal:", discountedSubtotal);
  console.log("🔥 ORDER PLACEMENT DEBUG: deliveryFee:", deliveryFee);
  console.log("🔥 ORDER PLACEMENT DEBUG: total:", total);

  try {
    // 🎯 CHECK PAYMENT METHOD
    if (paymentMethod === "E-Payment") {
      console.log("🔥 ORDER PLACEMENT DEBUG: E-Payment selected, redirecting to PayMongo...");
      
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

        console.log("🔥 ORDER PLACEMENT DEBUG: E-Payment payload:", ePaymentPayload);

        console.log("📤 Sending E-Payment payload:", JSON.stringify(ePaymentPayload, null, 2));
        
        console.log("🔥 ORDER PLACEMENT DEBUG: Calling createEPaymentOrder API...");
        const response = await createEPaymentOrder(ePaymentPayload);
        console.log("🔥 ORDER PLACEMENT DEBUG: E-Payment API response:", response);
        console.log("🔥 ORDER PLACEMENT DEBUG: E-Payment response data:", response.data);
        
        const checkoutUrl = response.data?.payment?.checkoutUrl;
        console.log("🔥 ORDER PLACEMENT DEBUG: Extracted checkoutUrl:", checkoutUrl);
        
        if (!checkoutUrl) {
          console.log("🔥 ORDER PLACEMENT DEBUG: No checkout URL found in response");
          return { success: false, message: "Failed to create payment link" };
        }

        // Open PayMongo checkout
        console.log("🔥 ORDER PLACEMENT DEBUG: Opening PayMongo URL:", checkoutUrl);
        const canOpen = await Linking.canOpenURL(checkoutUrl);
        console.log("🔥 ORDER PLACEMENT DEBUG: Can open URL:", canOpen);
        
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
          console.log("🔥 ORDER PLACEMENT DEBUG: Cannot open payment URL");
          return { success: false, message: "Cannot open payment URL" };
        }
      } catch (error) {
        console.log("🔥 ORDER PLACEMENT DEBUG: E-Payment error:", error);
        console.log("🔥 ORDER PLACEMENT DEBUG: E-Payment error response:", error.response);
        console.log("🔥 ORDER PLACEMENT DEBUG: E-Payment error data:", error.response?.data);
        return { 
          success: false, 
          message: error.response?.data?.message || "Payment processing failed. Please try again." 
        };
      }
      
    } else {
      // COD flow
      console.log("🔥 ORDER PLACEMENT DEBUG: COD payment selected");
      
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

      console.log("🔥 ORDER PLACEMENT DEBUG: COD payload:", codPayload);
      console.log("🔥 ORDER PLACEMENT DEBUG: Calling createMyOrder API...");
       
       const resp = await createMyOrder(codPayload);
      console.log("🔥 ORDER PLACEMENT DEBUG: COD API response:", resp);
      
      const order =
        resp?.data?._id ? resp.data : resp?.data?.order ? resp.data.order : resp?._id ? resp : null;
      console.log("🔥 ORDER PLACEMENT DEBUG: Extracted order:", order);
      
      if (!order?._id) {
        console.log("🔥 ORDER PLACEMENT DEBUG: No order ID found, creation failed");
        return { success: false, message: "Order creation failed." };
      }

      console.log("🔥 ORDER PLACEMENT DEBUG: Order created successfully, updating state...");
      setOrders((prev) => (order ? [order, ...(prev || [])] : prev || []));
      setCart([]);
      setDeliveryAddress("");
      setGcashNumber("");
      clearRewardDiscount(); // Clear applied reward discount

      refreshAuthedData?.(user);
      console.log("🔥 ORDER PLACEMENT DEBUG: COD order completed successfully");
      return { success: true, order };
    }
    
  } catch (e) {
    console.log("🔥 ORDER PLACEMENT DEBUG: Place order failed with error:", e);
    console.log("🔥 ORDER PLACEMENT DEBUG: Error message:", e?.message);
    console.log("🔥 ORDER PLACEMENT DEBUG: Error response:", e?.response);
    console.log("🔥 ORDER PLACEMENT DEBUG: Error response data:", e?.response?.data);
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
    // TODO: Replace with web-compatible alert
    // Alert.alert(
    //   "Check your email",
    //   "We sent a verification link to your Gmail. Open it to confirm account creation. After confirming, return to the app to login.",
    //   [{ text: "OK", onPress: () => router.replace("/login") }]
    // );
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

    // Connect to socket for real-time messaging
    await socketService.connect();

    router.replace("/tabs/home");
  };

  const doGoogleRegister = async () => {
    try {
      const googleSignInResult = await signInWithGoogle();
      const { accessToken } = googleSignInResult;
      
      // Use the existing Google auth endpoint which handles both login and registration
      await doGoogleAuth({ accessToken });
    } catch (error) {
      console.error("Google registration failed:", error);
      throw error;
    }
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
    if (typeof c === "string") {
      // First check if it's a valid category name (not an ID)
      // Category IDs are typically long hex strings, category names are readable
      if (c.length < 20 && !/^[0-9a-f]{24}$/i.test(c)) {
        return c; // It's already a category name
      }
      // Otherwise, try to look it up in categoryMap (it's an ID)
      return categoryMap[c] || c;
    }
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
    const result = lastAddedCategory
      ? (products || []).filter((p) => categoryLabelOf(p) === lastAddedCategory).slice(0, 3)
      : (products || []).slice(0, 3);
    
    return result;
  }, [products, lastAddedCategory, categoryMap]);

  const cartTotal = useMemo(
    () => cart.reduce((s, it) => s + Number(it.price || 0) * Number(it.quantity || 0), 0),
    [cart]
  );

  const loyaltyDiscountPct = Number(loyalty?.discountPercentage || 0);
  const cartTotalAfterDiscount = useMemo(() => {
    const pct = loyaltyDiscountPct > 0 ? loyaltyDiscountPct : 0;
    const afterLoyaltyDiscount = cartTotal * (1 - pct / 100);
    const afterRewardDiscount = Math.max(0, afterLoyaltyDiscount - rewardDiscount);
    return Math.max(0, afterRewardDiscount);
  }, [cartTotal, loyaltyDiscountPct, rewardDiscount]);

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
      // TODO: Replace with web-compatible alert
      // Alert.alert(
      //   "Login Required",
      //   "You need to login or create an account before posting a review.",
      //   [
      //     { text: "Cancel", style: "cancel" },
      //     { text: "Login", onPress: () => router.push("/login") },
      //   ]
      // );
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
    doGoogleRegister,
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
    loadWishlist,
    toggleWishlist,
    isInWishlist,

    // bundles
    bundleDetail,
    fetchBundles,
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

    // rewards
    availableRewards,
    redemptionHistory,
    rewardsLoading,
    loadAvailableRewards,
    loadRedemptionHistory,
    handleRedeemReward,
    
    // reward redemption
    appliedReward,
    rewardDiscount,
    applyRewardDiscount,
    removeRewardDiscount,
    clearRewardDiscount,

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

    // WebSocket methods
    socketService,
  };

  console.log("🔥 APPCONTEXT: About to return JSX...");

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