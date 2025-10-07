import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useContext, useEffect, useState } from "react";
import {
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AppCtx } from "../context/AppContext";

export default function CartScreen({ navigation }) {
  const router = useRouter();
  const {
    cart,
    cartTotal,
    incrementCartQty,
    decrementCartQty,
    handleRemoveLine,
    handleAddToCart,
    recoItems,
    justMergedFromGuest,
    setJustMergedFromGuest,
  } = useContext(AppCtx);

  const [showMergeBanner, setShowMergeBanner] = useState(false);

  useEffect(() => {
    if (justMergedFromGuest) {
      setShowMergeBanner(true);
      const t = setTimeout(() => {
        setShowMergeBanner(false);
        setJustMergedFromGuest(false);
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [justMergedFromGuest]);

  const goBackToShop = () => {
    if (navigation?.navigate) navigation.navigate("home");
    else router.replace("/tabs/home");
  };

  const goToCheckout = () => router.push("/checkout");

  const renderItem = ({ item }) => {
    const qty = Number(item.quantity || 0);
    const price = Number(item.price || 0);
    const img = item.imageUrl || "https://via.placeholder.com/120x120.png?text=Item";

    return (
      <View style={s.modernItemCard}>
        <View style={s.itemContent}>
          <View style={s.imageContainer}>
            <Image source={{ uri: img }} style={s.modernThumb} />
          </View>
          
          <View style={s.itemDetails}>
            <Text style={s.modernItemName} numberOfLines={2}>{item.name}</Text>
            <Text style={s.modernItemPrice}>
              ₱{price.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </Text>
            <TouchableOpacity 
              onPress={() => handleRemoveLine(item.productId)}
              style={s.removeButton}
            >
              <Ionicons name="trash-outline" size={14} color="#EF4444" />
              <Text style={s.removeText}>Remove</Text>
            </TouchableOpacity>
          </View>

          <View style={s.quantitySection}>
            <View style={s.modernStepper}>
              <TouchableOpacity
                style={[s.modernStepBtn, qty <= 1 && s.disabledStepBtn]}
                onPress={() => decrementCartQty(item.productId)}
                disabled={qty <= 1}
              >
                <Ionicons name="remove" size={16} color={qty <= 1 ? "#D1D5DB" : "#10B981"} />
              </TouchableOpacity>
              
              <View style={s.modernQtyBox}>
                <Text style={s.modernQtyText}>{qty}</Text>
              </View>
              
              <TouchableOpacity
                style={s.modernStepBtn}
                onPress={() => incrementCartQty(item.productId)}
              >
                <Ionicons name="add" size={16} color="#10B981" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const EmptyCartView = () => (
    <View style={s.emptyContainer}>
      <View style={s.emptyIconContainer}>
        <Ionicons name="bag-outline" size={64} color="#D1D5DB" />
      </View>
      <Text style={s.emptyTitle}>Your cart is empty</Text>
      <Text style={s.emptySubtitle}>
        Start adding some fresh agricultural products to your cart
      </Text>
      <TouchableOpacity style={s.shopButton} onPress={goBackToShop}>
        <Ionicons name="storefront-outline" size={20} color="#FFFFFF" />
        <Text style={s.shopButtonText}>Start Shopping</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      {/* Modern Header */}
      <View style={s.modernHeader}>
        <View style={s.headerContent}>
          <Ionicons name="bag-handle-outline" size={24} color="#10B981" />
          <Text style={s.modernH1}>Shopping Cart</Text>
        </View>
        <TouchableOpacity onPress={goBackToShop} style={s.backButton}>
          <Ionicons name="arrow-back" size={20} color="#10B981" />
          <Text style={s.backButtonText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>

      {/* Merge Banner */}
      {showMergeBanner && (
        <View style={s.modernBanner}>
          <View style={s.bannerContent}>
            <Ionicons name="checkmark-circle" size={20} color="#065F46" />
            <Text style={s.modernBannerTxt}>Your guest cart was saved to your account</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              setShowMergeBanner(false);
              setJustMergedFromGuest(false);
            }}
            style={s.bannerCloseBtn}
          >
            <Ionicons name="close" size={16} color="#065F46" />
          </TouchableOpacity>
        </View>
      )}

      {cart.length > 0 && (
        <View style={s.cartSummaryCard}>
          <View style={s.summaryHeader}>
            <Text style={s.itemCount}>{cart.length} item{cart.length !== 1 ? 's' : ''} in cart</Text>
            <Text style={s.totalAmount}>₱{cartTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</Text>
          </View>
        </View>
      )}

      <FlatList
        data={cart}
        keyExtractor={(it, i) => `${it.productId || it._id || i}`}
        renderItem={renderItem}
        ListEmptyComponent={<EmptyCartView />}
        contentContainerStyle={cart.length > 0 ? s.listContent : s.emptyListContent}
        showsVerticalScrollIndicator={false}
        extraData={cart}
      />

      {/* Add this checkout section right after FlatList */}
      {cart.length > 0 && (
        <View style={s.checkoutSection}>
          <View style={s.checkoutCard}>
            <View style={s.subtotalRow}>
              <Text style={s.subtotalLabel}>Subtotal</Text>
              <Text style={s.subtotalValue}>
                ₱{cartTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <Text style={s.taxNote}>Tax and delivery fees calculated at checkout</Text>
            
            <TouchableOpacity style={s.checkoutButton} onPress={goToCheckout}>
              <Text style={s.checkoutButtonText}>Proceed to Checkout</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Compact Scrollable Recommendations */}
      {Array.isArray(recoItems) && recoItems.length > 0 && (
        <View style={s.recommendationsSection}>
          <Text style={s.recommendationsTitle}>You may also like</Text>
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.recoScrollContent}
          >
            {recoItems.map((p) => (
              <View key={p._id} style={s.compactRecoCard}>
                <View style={s.compactRecoImagePlaceholder}>
                  <Text style={s.compactRecoEmoji}>🌾</Text>
                </View>
                <Text style={s.compactRecoName} numberOfLines={2}>{p.name}</Text>
                <Text style={s.compactRecoPrice}>
                  ₱{Number(p.price || 0).toFixed(2)}
                </Text>
                <TouchableOpacity 
                  onPress={() => handleAddToCart(p)}
                  style={s.compactRecoAddButton}
                >
                  <Ionicons name="add" size={12} color="#10B981" />
                  <Text style={s.compactRecoAddText}>Add</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  // Modern Header
  modernHeader: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    gap: 8,
  },

  modernH1: { 
    fontSize: 22, 
    fontWeight: "800", 
    color: "#111827" 
  },

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  backButtonText: {
    color: "#10B981",
    fontWeight: "600",
    fontSize: 14,
  },

  // Modern Banner
  modernBanner: {
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#ECFDF5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#A7F3D0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  bannerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  modernBannerTxt: { 
    color: "#065F46", 
    fontWeight: "600",
    fontSize: 14,
  },

  bannerCloseBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(6, 95, 70, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Cart Summary Card
  cartSummaryCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  itemCount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },

  totalAmount: {
    fontSize: 20,
    fontWeight: "800",
    color: "#10B981",
  },

  // Modern Item Card (Larger)
  modernItemCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },

  itemContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },

  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
  },

  modernThumb: { 
    width: "100%", 
    height: "100%",
    borderRadius: 16,
  },

  itemDetails: {
    flex: 1,
    paddingRight: 12,
  },

  modernItemName: { 
    fontSize: 18, 
    fontWeight: "700", 
    color: "#111827",
    marginBottom: 6,
    lineHeight: 24,
  },

  modernItemPrice: {
    fontSize: 22,
    fontWeight: "800",
    color: "#10B981",
    marginBottom: 12,
  },

  removeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },

  removeText: {
    color: "#EF4444",
    fontWeight: "600",
    fontSize: 14,
  },

  quantitySection: {
    alignItems: "flex-end",
    justifyContent: "center",
  },

  modernStepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    overflow: "hidden",
  },

  modernStepBtn: { 
    width: 40, 
    height: 40, 
    alignItems: "center", 
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  modernQtyBox: { 
    minWidth: 48, 
    height: 40, 
    alignItems: "center", 
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
  },

  modernQtyText: { 
    fontSize: 18, 
    fontWeight: "700",
    color: "#111827",
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },

  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },

  emptyTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },

  emptySubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },

  shopButton: {
    backgroundColor: "#10B981",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },

  shopButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  // List Content
  listContent: {
    paddingBottom: 160,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  // Modern Footer
  modernFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },

  footerContent: {
    padding: 20,
  },

  subtotalSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  subtotalLabel: { 
    fontSize: 18, 
    fontWeight: "700", 
    color: "#111827" 
  },

  subtotalValue: { 
    fontSize: 18, 
    fontWeight: "800", 
    color: "#111827" 
  },

  modernTaxNote: { 
    color: "#6B7280", 
    fontSize: 12,
    marginBottom: 16,
  },

  modernCheckoutBtn: {
    backgroundColor: "#10B981",
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  modernCheckoutTxt: { 
    color: "#FFFFFF", 
    fontSize: 16, 
    fontWeight: "800",
  },

  // Compact Recommendations (Smaller & Scrollable)
  recommendationsSection: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    paddingTop: 16,
    paddingBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  recommendationsTitle: { 
    fontSize: 16, 
    fontWeight: "700", 
    color: "#111827",
    marginBottom: 12,
    paddingHorizontal: 16,
  },

  recoScrollContent: {
    paddingHorizontal: 16,
    paddingRight: 32,
  },

  compactRecoCard: {
    width: 100,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
    marginRight: 12,
  },

  compactRecoImagePlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },

  compactRecoEmoji: {
    fontSize: 12,
  },

  compactRecoName: {
    fontSize: 10,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
    marginBottom: 4,
    lineHeight: 12,
  },

  compactRecoPrice: {
    fontSize: 12,
    fontWeight: "700",
    color: "#10B981",
    marginBottom: 6,
  },

  compactRecoAddButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 2,
  },

  compactRecoAddText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#10B981",
  },
  checkoutSection: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },

  checkoutCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  subtotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  subtotalLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  subtotalValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },

  taxNote: {
    color: "#6B7280",
    fontSize: 12,
    marginBottom: 16,
  },

  checkoutButton: {
    backgroundColor: "#10B981",
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  checkoutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
});
