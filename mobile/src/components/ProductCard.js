import { useContext, useState } from "react";
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AppCtx } from "../context/AppContext";

const PLACEHOLDER = "https://via.placeholder.com/400x300.png?text=No+Image";

function pickImage(product, toAbsoluteUrl) {
  const first = product?.imageUrl || product?.images?.[0] || null;
  if (!first) return PLACEHOLDER;
  return toAbsoluteUrl ? toAbsoluteUrl(first) : first;
}

export default function ProductCard({ product, onPress }) {
  const { handleAddToCart, categoryLabelOf, toAbsoluteUrl } = useContext(AppCtx);
  const [imageLoading, setImageLoading] = useState(true);
  const [scaleValue] = useState(new Animated.Value(1));
  
  const img = pickImage(product, toAbsoluteUrl);

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
    e.stopPropagation(); // Prevent card press when adding to cart
    handleAddToCart(product);
  };

  // Calculate average rating if reviews exist
  const averageRating = product?.reviews?.length 
    ? (product.reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / product.reviews.length).toFixed(1)
    : null;

  // Check if product is in stock
  const inStock = product?.stock > 0;
  const stockLevel = product?.stock || 0;

  return (
    <Animated.View style={[s.cardContainer, { transform: [{ scale: scaleValue }] }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        style={s.card}
      >
        {/* Image Container */}
        <View style={s.imageContainer}>
          <Image 
            source={{ uri: img }} 
            style={s.image} 
            resizeMode="cover"
            onLoadStart={() => setImageLoading(true)}
            onLoadEnd={() => setImageLoading(false)}
          />
          
          {/* Loading overlay */}
          {imageLoading && (
            <View style={s.imageLoadingOverlay}>
              <View style={s.loadingIndicator} />
            </View>
          )}
          
          {/* Stock Status Badge */}
          {!inStock && (
            <View style={s.outOfStockBadge}>
              <Text style={s.outOfStockText}>Out of Stock</Text>
            </View>
          )}

          {/* Discount Badge (if you have discount data) */}
          {product?.discount && (
            <View style={s.discountBadge}>
              <Text style={s.discountText}>-{product.discount}%</Text>
            </View>
          )}

          {/* Image Gradient Overlay */}
          <View style={s.imageGradient} />
        </View>

        {/* Content Container */}
        <View style={s.content}>
          {/* Category and Rating Row */}
          <View style={s.topRow}>
            <View style={s.categoryBadge}>
              <Text style={s.categoryText}>
                {categoryLabelOf?.(product) || "Product"}
              </Text>
            </View>
            
            {averageRating && (
              <View style={s.ratingContainer}>
                <Text style={s.starIcon}>★</Text>
                <Text style={s.ratingText}>{averageRating}</Text>
              </View>
            )}
          </View>

          {/* Product Name */}
          <Text style={s.name} numberOfLines={2}>
            {product?.name || "Unnamed Product"}
          </Text>

          {/* Product Details */}
          <View style={s.detailsContainer}>
            {/* Weight */}
            {product?.weightKg && (
              <View style={s.detailItem}>
                <Text style={s.detailIcon}>⚖️</Text>
                <Text style={s.detailText}>{product.weightKg}kg</Text>
              </View>
            )}
            
            {/* Stock Level */}
            {inStock && stockLevel <= 10 && (
              <View style={s.detailItem}>
                <Text style={s.detailIcon}>📦</Text>
                <Text style={[s.detailText, stockLevel <= 5 && s.lowStockText]}>
                  {stockLevel} left
                </Text>
              </View>
            )}
          </View>

          {/* Price and Add to Cart Row */}
          <View style={s.bottomRow}>
            <View style={s.priceContainer}>
              <Text style={s.currency}>₱</Text>
              <Text style={s.price}>{Number(product?.price || 0).toFixed(2)}</Text>
              {product?.originalPrice && product.originalPrice > product.price && (
                <Text style={s.originalPrice}>₱{Number(product.originalPrice).toFixed(2)}</Text>
              )}
            </View>

            <Pressable
              onPress={handleAddToCartPress}
              disabled={!inStock}
              style={({ pressed }) => [
                s.addButton,
                pressed && s.addButtonPressed,
                !inStock && s.addButtonDisabled
              ]}
            >
              <Text style={[s.addButtonText, !inStock && s.addButtonTextDisabled]}>
                {inStock ? "Add to Cart" : "Unavailable"}
              </Text>
            </Pressable>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  cardContainer: {
    marginBottom: 16,
  },
  
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    overflow: "hidden",
  },
  
  // Image Styles
  imageContainer: {
    position: "relative",
    height: 180,
    overflow: "hidden",
  },
  
  image: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F3F4F6",
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
    borderColor: "#E5E7EB",
    borderTopColor: "#10B981",
  },
  
  imageGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: "rgba(0, 0, 0, 0.03)",
  },
  
  // Badges
  outOfStockBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(239, 68, 68, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  
  outOfStockText: {
    color: "#FFFFFF",
    fontSize: 11,
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
    fontSize: 12,
    fontWeight: "700",
  },
  
  // Content Styles
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  
  categoryText: {
    fontSize: 11,
    color: "#059669",
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
    borderRadius: 12,
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
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    lineHeight: 24,
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  
  // Details Container
  detailsContainer: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 12,
  },
  
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  
  detailIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  
  detailText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  
  lowStockText: {
    color: "#DC2626",
  },
  
  // Bottom Row
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    flex: 1,
  },
  
  currency: {
    fontSize: 16,
    color: "#059669",
    fontWeight: "700",
    marginRight: 2,
  },
  
  price: {
    fontSize: 22,
    color: "#059669",
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  
  originalPrice: {
    fontSize: 14,
    color: "#9CA3AF",
    fontWeight: "600",
    textDecorationLine: "line-through",
    marginLeft: 8,
  },
  
  // Add to Cart Button
  addButton: {
    backgroundColor: "#10B981",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    elevation: 3,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    minWidth: 120,
    alignItems: "center",
  },
  
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
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  
  addButtonTextDisabled: {
    color: "#9CA3AF",
  },
});