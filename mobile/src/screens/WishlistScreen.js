import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import { 
  ActivityIndicator, 
  Alert, 
  Dimensions, 
  FlatList, 
  Image, 
  Pressable, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View 
} from "react-native";
import { AppCtx } from "../context/AppContext";
import { platformShadow } from "../utils/shadow";
import { Colors, Radii } from "../../constants/theme";

const PLACEHOLDER = "https://via.placeholder.com/400x300.png?text=No+Image";
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

export default function WishlistScreen() {
  const { user, wishlist, loadWishlist, toggleWishlist, toAbsoluteUrl, categoryLabelOf, isLoggedIn } = useContext(AppCtx);
  const [loading, setLoading] = useState(true);
  const [imageStates, setImageStates] = useState({});

  // Get screen width inside component
  const { width } = Dimensions.get('window');

  // Responsive grid calculation
  const columns = width >= 1200 ? 4 : width >= 992 ? 3 : width >= 768 ? 3 : 2;
  const columnGap = columns >= 3 ? 20 : 16;

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        setLoading(true);
        await loadWishlist();
      } catch (error) {
        console.error("Error loading wishlist:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [user?._id]); // Only depend on user ID, not the loadWishlist function

  const confirmRemoveFromWishlist = (productId, productName) => {
    Alert.alert(
      "Remove from Wishlist",
      `Are you sure you want to remove "${productName}" from your wishlist?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => handleRemoveFromWishlist(productId, productName)
        }
      ]
    );
  };

  const handleRemoveFromWishlist = async (productId, productName) => {
    try {
      // Find the product in the wishlist
      const product = wishlist.find(item => item._id === productId);
      if (!product) {
        return;
      }
      
      // Call toggleWishlist to remove the item (it already reloads the wishlist)
      await toggleWishlist(product);
      
    } catch (error) {
      console.error("Error removing from wishlist:", error);
    }
  };

  const renderWishlistItem = ({ item }) => {
    const img = pickImage(item, toAbsoluteUrl);
    const averageRating = item?.reviews?.length 
      ? (item.reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / item.reviews.length).toFixed(1)
      : null;
    const reviewCount = Array.isArray(item?.reviews) ? item.reviews.length : 0;
    const inStock = item?.stock > 0;
    const imageState = imageStates[item._id] || { loading: true, error: false };

    return (
      <View style={[styles.wishlistCard, { width: (width - 40 - columnGap * (columns - 1)) / columns }]}>
        <Pressable
          onPress={() => router.push(`/product-detail?id=${item._id}`)}
          style={styles.cardPressable}
        >
          {/* Image Container */}
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: img }} 
              style={styles.image} 
              resizeMode="cover"
              onLoadStart={() => {
                setImageStates(prev => ({
                  ...prev,
                  [item._id]: { loading: true, error: false }
                }));
              }}
              onLoadEnd={() => {
                setImageStates(prev => ({
                  ...prev,
                  [item._id]: { loading: false, error: false }
                }));
              }}
              onError={() => {
                setImageStates(prev => ({
                  ...prev,
                  [item._id]: { loading: false, error: true }
                }));
              }}
            />
            
            {/* Loading Indicator */}
            {imageState.loading && (
              <View style={styles.imageLoadingOverlay}>
                <ActivityIndicator size="small" color="#007AFF" />
              </View>
            )}
            
            {/* Error State */}
            {imageState.error && (
              <View style={styles.imageErrorOverlay}>
                <Text style={styles.imageErrorText}>Image not available</Text>
              </View>
            )}
            
            {/* Remove Button */}
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => confirmRemoveFromWishlist(item._id, item.name)}
              activeOpacity={0.8}
            >
              <Ionicons name="heart" size={20} color="#EF4444" />
            </TouchableOpacity>

            {/* Stock Badge */}
            {!inStock && (
              <View style={styles.outOfStockBadge}>
                <Text style={styles.outOfStockText}>Out of Stock</Text>
              </View>
            )}

            {/* Price Overlay */}
            <View style={styles.priceOverlay}>
              <Text style={styles.priceOverlayCurrency}>₱</Text>
              <Text style={styles.priceOverlayText}>{formatPrice(item?.price)}</Text>
            </View>
          </View>

          {/* Content */}
          <View style={styles.cardContent}>
            {/* Category */}
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>
                {categoryLabelOf?.(item) || "Product"}
              </Text>
            </View>

            {/* Product Name */}
            <Text style={styles.productName} numberOfLines={2}>
              {item?.name || "Unnamed Product"}
            </Text>

            {/* Rating */}
            {averageRating && (
              <View style={styles.ratingContainer}>
                <Text style={styles.starIcon}>★</Text>
                <Text style={styles.ratingText}>
                  {averageRating}
                  {reviewCount > 0 ? ` (${reviewCount})` : ""}
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.viewButton]}
                onPress={() => router.push(`/product-detail?id=${item._id}`)}
                activeOpacity={0.8}
              >
                <Ionicons name="eye-outline" size={16} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>View</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.removeActionButton]}
                onPress={() => confirmRemoveFromWishlist(item._id, item.name)}
                activeOpacity={0.8}
              >
                <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My Wishlist</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading your wishlist...</Text>
        </View>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My Wishlist</Text>
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="person-outline" size={48} color="#6B7280" />
          </View>
          <Text style={styles.emptyTitle}>Please log in</Text>
          <Text style={styles.emptySub}>Sign in to view your wishlist</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push("/login")}
            activeOpacity={0.8}
          >
            <Text style={styles.loginButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!wishlist || wishlist.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My Wishlist</Text>
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="heart-outline" size={48} color="#6B7280" />
          </View>
          <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
          <Text style={styles.emptySub}>Add products you love to see them here</Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.push("/tabs/products")}
            activeOpacity={0.8}
          >
            <Text style={styles.browseButtonText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Wishlist</Text>
        <View style={styles.headerStats}>
          <View style={styles.statBadge}>
            <Text style={styles.statNumber}>{wishlist.length}</Text>
            <Text style={styles.statLabel}>
              {wishlist.length === 1 ? 'item' : 'items'}
            </Text>
          </View>
        </View>
      </View>
      
      <FlatList
        data={wishlist}
        keyExtractor={(item) => item._id}
        renderItem={renderWishlistItem}
        numColumns={columns}
        key={`wishlist-grid-${columns}`}
        contentContainerStyle={styles.list}
        columnWrapperStyle={columns > 1 ? { gap: columnGap, paddingHorizontal: 20 } : undefined}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    ...platformShadow(2),
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    flex: 1,
  },
  headerStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  statBadge: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statNumber: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 16,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySub: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: "#10B981",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    ...platformShadow(2),
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  browseButton: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    ...platformShadow(2),
  },
  browseButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  list: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  wishlistCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    ...platformShadow(3),
    marginBottom: 16,
  },
  cardPressable: {
    flex: 1,
  },
  imageContainer: {
    position: "relative",
    aspectRatio: 1,
    backgroundColor: "#F3F4F6",
  },
  image: {
    width: "100%",
    height: "100%",
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
  imageErrorOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(243, 244, 246, 0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  imageErrorText: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  removeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    ...platformShadow(2),
  },
  outOfStockBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(239, 68, 68, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  outOfStockText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  priceOverlay: {
    position: "absolute",
    bottom: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "baseline",
    backgroundColor: "rgba(16, 185, 129, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  priceOverlayCurrency: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  priceOverlayText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  cardContent: {
    padding: 12,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#6B7280",
    textTransform: "uppercase",
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    lineHeight: 20,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  starIcon: {
    fontSize: 14,
    color: "#F59E0B",
    marginRight: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
  },
  viewButton: {
    backgroundColor: "#10B981",
  },
  removeActionButton: {
    backgroundColor: "#EF4444",
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});