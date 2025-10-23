import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useContext, useEffect, useState, useRef } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors, Radii, ResponsiveUtils } from "../../constants/theme";
import { AppCtx } from "../context/AppContext";

export default function HomeScreen() {
  const {
    recommendedProducts,
    categories, // Get categories from context
    products,
    bundles,
    user,
    justLoggedInName,
    setJustLoggedInName,
    justRegistered,
    setJustRegistered,
    toAbsoluteUrl,
    toggleWishlist,
    isInWishlist,
    setSelectedCategory,
    loyalty,
    socketService,
    refreshAuthedData,
  } = useContext(AppCtx);

  // Local state for real-time product updates
  const [realtimeProducts, setRealtimeProducts] = useState(products || []);
  const socketListenersRef = useRef(false);

  const { width } = Dimensions.get('window');

  // Debug logging
  console.log("HomeScreen DEBUG: products:", products);
  console.log("HomeScreen DEBUG: products length:", products?.length);
  console.log("HomeScreen DEBUG: recommendedProducts:", recommendedProducts);
  console.log("HomeScreen DEBUG: recommendedProducts length:", recommendedProducts?.length);

  // show banner once after login/register
  const [showWelcome, setShowWelcome] = useState(false);
  const fadeAnim = new Animated.Value(0);

  // Update local products when context products change
  useEffect(() => {
    setRealtimeProducts(products || []);
  }, [products]);

  // Setup WebSocket listeners for real-time updates
  useEffect(() => {
    if (socketService && user && !socketListenersRef.current) {
      console.log('🔌 Setting up WebSocket listeners for HomeScreen');
      
      // Listen for inventory updates
      socketService.onInventoryUpdate((data) => {
        console.log('📦 Inventory update received:', data);
        const { productId, stock, price } = data;
        
        setRealtimeProducts(prev => 
          prev.map(product => 
            product._id === productId 
              ? { 
                  ...product, 
                  stock: stock !== undefined ? stock : product.stock,
                  price: price !== undefined ? price : product.price 
                }
              : product
          )
        );
      });

      // Listen for new products
      socketService.onInventoryCreated((newProduct) => {
        console.log('✨ New product created:', newProduct);
        setRealtimeProducts(prev => [newProduct, ...prev]);
      });

      // Listen for deleted products
      socketService.onInventoryDeleted((data) => {
        console.log('🗑️ Product deleted:', data);
        const { productId } = data;
        
        setRealtimeProducts(prev => 
          prev.filter(product => product._id !== productId)
        );
      });

      socketListenersRef.current = true;
    }

    return () => {
      // Cleanup listeners when component unmounts
      if (socketService && socketListenersRef.current) {
        console.log('🧹 Cleaning up WebSocket listeners for HomeScreen');
        socketService.off('inventory:update');
        socketService.off('inventory:created');
        socketService.off('inventory:deleted');
        socketListenersRef.current = false;
      }
    };
  }, [socketService, user?._id]);

  useEffect(() => {
    if (justLoggedInName) {
      setShowWelcome(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
      
      const t = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setShowWelcome(false);
          setJustLoggedInName(null);
          setJustRegistered(false);
        });
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [justLoggedInName]);

  const logout = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove(["pos-token", "pos-user"]);
          Alert.alert("Success", "Signed out successfully");
          router.replace("/login");
        },
      },
    ]);
  };

  const ProductCard = ({ product }) => {
    
    const rawImg = product?.imageUrl || product?.images?.[0] || null;
    const img = rawImg ? (toAbsoluteUrl?.(rawImg) || rawImg) : null;
    const saved = isInWishlist?.(product?._id);

    return (
      <TouchableOpacity 
        style={styles.productCard} 
        activeOpacity={0.8}
        onPress={() => router.push(`/product-detail?id=${product._id}`)}
      >
        <View style={styles.productImageContainer}>
          {img ? (
            <Image source={{ uri: img }} style={styles.productImage} resizeMode="cover" />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Text style={styles.productImageText}>📦</Text>
            </View>
          )}
          
          {/* Heart toggle (top-right) */}
          <TouchableOpacity
            onPress={async (e) => {
              e.stopPropagation?.();
              const action = await toggleWishlist?.(product?._id);
              if (action === "added") Alert.alert("Added to wishlist");
              else if (action === "removed") Alert.alert("Removed from wishlist");
            }}
            activeOpacity={0.7}
            style={[styles.wishlistHeart, saved && styles.wishlistHeartActive]}
          >
            <Text style={[styles.wishlistHeartIcon, saved && styles.wishlistHeartIconActive]}>
              {saved ? "♥" : "♡"}
            </Text>
          </TouchableOpacity>

          {/* Price badge (bottom-left) */}
          <View style={styles.priceTag}>
            <Text style={styles.priceTagText}>₱{Number(product?.price || 0).toFixed(2)}</Text>
          </View>

          {/* Rating badge (bottom-right) */}
          <View style={styles.ratingChip}>
            <Text style={styles.ratingChipText}>⭐ {product?.averageRating || '4.5'}</Text>
          </View>

          {/* Real-time stock indicator */}
          {product.stock !== undefined && (
            <View style={[
              styles.stockBadge, 
              product.stock === 0 && styles.outOfStockBadge,
              product.stock > 0 && product.stock <= 5 && styles.lowStockBadge,
              product.stock > 5 && product.stock <= 10 && styles.mediumStockBadge
            ]}>
              <Text style={[
                styles.stockBadgeText,
                product.stock === 0 && styles.outOfStockText,
                product.stock > 0 && product.stock <= 10 && styles.lowStockText
              ]}>
                {product.stock === 0 ? 'Out of Stock' : 
                 product.stock <= 5 ? `${product.stock} left` :
                 product.stock <= 10 ? 'Low Stock' : 'In Stock'}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {product.name}
          </Text>
          <View style={styles.productMeta}>
            <Text style={styles.productCategory} numberOfLines={1}>
              {product.category || 'General'}
            </Text>
            {product.stock !== undefined && (
              <Text style={[
                styles.stockIndicator, 
                product.stock === 0 && styles.outOfStock,
                product.stock > 0 && product.stock <= 10 && styles.lowStock
              ]}>
                {product.stock === 0 ? 'Out of Stock' :
                 product.stock <= 10 ? 'Low Stock' : 'In Stock'}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Category icons mapping
  const getCategoryIcon = (category) => {
    const icons = {
      'All': '🛍️',
      'Seeds': '🌱',
      'new code': '💻',
      'neee': '✨',
      'Electronics': '📱',
      'Fashion': '👕',
      'Home': '🏡',
      'Sports': '⚽',
      'Books': '📚',
      'Health': '💊',
      'Food': '🍕',
    };
    return icons[category] || '📂';
  };

  const getCategoryColor = (index) => {
    const colors = [
      '#10B981', '#3B82F6', '#F59E0B', '#EF4444', 
      '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'
    ];
    return colors[index % colors.length];
  };

  const CategoryCard = ({ category, index }) => (
    <TouchableOpacity
      style={styles.categoryChip}
      onPress={() => {
        setSelectedCategory?.(category);
        router.push('/tabs/products');
      }}
      activeOpacity={0.8}
    >
      <View style={[styles.categoryChipIconWrap, { backgroundColor: getCategoryColor(index) }]}>
        <Text style={styles.categoryChipIcon}>{getCategoryIcon(category)}</Text>
      </View>
      <Text style={styles.categoryChipLabel} numberOfLines={1}>{category}</Text>
    </TouchableOpacity>
  );

  const OfferCard = ({ data }) => {
    const isBundle = data?.type === 'bundle';
    const item = data?.item || {};
    const name = isBundle ? (item?.name || 'Bundle') : (item?.name || 'Product');
    const price = isBundle
      ? Number(item?.totalPrice || item?.items?.reduce((s, it) => s + Number(it?.productId?.price || 0) * Number(it?.quantity || 1), 0) || 0)
      : Number(item?.price || 0);
    const img = isBundle
      ? (item?.imageUrl || item?.coverImage || '')
      : (item?.imageUrl || item?.images?.[0] || '');
    const uri = img ? (toAbsoluteUrl?.(img) || img) : null;

    return (
      <TouchableOpacity
        style={styles.offerCard}
        activeOpacity={0.85}
        onPress={() => {
          if (isBundle) {
            router.push(`/bundle-detail?id=${item?._id || ''}`);
          } else {
            router.push(`/product-detail?id=${item?._id || ''}`);
          }
        }}
      >
        <View style={styles.offerImageWrap}>
          {uri ? (
            <Image source={{ uri }} style={styles.offerImage} resizeMode="cover" />
          ) : (
            <View style={styles.offerImagePlaceholder}><Text style={{ fontSize: 28 }}>🛍️</Text></View>
          )}
          {isBundle && (
            <View style={styles.bundleTag}><Text style={styles.bundleTagText}>Bundle</Text></View>
          )}
        </View>
        <View style={styles.offerInfo}>
          <Text numberOfLines={1} style={styles.offerName}>{name}</Text>
          <Text style={styles.offerPrice}>₱{price.toFixed(2)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Build Best Offers: mix top bundles and cheapest products (using real-time data)
  const bestOffers = (() => {
    const bundleCards = (bundles || [])
      .slice(0, 4)
      .map((b) => ({ type: 'bundle', item: b }));
    const cheapest = [...(realtimeProducts || [])]
      .sort((a, b) => Number(a?.price || 0) - Number(b?.price || 0))
      .slice(0, 6)
      .map((p) => ({ type: 'product', item: p }));
    return [...bundleCards, ...cheapest].slice(0, 8);
  })();

  const FeatureCard = ({ title, subtitle, onPress, icon }) => (
    <TouchableOpacity style={styles.featureCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.featureContent}>
        <View style={styles.featureIconContainer}>
          <Text style={styles.featureIcon}>{icon}</Text>
        </View>
        <View style={styles.featureText}>
          <Text style={styles.featureTitle}>{title}</Text>
          <Text style={styles.featureSubtitle}>{subtitle}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );

  // friendly greeting text (header)
  const getGreeting = () => {
    const hour = new Date().getHours();
    let timeGreeting = "Hello";
    if (hour < 12) timeGreeting = "Good morning";
    else if (hour < 17) timeGreeting = "Good afternoon";
    else timeGreeting = "Good evening";
    
    return user ? `${timeGreeting}, ${user.name?.split(' ')[0] || 'there'}!` : `${timeGreeting}!`;
  };

  const responsivePadding = ResponsiveUtils.getResponsivePadding(width);
  const categoryColumns = ResponsiveUtils.getCategoryColumns(width);
  const categoryChipWidth = (width - (responsivePadding * 2) - ((categoryColumns - 1) * 12)) / categoryColumns;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.light.surface,
    },
    // Center content and limit max width on wide screens
    pageWrap: {
      flex: 1,
      alignSelf: "center",
      width: "100%",
      maxWidth: 1200,
    },
    
    // Header
    header: {
      backgroundColor: Colors.light.accent,
      paddingTop: 50,
      paddingHorizontal: 20,
      paddingBottom: 24,
    },
    
    headerContent: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    
    greetingContainer: {
      flex: 1,
    },
    
    greeting: {
      fontSize: 28,
      fontWeight: "800",
      color: "#FFFFFF",
      marginBottom: 4,
      letterSpacing: -0.5,
    },
    
    headerSubtitle: {
      fontSize: 16,
      color: "rgba(255, 255, 255, 0.8)",
      fontWeight: "500",
    },
    
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    
    pointsContainer: {
       flexDirection: "row",
       alignItems: "center",
       backgroundColor: "rgba(255, 255, 255, 0.15)",
       borderRadius: 20,
       paddingHorizontal: 12,
       paddingVertical: 8,
       borderWidth: 1,
       borderColor: "rgba(255, 255, 255, 0.3)",
     },
     
     pointsIcon: {
       fontSize: 16,
       marginRight: 6,
     },
     
     pointsInfo: {
       alignItems: "flex-end",
     },
     
     pointsText: {
       color: "#FFFFFF",
       fontSize: 14,
       fontWeight: "700",
     },
     
     tierText: {
       color: "rgba(255, 255, 255, 0.8)",
       fontSize: 10,
       fontWeight: "600",
       textTransform: "uppercase",
       letterSpacing: 0.5,
     },
    
    profileButton: {
      marginLeft: 0,
    },
    
    profileAvatar: {
      width: 44,
      height: 44,
      backgroundColor: "rgba(255, 255, 255, 0.15)",
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: "rgba(255, 255, 255, 0.3)",
    },
    
    profileAvatarText: {
      fontSize: 18,
      fontWeight: "700",
      color: "#FFFFFF",
    },

    // Welcome banner
    bannerWelcome: {
      marginTop: 16,
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: "rgba(255, 255, 255, 0.15)",
      borderRadius: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backdropFilter: "blur(10px)",
    },
    
    bannerContent: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    
    bannerIcon: {
      fontSize: 24,
      marginRight: 12,
    },
    
    bannerWelcomeTxt: { 
      color: "#FFFFFF", 
      fontWeight: "600",
      fontSize: 16,
      flex: 1,
    },
    
    bannerCloseButton: {
      padding: 4,
    },
    
    bannerWelcomeClose: { 
      color: "#FFFFFF", 
      fontWeight: "700",
      fontSize: 18,
    },

    // Search
    searchSection: {
      backgroundColor: Colors.light.card,
      paddingHorizontal: 20,
      paddingVertical: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 3,
    },
    
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: Colors.light.surface,
      borderRadius: Radii.lg,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: Colors.light.border,
    },
    
    searchIcon: {
      fontSize: 18,
      marginRight: 12,
    },
    
    searchPlaceholder: {
      fontSize: 16,
      color: Colors.light.muted,
      flex: 1,
      fontWeight: "500",
    },
    
    searchButton: {
      backgroundColor: Colors.light.accent,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: Radii.md,
    },
    
    searchButtonText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "600",
    },

    // Main ScrollView
    mainScrollView: {
      flex: 1,
    },

    // Sections
    section: {
      backgroundColor: Colors.light.card,
      marginTop: 8,
      paddingHorizontal: 20,
      paddingVertical: 24,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    
    sectionTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: Colors.light.text,
      letterSpacing: -0.3,
    },
    
    seeAllText: {
      fontSize: 16,
      color: Colors.light.accent,
      fontWeight: "600",
    },

    // Categories
    categoriesChipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },

    categoryChip: {
      width: categoryChipWidth,
      minWidth: ResponsiveUtils.isTablet(width) ? 100 : 80,
      backgroundColor: Colors.light.surface,
      borderRadius: Radii.lg,
      borderWidth: 1,
      borderColor: Colors.light.border,
      paddingVertical: ResponsiveUtils.isTablet(width) ? 12 : 10,
      paddingHorizontal: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },

    categoryChipIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },

    categoryChipIcon: {
      fontSize: 18,
    },

    categoryChipLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: Colors.light.text,
      textAlign: 'center',
      textTransform: 'capitalize',
    },

    // Products
    productsScroll: {
      marginHorizontal: -20,
    },
    
    productsScrollContent: {
      paddingHorizontal: 20,
      paddingRight: 40,
    },
    
    productCard: {
      width: ResponsiveUtils.isTablet(width) ? 200 : 170,
      backgroundColor: Colors.light.card,
      borderRadius: Radii.lg,
      marginRight: 16,
      borderWidth: 1,
      borderColor: Colors.light.border,
      overflow: 'hidden',
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 3,
    },
    
    productImageContainer: {
      height: ResponsiveUtils.isTablet(width) ? 150 : 130,
      position: 'relative',
    },
    
    wishlistHeart: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    
    wishlistHeartActive: {
      backgroundColor: '#FEE2E2',
    },
    
    wishlistHeartIcon: {
      fontSize: 16,
      color: '#9CA3AF',
    },
    
    wishlistHeartIconActive: {
      color: '#DC2626',
    },
    
    priceTag: {
      position: 'absolute',
      bottom: 8,
      left: 8,
      backgroundColor: Colors.light.accent,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    priceTagText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
    },
    
    ratingChip: {
      position: 'absolute',
      bottom: 8,
      right: 8,
      backgroundColor: '#FEF3C7',
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    ratingChipText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#D97706',
    },
    
    productImage: {
      width: "100%",
      height: "100%",
    },
    
    productImagePlaceholder: {
      width: "100%",
      height: "100%",
      backgroundColor: Colors.light.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    
    productImageText: {
      fontSize: 32,
    },
    
    productInfo: {
      padding: 14,
      paddingTop: 12,
    },
    
    productName: {
      fontSize: 15,
      fontWeight: "600",
      color: Colors.light.text,
      marginBottom: 8,
      lineHeight: 20,
    },
    
    productMeta: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 4,
    },
    
    productCategory: {
      fontSize: 12,
      fontWeight: "500",
      color: Colors.light.muted,
      textTransform: "capitalize",
      flex: 1,
    },
    
    stockIndicator: {
      fontSize: 11,
      fontWeight: "600",
      color: "#10B981",
      backgroundColor: "#ECFDF5",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      textAlign: "center",
    },
    
    lowStock: {
      color: "#DC2626",
      backgroundColor: "#FEF2F2",
    },

    outOfStock: {
      color: "#7F1D1D",
      backgroundColor: "#FEE2E2",
    },

    // Stock badge styles for overlay indicators
    stockBadge: {
      position: "absolute",
      top: 8,
      left: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: "#10B981",
    },

    stockBadgeText: {
      fontSize: 10,
      fontWeight: "700",
      color: "#FFFFFF",
      textTransform: "uppercase",
    },

    outOfStockBadge: {
      backgroundColor: "#DC2626",
    },

    outOfStockText: {
      color: "#FFFFFF",
    },

    lowStockBadge: {
      backgroundColor: "#F59E0B",
    },

    lowStockText: {
      color: "#FFFFFF",
    },

    mediumStockBadge: {
      backgroundColor: "#3B82F6",
    },
    
    productFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    
    productPrice: {
      fontSize: 18,
      fontWeight: "700",
      color: Colors.light.accent,
    },
    
    ratingBadge: {
      backgroundColor: "#FEF3C7",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    
    ratingText: {
      fontSize: 12,
      fontWeight: "600",
      color: "#D97706",
    },

    // Best Offers
    offersScroll: {
      marginHorizontal: -20,
    },
    
    offersScrollContent: {
      paddingHorizontal: 20,
      paddingRight: 40,
    },
    
    offerCard: {
      width: ResponsiveUtils.isTablet(width) ? 180 : 150,
      backgroundColor: Colors.light.card,
      borderRadius: Radii.lg,
      marginRight: 16,
      borderWidth: 1,
      borderColor: Colors.light.border,
      overflow: 'hidden',
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 3,
    },
    
    offerImageWrap: {
      height: ResponsiveUtils.isTablet(width) ? 120 : 100,
      position: 'relative',
    },
    
    offerImage: {
      width: "100%",
      height: "100%",
    },
    
    offerImagePlaceholder: {
      width: "100%",
      height: "100%",
      backgroundColor: Colors.light.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    
    bundleTag: {
      position: 'absolute',
      top: 8,
      left: 8,
      backgroundColor: '#8B5CF6',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    
    bundleTagText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    
    offerInfo: {
      padding: 12,
    },
    
    offerName: {
      fontSize: 14,
      fontWeight: "600",
      color: Colors.light.text,
      marginBottom: 6,
    },
    
    offerPrice: {
      fontSize: 16,
      fontWeight: "700",
      color: Colors.light.accent,
    },

    // Features
    featuresContainer: {
      marginTop: 4,
      gap: 12,
    },
    
    featureCard: {
      backgroundColor: Colors.light.surface,
      borderRadius: Radii.lg,
      padding: 20,
      borderWidth: 1,
      borderColor: Colors.light.border,
    },
    
    featureContent: {
      flexDirection: "row",
      alignItems: "center",
    },
    
    featureIconContainer: {
      width: 48,
      height: 48,
      backgroundColor: "#FFFFFF",
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    
    featureIcon: {
      fontSize: 20,
    },
    
    featureText: {
      flex: 1,
    },
    
    featureTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: "#111827",
      marginBottom: 4,
    },
    
    featureSubtitle: {
      fontSize: 14,
      color: "#6B7280",
      fontWeight: "500",
    },
    
    chevron: {
      fontSize: 24,
      color: "#9CA3AF",
      fontWeight: "300",
    },

    // Empty State
    emptyState: {
      alignItems: "center",
      paddingVertical: 48,
    },
    
    emptyStateIcon: {
      fontSize: 56,
      marginBottom: 20,
    },
    
    emptyStateTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: "#111827",
      marginBottom: 8,
    },
    
    emptyStateText: {
      fontSize: 16,
      color: "#6B7280",
      textAlign: "center",
      lineHeight: 24,
    },

    // Offer Banner
    offerBanner: {
      backgroundColor: '#F59E0B',
      borderRadius: Radii.lg,
      padding: 20,
      marginTop: 4,
    },
    
    offerBannerContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    
    offerBannerText: {
      flex: 1,
    },
    
    offerBannerTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: "#FFFFFF",
      marginBottom: 4,
    },
    
    offerBannerSubtitle: {
      fontSize: 14,
      color: "rgba(255, 255, 255, 0.9)",
      fontWeight: "500",
    },
    
    offerButton: {
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: Radii.md,
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.3)",
    },
    
    offerButtonText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "600",
    },

    // Bottom spacing
    bottomSpacer: {
      height: 32,
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.light.accent} />
      
      <View style={styles.pageWrap}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.headerSubtitle}>
                {user ? "Ready to shop?" : "Welcome to our store!"}
              </Text>
            </View>
            
            <View style={styles.headerRight}>
              {/* Loyalty Points */}
              {user && loyalty && (
                <View style={styles.pointsContainer}>
                  <Text style={styles.pointsIcon}>⭐</Text>
                  <View style={styles.pointsInfo}>
                    <Text style={styles.pointsText}>{loyalty.points || 0}</Text>
                    <Text style={styles.tierText}>{loyalty.tier || 'Bronze'}</Text>
                  </View>
                </View>
              )}
              
              {/* Profile Avatar */}
              <TouchableOpacity 
                style={styles.profileButton}
                onPress={() => user ? router.push('/tabs/profile') : router.push('/login')}
                activeOpacity={0.8}
              >
                <View style={styles.profileAvatar}>
                  <Text style={styles.profileAvatarText}>
                    {user ? (user.name?.[0]?.toUpperCase() || '👤') : '👤'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Welcome Banner */}
          {showWelcome && (
            <Animated.View style={[styles.bannerWelcome, { opacity: fadeAnim }]}>
              <View style={styles.bannerContent}>
                <Text style={styles.bannerIcon}>🎉</Text>
                <Text style={styles.bannerWelcomeTxt}>
                  {justRegistered 
                    ? `Welcome to our store, ${justLoggedInName}!` 
                    : `Welcome back, ${justLoggedInName}!`
                  }
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.bannerCloseButton}
                onPress={() => {
                  Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                  }).start(() => {
                    setShowWelcome(false);
                    setJustLoggedInName(null);
                    setJustRegistered(false);
                  });
                }}
              >
                <Text style={styles.bannerWelcomeClose}>×</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

        {/* Search */}
        <View style={styles.searchSection}>
          <TouchableOpacity 
            style={styles.searchBar}
            onPress={() => router.push('/search')}
            activeOpacity={0.8}
          >
            <Text style={styles.searchIcon}>🔍</Text>
            <Text style={styles.searchPlaceholder}>Search products...</Text>
            <View style={styles.searchButton}>
              <Text style={styles.searchButtonText}>Search</Text>
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.mainScrollView} showsVerticalScrollIndicator={false}>
          {/* Categories */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <TouchableOpacity onPress={() => router.push('/tabs/products')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.categoriesChipsRow}>
              {(categories || []).slice(0, 8).map((category, index) => (
                <CategoryCard key={category} category={category} index={index} />
              ))}
            </View>
          </View>

          {/* Recommended Products */}
          {(recommendedProducts && recommendedProducts.length > 0) || (realtimeProducts && realtimeProducts.length > 0) ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {recommendedProducts && recommendedProducts.length > 0 ? 'Recommended for You' : 'Featured Products'}
                </Text>
                <TouchableOpacity onPress={() => router.push('/tabs/products')}>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.productsScroll}
                contentContainerStyle={styles.productsScrollContent}
              >
                {(recommendedProducts && recommendedProducts.length > 0 
                  ? recommendedProducts 
                  : realtimeProducts.slice(0, 10)
                ).map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </ScrollView>
            </View>
          ) : null}

          {/* Best Offers */}
          {bestOffers.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Best Offers</Text>
                <TouchableOpacity onPress={() => router.push('/tabs/products')}>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.offersScroll}
                contentContainerStyle={styles.offersScrollContent}
              >
                {bestOffers.map((offer, index) => (
                  <OfferCard key={`${offer.type}-${offer.item?._id || index}`} data={offer} />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Features */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Explore</Text>
            </View>
            
            <View style={styles.featuresContainer}>
              <FeatureCard
                title="All Products"
                subtitle="Browse our complete catalog"
                icon="🛍️"
                onPress={() => router.push('/tabs/products')}
              />
              
              <FeatureCard
                title="Product Bundles"
                subtitle="Save more with bundle deals"
                icon="📦"
                onPress={() => router.push('/bundles')}
              />
              
              {user && (
                <FeatureCard
                  title="My Wishlist"
                  subtitle="View your saved items"
                  icon="❤️"
                  onPress={() => router.push('/tabs/wishlist')}
                />
              )}
              
              <FeatureCard
                title="Customer Support"
                subtitle="Get help when you need it"
                icon="💬"
                onPress={() => Alert.alert("Support", "Contact us at support@example.com")}
              />
            </View>
          </View>

          {/* Special Offer Banner */}
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.offerBanner}
              onPress={() => router.push('/tabs/products')}
              activeOpacity={0.9}
            >
              <View style={styles.offerBannerContent}>
                <View style={styles.offerBannerText}>
                  <Text style={styles.offerBannerTitle}>🎉 Special Offer!</Text>
                  <Text style={styles.offerBannerSubtitle}>
                    Get up to 50% off on selected items
                  </Text>
                </View>
                <View style={styles.offerButton}>
                  <Text style={styles.offerButtonText}>Shop Now</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
    </View>
  );
}