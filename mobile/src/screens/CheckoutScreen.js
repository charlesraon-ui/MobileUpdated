
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import * as Linking from 'expo-linking';
import { useRouter } from "expo-router";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { createEPaymentOrder } from "../api/apiClient";
import { AppCtx } from "../context/AppContext";
import PromoService from "../services/PromoService";
import VoucherDropdown from "../components/VoucherDropdown";

const GREEN = "#10B981";
const GREEN_BG = "#ECFDF5";
const GREEN_BORDER = "#A7F3D0";
const GREEN_DARK = "#065F46";
const GRAY = "#6B7280";
const BORDER = "#E5E7EB";
const BLUE = "#3B82F6";

export default function CheckoutScreen() {
  const router = useRouter();

  const {
    cart,
    cartTotal,
    cartTotalAfterDiscount,
    loyaltyDiscountPct,
    deliveryAddress,
    setDeliveryAddress,
    addresses,
    defaultAddress,
    paymentMethod,
    setPaymentMethod,
    handlePlaceOrder,
    isLoggedIn,
    refreshAuthedData,
    // reward redemption
    availableRewards,
    appliedReward,
    rewardDiscount,
    rewardFreeShipping,
    applyRewardDiscount,
    removeRewardDiscount,
    loadAvailableRewards,
  } = useContext(AppCtx);

  const [deliveryMethod, setDeliveryMethod] = useState("in-house");
  const [placing, setPlacing] = useState(false);

  // Promo code state
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [freeShipping, setFreeShipping] = useState(false);

  // toast
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);
  const showToast = (msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2200);
  };

  // refresh on focus
  const refreshingRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!isLoggedIn || refreshingRef.current) return;
      refreshingRef.current = true;
      Promise.resolve(refreshAuthedData?.()).finally(() => {
        refreshingRef.current = false;
      });
    }, [isLoggedIn])
  );

  // Load available rewards
  useEffect(() => {
    if (isLoggedIn) {
      loadAvailableRewards();
    }
  }, [isLoggedIn, loadAvailableRewards]);



  // Helper functions
  const getDeliveryFee = (method) => {
    if (method === "pickup") return 0;
    if (method === "in-house") return 50;
    if (method === "third-party") return 80;
    return 0;
  };

  const calculateOrderTotals = () => {
    const deliveryFee = (freeShipping || rewardFreeShipping) ? 0 : getDeliveryFee(deliveryMethod);
    const subtotal = cartTotalAfterDiscount - promoDiscount - rewardDiscount;
    const tax = Math.round(subtotal * 0.12 * 100) / 100;
    const total = subtotal + tax + deliveryFee;

    return { deliveryFee, subtotal, tax, total };
  };

  // Validations
  const addrError = useMemo(() => {
    if (deliveryMethod === "pickup") return "";
    
    const txt = (deliveryAddress || "").trim();
    if (!txt) return "Delivery address is required.";
    if (txt.length < 5) return "Please enter a more specific address.";
    return "";
  }, [deliveryAddress, deliveryMethod]);

  const disabled = !isLoggedIn || cartTotalAfterDiscount <= 0 || !!addrError || placing;

  // Calculate final total for display
  const { deliveryFee, subtotal, tax, total: finalTotal } = calculateOrderTotals();

  // ✅ FIXED PLACE ORDER FUNCTION
  const onPlace = async () => {
    console.log("🚀 ORDER DEBUG: onPlace function called");
    console.log("🚀 ORDER DEBUG: disabled state:", disabled);
    console.log("🚀 ORDER DEBUG: cart:", cart);
    console.log("🚀 ORDER DEBUG: paymentMethod:", paymentMethod);
    console.log("🚀 ORDER DEBUG: deliveryMethod:", deliveryMethod);
    console.log("🚀 ORDER DEBUG: deliveryAddress:", deliveryAddress);
    console.log("🚀 ORDER DEBUG: isLoggedIn:", isLoggedIn);
    
    if (disabled) {
      console.log("🚀 ORDER DEBUG: Order disabled, returning early");
      return;
    }
    
    setPlacing(true);

    try {
      // ✅ CALCULATE TOTALS FIRST - THIS WAS THE BUG!
      const { deliveryFee, subtotal, tax, total } = calculateOrderTotals();
      console.log("🚀 ORDER DEBUG: Calculated totals - deliveryFee:", deliveryFee, "subtotal:", subtotal, "tax:", tax, "total:", total);

      // ✅ E-PAYMENT FLOW
      if (paymentMethod === "E-Payment") {
        console.log("🚀 ORDER DEBUG: E-Payment flow selected");
        showToast("Creating payment session...");

        // Build proper payload structure
        const payload = {
          items: cart.map(item => ({
            productId: item.productId || item._id,
            name: item.name,
            price: Number(item.price || 0),
            imageUrl: item.imageUrl || "",
            quantity: Number(item.quantity || 1)
          })),
          total: total,
          taxAmount: tax,
          deliveryFee: deliveryFee,
          address: deliveryMethod === "pickup"
            ? "Poblacion 1, Moncada\nTarlac, Philippines"
            : deliveryAddress.trim(),
          deliveryType: deliveryMethod,
          channel: "multi", // Support all payment methods
          promoCode: appliedPromo ? {
            code: appliedPromo.code,
            discount: promoDiscount,
            freeShipping: freeShipping
          } : null,
          loyaltyReward: appliedReward ? {
            rewardId: appliedReward._id || appliedReward.id,
            name: appliedReward.name,
            type: appliedReward.type,
            value: appliedReward.value,
            discount: rewardDiscount,
            freeShipping: rewardFreeShipping
          } : null
        };

        console.log("📤 Sending E-Payment payload:", JSON.stringify(payload, null, 2));

        const response = await createEPaymentOrder(payload);
        
        console.log("📥 E-Payment response:", response.data);

        const checkoutUrl = response?.data?.payment?.checkoutUrl;

        if (!checkoutUrl) {
          console.log("🚀 ORDER DEBUG: No checkout URL received - response:", response);
          throw new Error("No checkout URL received from payment provider");
        }

        console.log("🚀 ORDER DEBUG: Opening checkout URL:", checkoutUrl);
        showToast("Redirecting to payment...");
        
        // Open payment URL
        const canOpen = await Linking.canOpenURL(checkoutUrl);
        
        if (!canOpen) {
          console.log("🚀 ORDER DEBUG: Cannot open URL:", checkoutUrl);
          throw new Error("Cannot open payment URL");
        }

        await Linking.openURL(checkoutUrl);
        
        // Show info dialog
        Alert.alert(
          "Complete Your Payment",
          "Please complete your payment in the browser. Your order will appear once payment is confirmed.",
          [
            { 
              text: "View Orders", 
              onPress: () => router.replace("/tabs/profile") 
            }
          ]
        );

        return;
      }

      // ✅ COD FLOW
      console.log("🚀 ORDER DEBUG: COD flow selected");
      showToast("Placing order...");
      
      const codPayload = {
        deliveryType: deliveryMethod,
        address: deliveryMethod === "pickup"
          ? "Poblacion 1, Moncada\nTarlac, Philippines"
          : deliveryAddress.trim(),
        total,
        taxAmount: tax,
        deliveryFee,
        promoCode: appliedPromo ? {
          code: appliedPromo.code,
          discount: promoDiscount,
          freeShipping: freeShipping
        } : null,
        loyaltyReward: appliedReward ? {
          rewardId: appliedReward._id || appliedReward.id,
          name: appliedReward.name,
          type: appliedReward.type,
          value: appliedReward.value,
          discount: rewardDiscount,
          freeShipping: rewardFreeShipping
        } : null
      };
      
      console.log("🚀 ORDER DEBUG: COD payload:", codPayload);
      
      const res = await handlePlaceOrder(codPayload);
      console.log("🚀 ORDER DEBUG: COD API response:", res);
      
      if (res?.success) {
        const orderId = res.order?._id || res.order?.id;
        const shortId = String(orderId || "").slice(-6).toUpperCase();
        
        console.log("🚀 ORDER DEBUG: Order placed successfully - orderId:", orderId, "shortId:", shortId);
        showToast(`Order #${shortId} placed!`);
        
        setTimeout(() => {
          router.replace("/tabs/profile");
        }, 1000);
      } else {
        console.log("🚀 ORDER DEBUG: COD order failed - res:", res);
        throw new Error(res?.message || "Order creation failed");
      }

    } catch (error) {
      console.error("❌ Place order error:", error);
      console.log("🚀 ORDER DEBUG: Full error object:", JSON.stringify(error, null, 2));
      console.log("🚀 ORDER DEBUG: Error response:", error?.response);
      console.log("🚀 ORDER DEBUG: Error response data:", error?.response?.data);
      
      const errorMessage = 
        error?.response?.data?.message || 
        error?.message || 
        "Failed to place order. Please try again.";
      
      console.log("🚀 ORDER DEBUG: Final error message:", errorMessage);
      Alert.alert("Order Failed", errorMessage);
    } finally {
      console.log("🚀 ORDER DEBUG: Setting placing to false");
      setPlacing(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={s.scrollContainer}>
        {/* Modern Header */}
        <View style={s.modernHeader}>
          <TouchableOpacity onPress={() => router.back()} style={s.modernBackBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={s.headerContent}>
            <Ionicons name="bag-check-outline" size={28} color="#FFFFFF" />
            <Text style={s.modernH1}>Secure Checkout</Text>
          </View>
          <View style={s.headerSpacer} />
        </View>

        {/* Order Summary Card */}
        <View style={s.summaryCard}>
          <View style={s.summaryHeader}>
            <Ionicons name="receipt-outline" size={20} color={GREEN} />
            <Text style={s.summaryTitle}>Order Summary</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Items ({cart.length})</Text>
            <Text style={s.summaryValue}>₱{cartTotal.toFixed(2)}</Text>
          </View>
          {Number(loyaltyDiscountPct) > 0 && (
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Loyalty Discount ({Number(loyaltyDiscountPct)}%)</Text>
              <Text style={s.summaryValue}>-₱{(cartTotal * (loyaltyDiscountPct / 100)).toFixed(2)}</Text>
            </View>
          )}
          {rewardDiscount > 0 && (
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Reward Discount ({appliedReward?.name})</Text>
              <Text style={s.summaryValue}>-₱{rewardDiscount.toFixed(2)}</Text>
            </View>
          )}
          {promoDiscount > 0 && (
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Promo Discount ({appliedPromo?.code})</Text>
              <Text style={s.summaryValue}>-₱{promoDiscount.toFixed(2)}</Text>
            </View>
          )}
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Delivery Fee</Text>
            <Text style={[s.summaryValue, (deliveryMethod === "pickup" || freeShipping || rewardFreeShipping) && s.freeText]}>
              {deliveryMethod === "pickup" ? "FREE" : 
               freeShipping ? "FREE (Promo)" : 
               rewardFreeShipping ? "FREE (Reward)" : 
               `₱${getDeliveryFee(deliveryMethod)}.00`}
            </Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Tax (12%)</Text>
            <Text style={s.summaryValue}>₱{tax.toFixed(2)}</Text>
          </View>
          <View style={s.summaryDivider} />
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total Amount</Text>
            <Text style={s.totalValue}>₱{finalTotal.toFixed(2)}</Text>
          </View>
        </View>

        {/* Main Form Card */}
        <View style={s.modernCard}>
          {/* Delivery Method Section */}
          <View style={s.sectionContainer}>
            <View style={s.sectionHeader}>
              <Ionicons name="car-outline" size={22} color={GREEN} />
              <Text style={s.sectionTitle}>Delivery Method</Text>
            </View>
            
            <View style={s.deliveryOptions}>
              <DeliveryMethodCard
                icon="home-outline"
                title="In-house Delivery"
                subtitle="Delivered by our team"
                fee="₱50"
                selected={deliveryMethod === "in-house"}
                onPress={() => setDeliveryMethod("in-house")}
              />
              <DeliveryMethodCard
                icon="storefront-outline"
                title="Store Pickup"
                subtitle="Pick up from our location"
                fee="FREE"
                selected={deliveryMethod === "pickup"}
                onPress={() => setDeliveryMethod("pickup")}
              />
              <DeliveryMethodCard
                icon="bicycle-outline"
                title="Third-party"
                subtitle="Via delivery partner"
                fee="₱80"
                selected={deliveryMethod === "third-party"}
                onPress={() => setDeliveryMethod("third-party")}
              />
            </View>
          </View>

          {/* Address Section (select from saved addresses) */}
          {deliveryMethod !== "pickup" && (
            <View style={s.sectionContainer}>
              <View style={s.sectionHeader}>
                <Ionicons name="location-outline" size={22} color={GREEN} />
                <Text style={s.sectionTitle}>
                  {deliveryMethod === "in-house" ? "Delivery Address" : "Delivery Location"}
                </Text>
              </View>

              {(addresses || []).length === 0 ? (
                <View style={s.inputContainer}>
                  <TextInput
                    value={deliveryAddress}
                    onChangeText={setDeliveryAddress}
                    placeholder="House no., Street, Barangay, City"
                    style={[s.modernInput, !!addrError && s.inputError]}
                    multiline
                    numberOfLines={3}
                    placeholderTextColor={GRAY}
                  />
                  <Ionicons name="location" size={20} color={!!addrError ? "#EF4444" : GRAY} style={s.inputIcon} />
                  {!!addrError && <Text style={s.errorText}>{addrError}</Text>}
                  <View style={{ height: 10 }} />
                  <TouchableOpacity
                    onPress={() => router.push("/(modal)/addresses")}
                    style={{ alignSelf: "flex-start" }}
                  >
                    <Text style={{ color: BLUE, fontWeight: "700" }}>Add address in Manage Addresses</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <View style={{ gap: 8 }}>
                    {(addresses || []).map((addr) => {
                      const selected = String(deliveryAddress || "").trim() === String(addr || "").trim();
                      return (
                        <TouchableOpacity
                          key={addr}
                          style={[s.addressOption, selected && s.addressOptionSelected]}
                          onPress={() => setDeliveryAddress(addr)}
                          activeOpacity={0.8}
                        >
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                            <Ionicons name={selected ? "radio-button-on" : "radio-button-off"} size={20} color={selected ? GREEN_DARK : GRAY} />
                            <Text style={[s.addressText, selected && { color: GREEN_DARK }]}>{addr}</Text>
                            {String(defaultAddress || "") === String(addr || "") && (
                              <Text style={s.defaultPill}>Default</Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {!!addrError && <Text style={s.errorText}>{addrError}</Text>}
                  <View style={{ height: 10 }} />
                  <TouchableOpacity
                    onPress={() => router.push("/(modal)/addresses")}
                    style={{ alignSelf: "flex-start" }}
                  >
                    <Text style={{ color: BLUE, fontWeight: "700" }}>Manage addresses</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Pickup Info */}
          {deliveryMethod === "pickup" && (
            <View style={s.sectionContainer}>
              <View style={s.pickupCard}>
                <View style={s.pickupHeader}>
                  <Ionicons name="location" size={24} color="#3B82F6" />
                  <Text style={s.pickupTitle}>Pickup Location</Text>
                </View>
                <Text style={s.pickupAddress}>
                  Poblacion 1, Moncada{'\n'}
                  Tarlac, Philippines
                </Text>
                <View style={s.pickupHours}>
                  <Ionicons name="time-outline" size={16} color="#6B7280" />
                  <Text style={s.pickupHoursText}>Business Hours: 9:00 AM - 8:00 PM</Text>
                </View>
                <View style={s.pickupNote}>
                  <Ionicons name="id-card-outline" size={16} color="#F59E0B" />
                  <Text style={s.pickupNoteText}>Please bring a valid ID when picking up</Text>
                </View>
              </View>
            </View>
          )}

          {/* Vouchers Section */}
          <VoucherDropdown
            cartTotal={cartTotal}
            onPromoApplied={(promo, discount, freeShipping) => {
              setAppliedPromo(promo);
              setPromoDiscount(discount);
              setFreeShipping(freeShipping);
            }}
            onPromoRemoved={() => {
              setAppliedPromo(null);
              setPromoDiscount(0);
              setFreeShipping(false);
            }}
            appliedPromo={appliedPromo}
            promoDiscount={promoDiscount}
            freeShipping={freeShipping}
          />

          {/* Payment Section */}
          <View style={s.sectionContainer}>
            <View style={s.sectionHeader}>
              <Ionicons name="card-outline" size={22} color={GREEN} />
              <Text style={s.sectionTitle}>Payment Method</Text>
            </View>
            
            <View style={s.paymentOptions}>
              <PaymentChip
                icon="cash-outline"
                label="Cash on Delivery"
                active={paymentMethod === "COD"}
                onPress={() => setPaymentMethod("COD")}
              />
              <PaymentChip
                icon="wallet-outline"
                label="E-Payment"
                active={paymentMethod === "E-Payment"}
                onPress={() => setPaymentMethod("E-Payment")}
              />
            </View>

            {/* E-Payment Info */}
            {paymentMethod === "E-Payment" && (
              <View style={s.infoBox}>
                <Ionicons name="information-circle-outline" size={20} color="#3B82F6" />
                <Text style={s.infoText}>
                  Choose from GCash, GrabPay, Maya, Cards, or Online Banking
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Place Order Button */}
        <TouchableOpacity
          style={[s.modernBtn, disabled ? s.btnDisabled : null]}
          activeOpacity={0.8}
          onPress={onPlace}
          disabled={disabled}
        >
          {placing ? (
            <View style={s.loadingContainer}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={s.btnText}>Processing...</Text>
            </View>
          ) : (
            <View style={s.btnContent}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#FFFFFF" />
              <Text style={s.btnText}>PLACE ORDER</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={s.bottomSpacer} />
      </ScrollView>

      {/* Modern Toast */}
      {toast ? (
        <View style={s.modernToast}>
          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
          <Text style={s.toastText}>{toast}</Text>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

function DeliveryMethodCard({ icon, title, subtitle, fee, selected, onPress }) {
  return (
    <TouchableOpacity
      style={[s.deliveryCard, selected && s.deliveryCardSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={s.deliveryContent}>
        <View style={[s.iconContainer, selected && s.iconContainerSelected]}>
          <Ionicons name={icon} size={24} color={selected ? GREEN_DARK : GRAY} />
        </View>
        <View style={s.deliveryInfo}>
          <Text style={[s.deliveryTitle, selected && s.deliveryTitleSelected]}>{title}</Text>
          <Text style={s.deliverySubtitle}>{subtitle}</Text>
        </View>
        <View style={s.feeContainer}>
          <Text style={[s.feeText, selected && s.feeTextSelected]}>{fee}</Text>
          {selected && <View style={s.selectedDot} />}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function PaymentChip({ icon, label, active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[s.paymentChip, active && s.paymentChipActive]}
      activeOpacity={0.8}
    >
      <Ionicons 
        name={icon} 
        size={20} 
        color={active ? "#FFFFFF" : GREEN} 
        style={s.chipIcon} 
      />
      <Text style={[s.chipLabel, active && s.chipLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContainer: { paddingBottom: 20 },
  modernHeader: {
    backgroundColor: GREEN, paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20, paddingHorizontal: 20, flexDirection: "row",
    alignItems: "center", justifyContent: "space-between",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 8,
  },
  modernBackBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  headerContent: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 8,
  },
  modernH1: { fontSize: 20, fontWeight: "700", color: "#FFFFFF" },
  headerSpacer: { width: 44 },
  summaryCard: {
    backgroundColor: "#FFFFFF", marginHorizontal: 16, marginTop: -10,
    borderRadius: 16, padding: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 8,
  },
  summaryHeader: {
    flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 8,
  },
  summaryTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  summaryRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: 8,
  },
  summaryLabel: { fontSize: 14, color: GRAY, fontWeight: "500" },
  summaryValue: { fontSize: 14, fontWeight: "600", color: "#111827" },
  freeText: { color: GREEN, fontWeight: "700" },
  summaryDivider: {
    height: 1, backgroundColor: "#E5E7EB", marginVertical: 12,
  },
  totalRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: { fontSize: 16, fontWeight: "700", color: "#111827" },
  totalValue: { fontSize: 20, fontWeight: "800", color: GREEN },
  modernCard: {
    backgroundColor: "#FFFFFF", marginHorizontal: 16, marginTop: 16,
    borderRadius: 16, padding: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  sectionContainer: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  deliveryOptions: { gap: 12 },
  deliveryCard: {
    borderWidth: 2, borderColor: "#E5E7EB", borderRadius: 12,
    padding: 16, backgroundColor: "#FFFFFF",
  },
  deliveryCardSelected: {
    borderColor: GREEN, backgroundColor: GREEN_BG,
  },
  deliveryContent: {
    flexDirection: "row", alignItems: "center", gap: 12,
  },
  iconContainer: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: "#F3F4F6",
    alignItems: "center", justifyContent: "center",
  },
  iconContainerSelected: { backgroundColor: GREEN_BORDER },
  deliveryInfo: { flex: 1 },
  deliveryTitle: {
    fontSize: 16, fontWeight: "600", color: "#111827", marginBottom: 2,
  },
  deliveryTitleSelected: { color: GREEN_DARK },
  deliverySubtitle: { fontSize: 13, color: GRAY },
  feeContainer: { alignItems: "flex-end", position: "relative" },
  feeText: { fontSize: 14, fontWeight: "700", color: "#111827" },
  feeTextSelected: { color: GREEN_DARK },
  selectedDot: {
    position: "absolute", top: -8, right: -8,
    width: 20, height: 20, borderRadius: 10, backgroundColor: GREEN,
  },
  inputContainer: { position: "relative" },
  modernInput: {
    borderWidth: 2, borderColor: BORDER, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, paddingRight: 48,
    fontSize: 16, backgroundColor: "#FFFFFF", color: "#111827",
    fontWeight: "500",
  },
  inputError: {
    borderColor: "#EF4444", backgroundColor: "#FEF2F2",
  },
  inputIcon: { position: "absolute", right: 16, top: 16 },
  addressOption: {
    borderWidth: 2,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
  },
  addressOptionSelected: {
    borderColor: GREEN,
    backgroundColor: GREEN_BG,
  },
  addressText: { fontSize: 15, color: "#111827", fontWeight: "600" },
  defaultPill: {
    marginLeft: 8,
    color: GREEN_DARK,
    fontWeight: "700",
  },
  errorText: {
    color: "#DC2626", fontSize: 12, marginTop: 6, fontWeight: "500",
  },
  pickupCard: {
    backgroundColor: "#F0F9FF", borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: "#BAE6FD",
  },
  pickupHeader: {
    flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 8,
  },
  pickupTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A" },
  pickupAddress: {
    fontSize: 14, color: "#374151", lineHeight: 20, marginBottom: 12,
  },
  pickupHours: {
    flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 6,
  },
  pickupHoursText: {
    fontSize: 13, color: "#6B7280", fontWeight: "500",
  },
  pickupNote: { flexDirection: "row", alignItems: "center", gap: 6 },
  pickupNoteText: { fontSize: 12, color: "#D97706", fontWeight: "500" },
  paymentOptions: { flexDirection: "row", gap: 12, marginBottom: 16 },
  paymentChip: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: 12, borderWidth: 2, borderColor: GREEN_BORDER,
    backgroundColor: "#FFFFFF", gap: 8,
  },
  paymentChipActive: {
    backgroundColor: GREEN, borderColor: GREEN,
  },
  chipIcon: { marginRight: 4 },
  chipLabel: { fontSize: 14, fontWeight: "600", color: GREEN },
  chipLabelActive: { color: "#FFFFFF" },
  infoBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1, borderColor: "#BFDBFE", backgroundColor: "#EFF6FF",
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12,
  },
  infoText: {
    flex: 1, fontSize: 13, color: "#1F2937", fontWeight: "500",
  },
  modernBtn: {
    backgroundColor: BLUE, marginHorizontal: 16, marginTop: 24,
    paddingVertical: 16, borderRadius: 16, alignItems: "center",
    justifyContent: "center",
    shadowColor: BLUE, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  btnDisabled: {
    backgroundColor: "#93C5FD", shadowOpacity: 0, elevation: 0,
  },
  btnContent: {
    flexDirection: "row", alignItems: "center", gap: 8,
  },
  loadingContainer: {
    flexDirection: "row", alignItems: "center", gap: 12,
  },
  btnText: {
    color: "#FFFFFF", fontWeight: "800", fontSize: 16, letterSpacing: 0.5,
  },
  modernToast: {
    position: "absolute", left: 16, right: 16, bottom: 24,
    flexDirection: "row", alignItems: "center",
    paddingVertical: 16, paddingHorizontal: 20,
    backgroundColor: GREEN, borderRadius: 16,
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 8, gap: 8,
  },
  toastText: {
    color: "#FFFFFF", fontWeight: "700", fontSize: 14,
  },
  bottomSpacer: { height: 32 },

  // Rewards styles
  rewardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  rewardCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  rewardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  rewardName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
    marginBottom: 4,
  },
  rewardDiscount: {
    fontSize: 12,
    color: "#10B981",
    fontWeight: "700",
  },
  appliedRewardCard: {
    backgroundColor: "#DCFCE7",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#10B981",
  },
  appliedRewardInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  appliedRewardText: {
    marginLeft: 12,
    flex: 1,
  },
  appliedRewardName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  appliedRewardDiscount: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "500",
  },
  removeRewardBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },

  // Promo code styles
  appliedPromoCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#DCFCE7",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  appliedPromoInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  appliedPromoText: {
    flex: 1,
  },
  appliedPromoName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#065F46",
    marginBottom: 2,
  },
  appliedPromoDiscount: {
    fontSize: 14,
    color: "#047857",
    fontWeight: "600",
  },
  removePromoBtn: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: "#FEE2E2",
  },
  promoInputContainer: {
    marginTop: 8,
  },
  promoInputWrapper: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  promoInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: "600",
    backgroundColor: "#FFFFFF",
    color: "#111827",
  },
  applyPromoBtn: {
    backgroundColor: GREEN,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 80,
  },
  applyPromoBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
});