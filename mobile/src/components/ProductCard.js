import { useContext, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { AppCtx } from "../context/AppContext";
import { platformShadow } from "../utils/shadow";
import { Colors, Radii, ResponsiveUtils } from "../../constants/theme";
import { sanitizeProductForDisplay, warnIfIdDisplayAttempt } from "../utils/dataSanitizer";

const PLACEHOLDER = require("../../assets/images/placeholder.svg");
const C = Colors.light;

function formatPrice(n) {
  const num = Number(n || 0);
  try {
    return num.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } catch {
    return num.toFixed(2);
  }
}

function pickImage(product, toAbsoluteUrl) {
  const first = product?.imageUrl || product?.images?.[0] || null;
  if (!first) return PLACEHOLDER;
  return toAbsoluteUrl ? toAbsoluteUrl(first) : first;
}

export default function ProductCard({ product, onPress, onAddToCart, compact = false }) {
  const { handleAddToCart, categoryLabelOf, toAbsoluteUrl, toggleWishlist, isInWishlist } = useContext(AppCtx);
  const [imageLoading, setImageLoading] = useState(true);
  const [scaleValue] = useState(new Animated.Value(1));
  
  // Sanitize product data to prevent ID display
  const sanitizedProduct = sanitizeProductForDisplay(product);
  
  // Warn if any product fields contain ID-like strings
  if (__DEV__ && product) {
    warnIfIdDisplayAttempt(product.name, 'ProductCard - product.name');
    warnIfIdDisplayAttempt(product.description, 'ProductCard - product.description');
  }
  
  const s = getStyles();
  
  const img = pickImage(product, toAbsoluteUrl);
  const saved = isInWishlist?.(product?._id);

  const createdAt = product?.createdAt ? new Date(product.createdAt) : null;
  const isNew = createdAt ? (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24) <= 1 : false;
  const isOnSale = (product?.originalPrice && product.originalPrice > product.price) || !!product?.discount;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleAddToCartPress = (e) => {
    e.stopPropagation();
    
    // First add to cart in context
    handleAddToCart(product);
    
    // Then trigger the confirmation modal if the prop exists
    if (onAddToCart) {
      onAddToCart(product);
    }
  };

  const averageRating = product?.reviews?.length 
    ? (product.reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / product.reviews.length).toFixed(1)
    : null;
  const reviewCount = Array.isArray(product?.reviews) ? product.reviews.length : 0;

  const inStock = product?.stock > 0;
  const stockLevel = product?.stock || 0;

  return (
    <Animated.View style={[s.cardContainer, compact && { marginBottom: 12 }, { transform: [{ scale: scaleValue }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onHoverIn={() => {
          Animated.spring(scaleValue, {
            toValue: 1.02,
            useNativeDriver: true,
            friction: 7,
          }).start();
        }}
        onHoverOut={() => {
          Animated.spring(scaleValue, {
            toValue: 1,
            useNativeDriver: true,
            friction: 7,
          }).start();
        }}
        style={({ hovered }) => StyleSheet.flatten([
          s.card,
          compact && [s.compactCard, { borderRadius: Radii.lg }],
          compact && s.compactBorder,
          hovered && s.cardHovered,
        ])}
      >
        {/* Image Container */}
        <View style={[s.imageContainer, compact && s.compactImageHeight]}>
          <Image 
            source={{ uri: img }} 
            style={s.image} 
            resizeMode="cover"
            onLoadStart={() => setImageLoading(true)}
            onLoadEnd={() => setImageLoading(false)}
            onError={(e) => {
              console.log('ProductCard image load error:', e.nativeEvent.error);
              setImageLoading(false);
            }}
          />
          
          {imageLoading && (
            <View style={s.imageLoadingOverlay}>
              <View style={s.loadingIndicator} />
            </View>
          )}
          
          {!inStock && (
            <View style={s.outOfStockBadge}>
              <Text style={s.outOfStockText}>Out of Stock</Text>
            </View>
          )}
          {/* Badges: NEW / SALE / IN STOCK */}
          {isNew && (
            <View style={[s.infoBadge, { top: 12, left: 12, backgroundColor: "#DBEAFE", borderColor: "#93C5FD" }]}>
              <Text style={[s.infoBadgeText, { color: "#1D4ED8" }]}>NEW</Text>
            </View>
          )}
          {isOnSale && (
            <View style={[s.infoBadge, { top: isNew ? 42 : 12, left: 12, backgroundColor: "#FEE2E2", borderColor: "#FCA5A5" }]}>
              <Text style={[s.infoBadgeText, { color: "#DC2626" }]}>SALE</Text>
            </View>
          )}
          {inStock && (
            <View style={[s.infoBadge, { top: isNew ? (isOnSale ? 72 : 42) : (isOnSale ? 42 : 12), left: 12, backgroundColor: "#DCFCE7", borderColor: "#86EFAC" }]}>
              <Text style={[s.infoBadgeText, { color: "#16A34A" }]}>IN STOCK</Text>
            </View>
          )}
          <View style={s.imageGradient} />

          {/* Compact overlays: wishlist (top-right), price (bottom-left), rating (bottom-right) */}
          {compact && (
            <>
              <Pressable
                onPress={async (e) => {
                  e.stopPropagation();
                  // Wishlist toggle action
                  console.log("🔥 WISHLIST DEBUG: toggleWishlist function exists:", !!toggleWishlist);
                  console.log("🔥 WISHLIST DEBUG: Current saved state:", saved);
                  
                  try {
                    const action = await toggleWishlist?.(product?._id);
                    console.log("🔥 WISHLIST DEBUG: Action result:", action);
                    
                    if (action === "added") {
                      console.log("🔥 WISHLIST DEBUG: Showing added alert");
                      Alert.alert("Added to wishlist");
                    } else if (action === "removed") {
                      console.log("🔥 WISHLIST DEBUG: Showing removed alert");
                      Alert.alert("Removed from wishlist");
                    } else {
                      console.log("🔥 WISHLIST DEBUG: No action or failed:", action);
                    }
                  } catch (error) {
                    console.error("🔥 WISHLIST DEBUG: Error in wishlist toggle:", error);
                  }
                }}
                style={[s.overlayHeartButton, saved && s.overlayHeartActive]}
              >
                <Text style={[s.overlayHeartIcon, saved && s.overlayHeartIconActive]}>
                  {saved ? "♥" : "♡"}
                </Text>
              </Pressable>

              <View style={s.priceOverlay}>
                <Text style={s.priceOverlayCurrency}>₱</Text>
                <Text style={s.priceOverlayText}>{formatPrice(product?.price)}</Text>
              </View>

              {averageRating && (
                <View style={s.ratingOverlay}>
                  <Text style={s.starIcon}>★</Text>
                  <Text style={s.ratingOverlayText}>{averageRating}</Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Content Container */}
        <View style={[s.content, compact && { padding: 8 }] }>
          {/* Category and Rating Row */}
          <View style={s.topRow}>
            <View style={s.categoryBadge}>
              <Text style={[s.categoryText, compact && { fontSize: 10 }] }>
                {categoryLabelOf?.(sanitizedProduct) || "Product"}
              </Text>
            </View>
            {!compact && averageRating && (
              <View style={s.ratingContainer}>
                <Text style={[s.starIcon, { fontSize: 12 }]}>★</Text>
                <Text style={s.ratingText}>
                  {averageRating}
                  {reviewCount > 0 ? ` (${reviewCount})` : ""}
                </Text>
              </View>
            )}
          </View>

          {/* Product Name */}
          <Text style={[s.name, compact && s.compactName]} numberOfLines={2}>
            {sanitizedProduct?.name || "Unnamed Product"}
          </Text>

          {/* Product Details */}
          {!compact && (
            <View style={s.detailsContainer}>
              {product?.weightKg && (
                <View style={s.detailItem}>
                  <Text style={s.detailIcon}>⚖️</Text>
                  <Text style={s.detailText}>{product.weightKg}kg</Text>
                </View>
              )}
              
              {inStock && stockLevel <= 10 && (
                <View style={s.detailItem}>
                  <Text style={s.detailIcon}>📦</Text>
                  <Text style={[s.detailText, stockLevel <= 5 && s.lowStockText]}>
                    {stockLevel} left
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Price and Add to Cart Row */}
          <View style={[s.bottomRow, compact && s.compactBottomRow]}>
            <View style={s.priceContainer}>
              <Text style={[s.currency, compact && s.compactCurrency]}>₱</Text>
              <Text style={[s.price, compact && s.compactPrice]}>{formatPrice(product?.price)}</Text>
              {product?.originalPrice && product.originalPrice > product.price && (
                <Text style={[s.originalPrice, compact && s.compactOriginalPrice]}>₱{formatPrice(product.originalPrice)}</Text>
              )}
            </View>
            {compact && averageRating && (
              <></>
            )}

            <View style={s.actionsContainer}>
              {/* Wishlist inline toggle removed in favor of overlay */}

              {onAddToCart && (
                <Pressable
                  onPress={handleAddToCartPress}
                  disabled={!inStock}
                  style={({ pressed }) => StyleSheet.flatten([
                    s.addButton,
                    compact && s.compactAddButton,
                    pressed && s.addButtonPressed,
                    !inStock && s.addButtonDisabled
                  ])}
                >
                  <Text style={[s.addButtonText, compact && s.compactAddText, !inStock && s.addButtonTextDisabled]}>
                    {inStock ? (compact ? "Add" : "Add to Cart") : "Unavailable"}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const getStyles = () => {
  const { width } = Dimensions.get('window');
  const isTablet = ResponsiveUtils.isTablet(width);
  const responsiveFontSize = (baseSize) => ResponsiveUtils.getResponsiveFontSize(width, baseSize);
  
  return StyleSheet.create({
  cardContainer: {
    marginBottom: 16,
  },
  
  card: {
    backgroundColor: C.card,
    borderRadius: Radii.xl,
    ...platformShadow({ color: "#000", offsetX: 0, offsetY: 4, radius: 12, opacity: 0.12, elevation: 6 }),
    overflow: "hidden",
  },
  compactCard: {
    minHeight: 240,
    borderRadius: Radii.lg,
  },
  compactBorder: { borderWidth: 1, borderColor: C.border },
  cardHovered: { ...platformShadow({ color: "#000", offsetX: 0, offsetY: 4, radius: 14, opacity: 0.18, elevation: 7 }) },
  
  imageContainer: {
    position: "relative",
    height: isTablet ? 220 : 180,
    overflow: "hidden",
  },
  compactImageHeight: { height: isTablet ? 140 : 120 },
  
  image: {
    width: "100%",
    height: "100%",
    backgroundColor: C.surface,
  },
  
  imageLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(243, 244, 246, 0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  
  loadingIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: C.border,
    borderTopColor: C.accent,
  },
  
  imageGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: "rgba(0, 0, 0, 0.03)",
  },
  
  outOfStockBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(239, 68, 68, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.md,
  },
  
  outOfStockText: {
    color: "#FFFFFF",
    fontSize: responsiveFontSize(11),
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  
  discountBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "#EF4444",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  
  discountText: {
    color: "#FFFFFF",
    fontSize: responsiveFontSize(12),
    fontWeight: "700",
  },

  wishlistButton: {
    position: "absolute",
    top: 12,
    right: 52,
    backgroundColor: "rgba(255,255,255,0.85)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: C.border,
  },
  wishlistActive: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FCA5A5",
  },
  wishlistIcon: {
    fontSize: 14,
    color: C.muted,
    fontWeight: "700",
  },
  wishlistIconActive: {
    color: "#DC2626",
  },
  
  content: {
    padding: 20,
  },
  
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  
  categoryBadge: {
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  
  categoryText: {
    fontSize: 11,
    color: C.accent,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
  },
  
  starIcon: {
    fontSize: 12,
    color: "#F59E0B",
    marginRight: 4,
  },
  
  ratingText: {
    fontSize: 12,
    color: "#D97706",
    fontWeight: "600",
  },
  
  name: {
    fontSize: responsiveFontSize(18),
    fontWeight: "800",
    color: C.text,
    lineHeight: responsiveFontSize(24),
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  compactName: { fontSize: responsiveFontSize(13), lineHeight: responsiveFontSize(18), marginBottom: 8 },
  
  detailsContainer: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 12,
  },
  
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
  },
  
  detailIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  
  detailText: {
    fontSize: 12,
    color: C.muted,
    fontWeight: "600",
  },
  
  lowStockText: {
    color: "#DC2626",
  },
  
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  compactBottomRow: { marginTop: 6, flexDirection: "column", alignItems: "stretch", gap: 6 },

  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  wishlistInlineButton: {
    backgroundColor: "rgba(255,255,255,0.85)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: C.border,
  },
  wishlistInlineActive: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FCA5A5",
  },
  wishlistInlineIcon: {
    fontSize: 16,
    color: C.muted,
    fontWeight: "700",
  },
  wishlistInlineIconActive: {
    color: "#DC2626",
  },
  
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    flex: 1,
  },
  
  currency: {
    fontSize: 16,
    color: C.accent,
    fontWeight: "700",
    marginRight: 2,
  },
  compactCurrency: { fontSize: responsiveFontSize(12) },
  
  price: {
    fontSize: responsiveFontSize(22),
    color: C.accent,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  compactPrice: { fontSize: responsiveFontSize(16) },
  
  originalPrice: {
    fontSize: responsiveFontSize(14),
    color: "#9CA3AF",
    fontWeight: "600",
    textDecorationLine: "line-through",
    marginLeft: 8,
  },
  compactOriginalPrice: { fontSize: responsiveFontSize(12) },
  
  addButton: {
    backgroundColor: C.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Radii.lg,
    elevation: 3,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    minWidth: 120,
    alignItems: "center",
  },
  compactAddButton: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: Radii.md, minWidth: 0, alignSelf: "stretch" },
  
  addButtonPressed: {
    backgroundColor: "#059669",
    transform: [{ scale: 0.96 }],
  },
  
  addButtonDisabled: {
    backgroundColor: "#D1D5DB",
    shadowOpacity: 0,
    elevation: 0,
  },
  
  addButtonText: {
    color: "#FFFFFF",
    fontSize: responsiveFontSize(14),
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  compactAddText: { fontSize: responsiveFontSize(13) },
  
  addButtonTextDisabled: {
    color: "#9CA3AF",
  },
  infoBadge: {
    position: "absolute",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.md,
    borderWidth: 1,
  },
  infoBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  
  // Compact card overlays
  overlayHeartButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: C.border,
  },
  overlayHeartActive: {
    backgroundColor: "#FEE2E2",
    borderColor: "#FCA5A5",
  },
  overlayHeartIcon: {
    fontSize: 14,
    color: C.muted,
    fontWeight: "700",
  },
  overlayHeartIconActive: {
    color: "#DC2626",
  },

  priceOverlay: {
    position: "absolute",
    bottom: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "baseline",
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: C.border,
  },
  priceOverlayCurrency: {
    fontSize: 12,
    color: C.accent,
    fontWeight: "700",
    marginRight: 2,
  },
  priceOverlayText: {
    fontSize: 14,
    color: C.accent,
    fontWeight: "900",
    letterSpacing: -0.2,
  },

  ratingOverlay: {
    position: "absolute",
    bottom: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  ratingOverlayText: {
    fontSize: 12,
    color: "#D97706",
    fontWeight: "700",
  },
  });
};