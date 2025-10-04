import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AppCtx } from "../context/AppContext";

const { width } = Dimensions.get("window");

export default function BundleDetailScreen() {
  const { id } = useLocalSearchParams();
  const {
    bundleDetail,
    fetchBundleDetail,
    handleAddBundleToCart,
  } = useContext(AppCtx);

  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (id) {
      loadBundle();
    }
  }, [id]);

  const loadBundle = async () => {
    try {
      setLoading(true);
      await fetchBundleDetail(id);
    } catch (error) {
      console.error("Failed to load bundle:", error);
      Alert.alert("Error", "Failed to load bundle details");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!bundleDetail) return;

    try {
      setAddingToCart(true);
      await handleAddBundleToCart(bundleDetail);
      setShowSuccessModal(true);
    } catch (error) {
      Alert.alert("Error", "Failed to add bundle to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleContinueShopping = () => {
    setShowSuccessModal(false);
  };

  const handleViewCart = () => {
    setShowSuccessModal(false);
    router.push("/cart");
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading bundle...</Text>
      </View>
    );
  }

  if (!bundleDetail) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text style={styles.errorTitle}>Bundle Not Found</Text>
        <Text style={styles.errorSubtitle}>
          This bundle may no longer be available
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const bundle = bundleDetail;
  const discount = Number(bundle?.discount || 0);
  const currentPrice = Number(bundle?.price ?? bundle?.bundlePrice ?? 0);
  const originalPrice = Number(bundle?.originalPrice ?? 0);
  const savings = originalPrice > currentPrice ? originalPrice - currentPrice : 0;

  // Support both current `items.productId` and legacy `products.product`
  const itemsFromProducts = Array.isArray(bundle?.products)
    ? bundle.products.map((it) => ({
        productId: it.product || it.productId || null,
        quantity: Number(it.quantity || 1),
      }))
    : [];
  const itemList = Array.isArray(bundle?.items) && bundle.items.length
    ? bundle.items
    : itemsFromProducts;
  const itemCount = itemList.length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#10B981" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backIconButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bundle Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Bundle Info */}
        <View style={styles.infoSection}>
          <View style={styles.bundleHeader}>
            <Text style={styles.bundleName}>{bundle.name}</Text>
            {discount > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>SAVE {discount}%</Text>
              </View>
            )}
          </View>

          {bundle.description && (
            <Text style={styles.description}>{bundle.description}</Text>
          )}

          {/* Price Section */}
          <View style={styles.priceSection}>
            <View style={styles.priceContainer}>
              {originalPrice > currentPrice && (
                <Text style={styles.originalPrice}>₱{originalPrice.toFixed(2)}</Text>
              )}
              <View style={styles.currentPriceRow}>
                <Text style={styles.currency}>₱</Text>
                <Text style={styles.price}>
                  {currentPrice.toFixed(2)}
                </Text>
              </View>
              {savings > 0 && (
                <Text style={styles.savingsText}>
                  You save ₱{savings.toFixed(2)}
                </Text>
              )}
            </View>
          </View>

          {/* Bundle Items */}
          <View style={styles.itemsSection}>
            <Text style={styles.sectionTitle}>
              What's in this bundle ({itemCount} items)
            </Text>

            {itemList.map((item, index) => {
              const product = item.productId || item.product;
              const name = typeof product === 'object' ? product?.name : String(product || '').slice(0, 12);

              return (
                <View key={index} style={styles.itemCard}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {name || 'Product'}
                    </Text>
                    <Text style={styles.itemQuantity}>
                      Quantity: {item.quantity}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Stock Info */}
          {bundle.stock !== undefined && (
            <View style={styles.stockContainer}>
              <Ionicons
                name={bundle.stock > 0 ? "checkmark-circle" : "close-circle"}
                size={20}
                color={bundle.stock > 0 ? "#10B981" : "#EF4444"}
              />
              <Text
                style={[
                  styles.stockText,
                  { color: bundle.stock > 0 ? "#10B981" : "#EF4444" },
                ]}
              >
                {bundle.stock > 0
                  ? `${bundle.stock} bundles available`
                  : "Out of stock"}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add to Cart Button */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceInfo}>
          <Text style={styles.bottomLabel}>Bundle Price</Text>
          <Text style={styles.bottomPrice}>₱{currentPrice.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.addToCartButton,
            (addingToCart || bundle.stock === 0) && styles.disabledButton,
          ]}
          onPress={handleAddToCart}
          disabled={addingToCart || bundle.stock === 0}
          activeOpacity={0.8}
        >
          {addingToCart ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="cart-outline" size={20} color="#FFFFFF" />
              <Text style={styles.addToCartText}>
                {bundle.stock === 0 ? "Out of Stock" : "Add to Cart"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        animationType="fade"
        transparent={true}
        onRequestClose={handleContinueShopping}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Success Icon */}
            <View style={styles.successIconContainer}>
              <Ionicons name="checkmark-circle" size={64} color="#10B981" />
            </View>

            {/* Success Message */}
            <Text style={styles.modalTitle}>Success!</Text>
            <Text style={styles.modalMessage}>Bundle items added to cart</Text>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.continueShoppingButton}
                onPress={handleContinueShopping}
                activeOpacity={0.8}
              >
                <Text style={styles.continueShoppingText}>Continue Shopping</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.viewCartButton}
                onPress={handleViewCart}
                activeOpacity={0.8}
              >
                <Ionicons name="cart-outline" size={20} color="#FFFFFF" />
                <Text style={styles.viewCartText}>View Cart</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },

  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "600",
  },

  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 40,
  },

  errorTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    marginTop: 16,
    marginBottom: 8,
  },

  errorSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
  },

  backButton: {
    backgroundColor: "#10B981",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },

  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#10B981",
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  backIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  headerSpacer: {
    width: 40,
  },

  scrollContent: {
    paddingBottom: 100,
  },



  discountBadge: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: "flex-start",
  },

  discountText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  infoSection: {
    padding: 20,
  },

  bundleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 12,
  },

  bundleName: {
    fontSize: 26,
    fontWeight: "900",
    color: "#111827",
    lineHeight: 32,
    flex: 1,
  },

  description: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 22,
    marginBottom: 20,
  },

  priceSection: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  priceContainer: {
    alignItems: "flex-start",
  },

  originalPrice: {
    fontSize: 18,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
    marginBottom: 4,
  },

  currentPriceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8,
  },

  currency: {
    fontSize: 24,
    color: "#10B981",
    fontWeight: "700",
    marginRight: 4,
  },

  price: {
    fontSize: 36,
    color: "#10B981",
    fontWeight: "900",
  },

  savingsText: {
    fontSize: 14,
    color: "#EF4444",
    fontWeight: "700",
  },

  itemsSection: {
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 16,
  },

  itemCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },



  itemInfo: {
    flex: 1,
    justifyContent: "center",
  },

  itemName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },

  itemQuantity: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 2,
  },

  itemPrice: {
    fontSize: 14,
    color: "#10B981",
    fontWeight: "700",
  },

  viewProductButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },

  stockContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },

  stockText: {
    fontSize: 15,
    fontWeight: "700",
  },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },

  bottomPriceInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  bottomLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
  },

  bottomPrice: {
    fontSize: 24,
    color: "#10B981",
    fontWeight: "900",
  },

  addToCartButton: {
    flexDirection: "row",
    backgroundColor: "#10B981",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  disabledButton: {
    backgroundColor: "#9CA3AF",
    shadowColor: "#000",
    shadowOpacity: 0.1,
  },

  addToCartText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    maxWidth: 340,
    width: "100%",
  },

  successIconContainer: {
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },

  modalMessage: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },

  modalActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },

  continueShoppingButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  continueShoppingText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#10B981",
  },

  viewCartButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  viewCartText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
