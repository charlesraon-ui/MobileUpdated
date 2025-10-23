// src/screens/ProductDetailScreen.js
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { getProductRecommendations } from "../api/apiClient";
import { AppCtx } from "../context/AppContext";
import { ResponsiveUtils } from "../../constants/theme";

export default function ProductDetailScreen() {
  // Use Expo Router's hook to get URL params
  const { id } = useLocalSearchParams();
  const { width } = Dimensions.get('window');

  const {
    productDetail,
    fetchProductDetail,
    submitReview,
    handleAddToCart,
    toAbsoluteUrl,
    toggleWishlist,
    isInWishlist,
  } = useContext(AppCtx);

  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [imageLoading, setImageLoading] = useState(true);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // AI recos
  const [recoLoading, setRecoLoading] = useState(false);
  const [recos, setRecos] = useState({
    similar: [],
    complementary: [],
    addons: [],
  });

  // Stable animation ref
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isMountedRef = useRef(true);
  const currentProductId = useRef(null);

  // StyleSheet definition moved to top to prevent initialization errors
  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F8FAFC" },
    loadingContainer: { flex: 1, backgroundColor: "#F8FAFC" },
    loadingBox: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
    loadingSpinner: {
      width: 40, height: 40, borderRadius: 20, borderWidth: 3,
      borderColor: "#E5E7EB", borderTopColor: "#10B981", marginBottom: 16,
    },
    loadingText: { fontSize: 16, color: "#6B7280", fontWeight: "500" },
    errorText: { fontSize: 16, color: "#DC2626", fontWeight: "500", textAlign: "center", marginBottom: 16 },
    retryButton: { 
      marginBottom: 12, 
      padding: 12, 
      backgroundColor: "#DC2626", 
      borderRadius: 8 
    },
    retryButtonText: { 
      color: "white", 
      textAlign: "center", 
      fontWeight: "600" 
    },
    backToProductsButton: { 
      marginTop: 16, 
      padding: 12, 
      backgroundColor: "#10B981", 
      borderRadius: 8 
    },
    backToProductsText: { 
      color: "white", 
      textAlign: "center", 
      fontWeight: "600" 
    },

    scrollView: { flex: 1 },
    scrollContent: { paddingBottom: 32 },

    imageContainer: {
      position: "relative", backgroundColor: "#FFFFFF", marginHorizontal: 16, marginTop: 16,
      borderRadius: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1, shadowRadius: 8, elevation: 5, overflow: "hidden",
    },
    productImage: { width: "100%", height: 280, backgroundColor: "#F3F4F6" },
    imageLoader: {
      position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
      alignItems: "center", justifyContent: "center", backgroundColor: "#F3F4F6",
    },

    productInfoCard: {
      backgroundColor: "#FFFFFF", marginHorizontal: 16, marginTop: 16, borderRadius: 16, padding: 20,
      shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
    },
    productName: { fontSize: ResponsiveUtils.isTablet(width) ? 28 : 24, fontWeight: "800", color: "#111827", marginBottom: 12, lineHeight: ResponsiveUtils.isTablet(width) ? 36 : 32 },
    priceRatingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
    productPrice: { fontSize: ResponsiveUtils.isTablet(width) ? 32 : 28, fontWeight: "700", color: "#059669" },
    ratingBadge: { flexDirection: "row", alignItems: "center" },
    ratingText: { fontSize: ResponsiveUtils.isTablet(width) ? 16 : 14, color: "#6B7280", marginLeft: 8, fontWeight: "500" },

    // Stock Information Styles
    stockContainer: {
      flexDirection: "row", alignItems: "center", marginTop: 12, paddingVertical: 12,
      paddingHorizontal: 16, backgroundColor: "#F9FAFB", borderRadius: 12,
      borderWidth: 1, borderColor: "#E5E7EB",
    },
    stockIconContainer: {
      width: 32, height: 32, borderRadius: 16, backgroundColor: "#FFFFFF",
      alignItems: "center", justifyContent: "center", marginRight: 12,
      shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
    },
    stockIcon: { fontSize: ResponsiveUtils.isTablet(width) ? 18 : 16 },
    stockInfo: { flex: 1 },
    stockLabel: { fontSize: ResponsiveUtils.isTablet(width) ? 14 : 12, fontWeight: "600", color: "#6B7280", marginBottom: 2 },
    stockValue: { fontSize: ResponsiveUtils.isTablet(width) ? 18 : 16, fontWeight: "700" },

    weightContainer: { flexDirection: "row", alignItems: "center", marginBottom: 16, paddingHorizontal: 4 },
    weightLabel: { fontSize: ResponsiveUtils.isTablet(width) ? 16 : 14, color: "#6B7280", fontWeight: "500", marginRight: 8 },
    weightValue: {
      fontSize: ResponsiveUtils.isTablet(width) ? 16 : 14, color: "#374151", fontWeight: "600", backgroundColor: "#F3F4F6",
      paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
    },

    tagsContainer: { flexDirection: "row", flexWrap: "wrap", marginBottom: 20 },
    tagBadge: {
      backgroundColor: "#EFF6FF", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
      marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: "#DBEAFE",
    },
    tagText: { fontSize: ResponsiveUtils.isTablet(width) ? 14 : 12, color: "#1E40AF", fontWeight: "600" },

    descriptionContainer: { marginTop: 4 },
    descriptionLabel: { fontSize: ResponsiveUtils.isTablet(width) ? 18 : 16, fontWeight: "700", color: "#111827", marginBottom: 8 },
    productDescription: { fontSize: ResponsiveUtils.isTablet(width) ? 17 : 15, color: "#4B5563", lineHeight: ResponsiveUtils.isTablet(width) ? 24 : 22 },
    readMoreButton: { marginTop: 8 },
    readMoreText: { fontSize: ResponsiveUtils.isTablet(width) ? 16 : 14, color: "#10B981", fontWeight: "600" },

    addToCartContainer: { paddingHorizontal: 16, marginTop: 20 },
    addToCartButton: {
      backgroundColor: "#10B981", paddingVertical: 16, borderRadius: 12, alignItems: "center",
      justifyContent: "center", shadowColor: "#10B981", shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
    },
    addToCartText: { fontSize: ResponsiveUtils.isTablet(width) ? 20 : 18, fontWeight: "700", color: "#FFFFFF" },

    // Recos
    recoSection: { marginTop: 24, paddingHorizontal: 16 },
    recoTitle: { fontSize: ResponsiveUtils.isTablet(width) ? 24 : 20, fontWeight: "800", color: "#111827", marginBottom: 12 },
    recoCategory: { marginBottom: 20 },
    recoHeading: { fontSize: ResponsiveUtils.isTablet(width) ? 18 : 16, fontWeight: "800", color: "#374151", marginBottom: 8 },
    separator: { height: 1, backgroundColor: "#E5E7EB", marginVertical: 4 },
    muted: { color: "#6B7280", marginTop: 8 },
    recoLoadingContainer: { alignItems: "center", marginVertical: 8 },
    recoRow: {
      flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8,
    },
    recoImg: { width: 56, height: 56, borderRadius: 8, backgroundColor: "#F3F4F6" },
    recoName: { flex: 1, fontWeight: "700", color: "#111827" },
    recoPrice: { color: "#059669", fontWeight: "800", marginTop: 2 },
    recoRatingContainer: { 
      flexDirection: "row", 
      alignItems: "center", 
      marginTop: 4 
    },
    recoStarIcon: { 
      fontSize: 12, 
      color: "#F59E0B", 
      marginRight: 4 
    },
    recoRatingText: { 
      fontSize: 12, 
      color: "#6B7280", 
      fontWeight: "600" 
    },
    recoAddButton: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: "#EBF8FF",
      borderRadius: 6,
      borderWidth: 1,
      borderColor: "#2563EB"
    },
    recoAdd: { color: "#2563EB", fontWeight: "800", fontSize: 12 },

    // Reviews
    reviewsSection: { marginTop: 24, paddingHorizontal: 16 },
    reviewsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
    sectionTitle: { fontSize: 20, fontWeight: "700", color: "#111827" },
    averageRatingContainer: {
      flexDirection: "row", alignItems: "center", backgroundColor: "#FEF3C7",
      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    },
    averageRatingNumber: { fontSize: 16, fontWeight: "700", color: "#D97706", marginRight: 4 },
    averageRatingText: { fontSize: 16, color: "#D97706" },

    writeReviewCard: {
      backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, marginBottom: 20,
      shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
    },
    writeReviewTitle: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 16 },
    ratingLabel: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 },

    starsContainer: { flexDirection: "row", marginBottom: 16 },
    interactiveStar: { padding: 4 },
    staticStar: { marginRight: 2 },
    starText: { fontSize: 24 },

    reviewInput: {
      borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 12, padding: 16, fontSize: 15,
      minHeight: 100, backgroundColor: "#F9FAFB", marginBottom: 16, color: "#111827",
    },
    submitButton: { backgroundColor: "#10B981", paddingVertical: 12, borderRadius: 8, alignItems: "center" },
    submitButtonDisabled: { backgroundColor: "#D1D5DB" },
    submitButtonText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
    submitButtonTextDisabled: { color: "#9CA3AF" },

    existingReviews: { gap: 12 },
    reviewCard: {
      backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16,
      shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    reviewHeader: { marginBottom: 12 },
    reviewerInfo: { flexDirection: "row", alignItems: "center" },
    avatarPlaceholder: {
      width: 40, height: 40, borderRadius: 20, backgroundColor: "#10B981",
      alignItems: "center", justifyContent: "center", marginRight: 12,
    },
    avatarText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
    reviewerName: { fontSize: 16, fontWeight: "600", color: "#111827", marginBottom: 4 },
    reviewComment: { fontSize: 15, color: "#4B5563", lineHeight: 22 },

    noReviewsContainer: { alignItems: "center", paddingVertical: 40 },
    noReviewsText: { fontSize: 18, fontWeight: "600", color: "#9CA3AF", marginBottom: 8 },
    noReviewsSubtext: { fontSize: 14, color: "#D1D5DB" },

    // Modern Header Styles
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: 60,
      paddingBottom: 16,
      paddingHorizontal: 20,
      backgroundColor: "#FFFFFF",
      borderBottomWidth: 1,
      borderBottomColor: "#E5E7EB",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    backIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "#F3F4F6",
      alignItems: "center",
      justifyContent: "center",
    },
    backIcon: {
      fontSize: 18,
      color: "#374151",
      fontWeight: "600",
    },
    headerCenter: {
      flex: 1,
      marginHorizontal: 16,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: "#111827",
      textAlign: "center",
    },
    wishlistButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "#F3F4F6",
      alignItems: "center",
      justifyContent: "center",
    },
    wishlistButtonActive: {
      backgroundColor: "#FEE2E2",
    },
    wishlistIcon: {
      fontSize: 20,
      color: "#6B7280",
    },
    wishlistIconActive: {
      color: "#DC2626",
    },
  });

  // Memoized values to prevent unnecessary re-renders
  const averageRating = useMemo(
    () => {
      if (!productDetail?.reviews?.length) return 0;
      return productDetail.reviews.reduce((s, r) => s + (r.rating || 0), 0) / productDetail.reviews.length;
    },
    [productDetail?.reviews]
  );

  const img = useMemo(() => {
    if (!productDetail) return "https://via.placeholder.com/400x300.png?text=No+Image";
    const imageSource = productDetail?.imageUrl || productDetail?.images?.[0];
    if (!imageSource) return "https://via.placeholder.com/400x300.png?text=No+Image";
    if (String(imageSource).startsWith("http")) return imageSource;
    return toAbsoluteUrl ? toAbsoluteUrl(imageSource) : imageSource;
  }, [productDetail, toAbsoluteUrl]);

  // Reset states when component mounts
  useEffect(() => {
    isMountedRef.current = true;
    setError(null);
    setIsLoading(false);
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Memoized handlers to prevent re-creation
  const handleSubmit = useCallback(() => {
    if (!newRating || !newComment.trim()) return;
    if (productDetail?._id && submitReview) {
      try {
        submitReview(productDetail._id, newRating, newComment);
        setNewRating(0);
        setNewComment("");
      } catch (error) {
        console.error('Submit review error:', error);
      }
    }
  }, [newRating, newComment, submitReview, productDetail?._id]);

  const handleAddToCartPress = useCallback((product) => {
    if (handleAddToCart) {
      try {
        handleAddToCart(product);
        // Toast is triggered from context handler; keep UX snappy
      } catch (error) {
        console.error('Add to cart error:', error);
      }
    }
  }, [handleAddToCart]);

  const handleBackPress = useCallback(() => {
    try {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/tabs/products'); // Fallback route
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  }, []);

  // fetch product detail - Fixed to prevent loops
  useEffect(() => {
    if (!id || currentProductId.current === id) return;
    if (!fetchProductDetail || isLoading) return;
    
    currentProductId.current = id;
    
    const loadProductDetail = async () => {
      if (!isMountedRef.current) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        await fetchProductDetail(id);
        
        if (!isMountedRef.current) return;
        
        // Reset and start animation only after successful load
        fadeAnim.setValue(0);
        const animation = Animated.timing(fadeAnim, { 
          toValue: 1, 
          duration: 300, 
          useNativeDriver: true 
        });
        
        animation.start();
        
        return () => {
          animation.stop();
        };
        
      } catch (error) {
        console.error('Failed to fetch product detail:', error);
        if (isMountedRef.current) {
          setError('Failed to load product details');
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    loadProductDetail();
  }, [id]); // Only depend on id

  // fetch recommendations - Fixed to prevent infinite loops
  useEffect(() => {
    if (!id || !productDetail || recoLoading) return;
    
    let cancelled = false;
    
    const fetchRecommendations = async () => {
      try {
        if (cancelled || !isMountedRef.current) return;
        
        setRecoLoading(true);
        const res = await getProductRecommendations(id, 8);
        
        if (cancelled || !isMountedRef.current) return;
        
        const data = res?.data || {};
        setRecos({
          similar: Array.isArray(data.similar) ? data.similar : [],
          complementary: Array.isArray(data.complementary) ? data.complementary : [],
          addons: Array.isArray(data.addons) ? data.addons : [],
        });
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
        if (!cancelled && isMountedRef.current) {
          setRecos({ similar: [], complementary: [], addons: [] });
        }
      } finally {
        if (!cancelled && isMountedRef.current) {
          setRecoLoading(false);
        }
      }
    };

    // Add small delay to prevent race conditions
    const timeoutId = setTimeout(fetchRecommendations, 100);
    
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [id, productDetail?._id]); // Only run when id or product changes

  const renderStars = useCallback((rating, interactive = false, onPress = null) => (
    <View style={s.starsContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => interactive && onPress?.(star)}
          disabled={!interactive}
          style={interactive ? s.interactiveStar : s.staticStar}
          activeOpacity={interactive ? 0.7 : 1}
        >
          <Text style={[s.starText, { color: star <= rating ? "#FFD700" : "#E5E7EB" }]}>
            ★
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  ), []);

  // Memoized RecoRow component to prevent unnecessary re-renders
  const RecoRow = useCallback(({ item }) => {
    if (!item) return null;
    
    const imgSrc = item.imageUrl || "https://via.placeholder.com/120x120.png?text=Item";
    const averageRating = item.averageRating || 0;
    const reviewCount = item.reviewCount || 0;
    
    return (
      <TouchableOpacity 
        style={s.recoRow}
        onPress={() => router.push(`/product-detail?id=${item._id}`)}
        activeOpacity={0.7}
      >
        <Image 
          source={{ uri: imgSrc }} 
          style={s.recoImg}
          onError={(e) => console.log('Reco image load error:', e.nativeEvent.error)}
        />
        <View style={{ flex: 1 }}>
          <Text style={s.recoName} numberOfLines={2}>{item.name || 'Product'}</Text>
          <Text style={s.recoPrice}>₱{Number(item.price || 0).toLocaleString("en-PH")}</Text>
          {averageRating > 0 && (
            <View style={s.recoRatingContainer}>
              <Text style={s.recoStarIcon}>★</Text>
              <Text style={s.recoRatingText}>
                {averageRating.toFixed(1)} ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity 
          onPress={(e) => {
            e.stopPropagation();
            handleAddToCartPress(item);
          }}
          activeOpacity={0.7}
          style={s.recoAddButton}
        >
          <Text style={s.recoAdd}>Add</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }, [handleAddToCartPress, router]);

  const renderRecoItem = useCallback(({ item }) => <RecoRow item={item} />, [RecoRow]);

  // Guard: no id
  if (!id) {
    return (
      <View style={s.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#10B981" />
        <View style={s.loadingBox}>
          <Text style={s.loadingText}>Invalid product ID</Text>
          <TouchableOpacity
            onPress={handleBackPress}
            style={s.backToProductsButton}
            activeOpacity={0.8}
          >
            <Text style={s.backToProductsText}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Guard: error state
  if (error) {
    return (
      <View style={s.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#10B981" />
        <View style={s.loadingBox}>
          <Text style={s.errorText}>⚠️ {error}</Text>
          <TouchableOpacity
            onPress={() => {
              setError(null);
              currentProductId.current = null; // Reset to allow retry
            }}
            style={s.retryButton}
            activeOpacity={0.8}
          >
            <Text style={s.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleBackPress}
            style={s.backToProductsButton}
            activeOpacity={0.8}
          >
            <Text style={s.backToProductsText}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Guard: loading detail
  if (isLoading || !productDetail) {
    return (
      <View style={s.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#10B981" />
        <View style={s.loadingBox}>
          <View style={s.loadingSpinner} />
          <Text style={s.loadingText}>Loading product...</Text>
        </View>
      </View>
    );
  }

  const p = productDetail;
  const saved = isInWishlist?.(p?._id);
  
  // Debug: Log product data to understand the structure
  console.log('Product Detail Data:', p);
  console.log('Product Stock:', p?.stock);

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Modern Navigation Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backButton} onPress={() => router.back()}>
          <View style={s.backIconContainer}>
            <Text style={s.backIcon}>←</Text>
          </View>
        </TouchableOpacity>
        
        <View style={s.headerCenter}>
          <Text style={s.headerTitle} numberOfLines={1}>
            {p?.name || "Product Details"}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={[s.wishlistButton, saved && s.wishlistButtonActive]} 
          onPress={() => toggleWishlist?.(p?._id)}
        >
          <Text style={[s.wishlistIcon, saved && s.wishlistIconActive]}>
            {saved ? "♥" : "♡"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.scrollView}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Image */}
          <View style={s.imageContainer}>
            <Image
              source={{ uri: img }}
              style={s.productImage}
              resizeMode="cover"
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
              onError={(e) => {
                console.log('Product image load error:', e.nativeEvent.error);
                setImageLoading(false);
              }}
            />
            {imageLoading && (
              <View style={s.imageLoader}>
                <View style={s.loadingSpinner} />
              </View>
            )}
          </View>

          {/* Info */}
          <View style={s.productInfoCard}>
            <Text style={s.productName}>{p.name}</Text>
            <View style={s.priceRatingRow}>
              <Text style={s.productPrice}>₱{Number(p.price || 0).toFixed(2)}</Text>
              <View style={s.ratingBadge}>
                {renderStars(averageRating)}
                <Text style={s.ratingText}>({p.reviews?.length || 0})</Text>
              </View>
            </View>

            {/* Stock Information */}
            <View style={s.stockContainer}>
              <View style={s.stockIconContainer}>
                <Text style={[s.stockIcon, { color: p.stock > 0 ? (p.stock <= 10 ? "#F59E0B" : "#10B981") : "#EF4444" }]}>
                  {p.stock > 0 ? (p.stock <= 10 ? "⚠️" : "✅") : "❌"}
                </Text>
              </View>
              <View style={s.stockInfo}>
                <Text style={s.stockLabel}>Stock Available</Text>
                <Text style={[
                  s.stockValue,
                  { color: p.stock > 0 ? (p.stock <= 10 ? "#F59E0B" : "#10B981") : "#EF4444" }
                ]}>
                  {p.stock > 0 ? `${p.stock} units` : "Out of stock"}
                </Text>
              </View>
            </View>

            {p.weightKg ? (
              <View style={s.weightContainer}>
                <Text style={s.weightLabel}>Weight:</Text>
                <Text style={s.weightValue}>{p.weightKg}kg</Text>
              </View>
            ) : null}

            {!!p.tags?.length && (
              <View style={s.tagsContainer}>
                {p.tags.map((tag, i) => (
                  <View key={`tag-${i}`} style={s.tagBadge}>
                    <Text style={s.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={s.descriptionContainer}>
              <Text style={s.descriptionLabel}>Description</Text>
              <Text
                style={s.productDescription}
                numberOfLines={showFullDescription ? undefined : 3}
              >
                {p.description || "No description available."}
              </Text>
              {p.description && p.description.length > 100 && (
                <TouchableOpacity
                  onPress={() => setShowFullDescription(!showFullDescription)}
                  style={s.readMoreButton}
                  activeOpacity={0.7}
                >
                  <Text style={s.readMoreText}>
                    {showFullDescription ? "Show less" : "Read more"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Add to Cart */}
          <View style={s.addToCartContainer}>
            <TouchableOpacity 
              style={s.addToCartButton} 
              onPress={() => handleAddToCartPress(p)} 
              activeOpacity={0.8}
            >
              <Text style={s.addToCartText}>Add to Cart</Text>
            </TouchableOpacity>
          </View>

          {/* AI RECOMMENDATIONS */}
          {(recoLoading || recos.similar.length || recos.complementary.length || recos.addons.length) ? (
            <View style={s.recoSection}>
              <Text style={s.recoTitle}>Recommended for this item</Text>

              {recoLoading ? (
                <View style={s.recoLoadingContainer}>
                  <View style={s.loadingSpinner} />
                  <Text style={s.muted}>Finding similar and complementary items…</Text>
                </View>
              ) : (
                <>
                  {recos.similar.length > 0 && (
                    <View style={s.recoCategory}>
                      <Text style={s.recoHeading}>Similar items</Text>
                      <FlatList
                        data={recos.similar}
                        keyExtractor={(item, index) => `similar-${item._id || index}`}
                        renderItem={renderRecoItem}
                        ItemSeparatorComponent={() => <View style={s.separator} />}
                        scrollEnabled={false}
                        removeClippedSubviews={true}
                        maxToRenderPerBatch={5}
                        windowSize={10}
                      />
                    </View>
                  )}

                  {recos.complementary.length > 0 && (
                    <View style={s.recoCategory}>
                      <Text style={s.recoHeading}>Frequently bought together</Text>
                      <FlatList
                        data={recos.complementary}
                        keyExtractor={(item, index) => `complementary-${item._id || index}`}
                        renderItem={renderRecoItem}
                        ItemSeparatorComponent={() => <View style={s.separator} />}
                        scrollEnabled={false}
                        removeClippedSubviews={true}
                        maxToRenderPerBatch={5}
                        windowSize={10}
                      />
                    </View>
                  )}

                  {recos.addons.length > 0 && (
                    <View style={s.recoCategory}>
                      <Text style={s.recoHeading}>Customers also added</Text>
                      <FlatList
                        data={recos.addons}
                        keyExtractor={(item, index) => `addons-${item._id || index}`}
                        renderItem={renderRecoItem}
                        ItemSeparatorComponent={() => <View style={s.separator} />}
                        scrollEnabled={false}
                        removeClippedSubviews={true}
                        maxToRenderPerBatch={5}
                        windowSize={10}
                      />
                    </View>
                  )}
                </>
              )}
            </View>
          ) : null}

          {/* Reviews */}
          <View style={s.reviewsSection}>
            <View style={s.reviewsHeader}>
              <Text style={s.sectionTitle}>Reviews & Ratings</Text>
              {averageRating > 0 && (
                <View style={s.averageRatingContainer}>
                  <Text style={s.averageRatingNumber}>{averageRating.toFixed(1)}</Text>
                  <Text style={s.averageRatingText}>★</Text>
                </View>
              )}
            </View>

            {/* Write Review */}
            <View style={s.writeReviewCard}>
              <Text style={s.writeReviewTitle}>Write a Review</Text>
              <Text style={s.ratingLabel}>Your Rating</Text>
              {renderStars(newRating, true, setNewRating)}
              <TextInput
                value={newComment}
                onChangeText={setNewComment}
                placeholder="Share your thoughts about this product..."
                style={s.reviewInput}
                multiline
                textAlignVertical="top"
                maxLength={500}
              />
              <TouchableOpacity
                style={[s.submitButton, (!newRating || !newComment.trim()) && s.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={!newRating || !newComment.trim()}
                activeOpacity={0.8}
              >
                <Text style={[s.submitButtonText, (!newRating || !newComment.trim()) && s.submitButtonTextDisabled]}>
                  Submit Review
                </Text>
              </TouchableOpacity>
            </View>

            {/* Existing Reviews */}
            <View style={s.existingReviews}>
              {p.reviews?.length > 0 ? (
                p.reviews.map((review, index) => (
                  <View key={`review-${review._id || index}`} style={s.reviewCard}>
                    <View style={s.reviewHeader}>
                      <View style={s.reviewerInfo}>
                        <View style={s.avatarPlaceholder}>
                          <Text style={s.avatarText}>
                            {(review.userId?.name || "A").charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View>
                          <Text style={s.reviewerName}>{review.userId?.name || "Anonymous"}</Text>
                          {renderStars(review.rating || 0)}
                        </View>
                      </View>
                    </View>
                    <Text style={s.reviewComment}>{review.comment || ''}</Text>
                  </View>
                ))
              ) : (
                <View style={s.noReviewsContainer}>
                  <Text style={s.noReviewsText}>No reviews yet</Text>
                  <Text style={s.noReviewsSubtext}>Be the first to review this product!</Text>
                </View>
              )}
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}