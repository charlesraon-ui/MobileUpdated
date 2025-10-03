
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import * as Linking from 'expo-linking';
import { useRouter } from "expo-router";
import { useCallback, useContext, useMemo, useRef, useState } from "react";
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
    deliveryAddress,
    setDeliveryAddress,
    paymentMethod,
    setPaymentMethod,
    handlePlaceOrder,
    isLoggedIn,
    refreshAuthedData,
  } = useContext(AppCtx);

  const [deliveryMethod, setDeliveryMethod] = useState("in-house");
  const [placing, setPlacing] = useState(false);

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

  // Helper functions
  const getDeliveryFee = (method) => {
    if (method === "pickup") return 0;
    if (method === "in-house") return 50;
    if (method === "third-party") return 80;
    return 0;
  };

  const calculateOrderTotals = () => {
    const deliveryFee = getDeliveryFee(deliveryMethod);
    const subtotal = cartTotal;
    const total = subtotal + deliveryFee;

    return { deliveryFee, subtotal, total };
  };

  // Validations
  const addrError = useMemo(() => {
    if (deliveryMethod === "pickup") return "";
    
    const txt = (deliveryAddress || "").trim();
    if (!txt) return "Delivery address is required.";
    if (txt.length < 5) return "Please enter a more specific address.";
    return "";
  }, [deliveryAddress, deliveryMethod]);

  const disabled = !isLoggedIn || cartTotal <= 0 || !!addrError || placing;

  // ✅ FIXED PLACE ORDER FUNCTION
  const onPlace = async () => {
    if (disabled) return;
    
    setPlacing(true);

    try {
      // ✅ CALCULATE TOTALS FIRST - THIS WAS THE BUG!
      const { deliveryFee, subtotal, total } = calculateOrderTotals();

      // ✅ E-PAYMENT FLOW
      if (paymentMethod === "E-Payment") {
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
          deliveryFee: deliveryFee,
          address: deliveryAddress.trim(),
          deliveryType: deliveryMethod,
          channel: "multi" // Support all payment methods
        };

        console.log("📤 Sending E-Payment payload:", JSON.stringify(payload, null, 2));

        const response = await createEPaymentOrder(payload);
        
        console.log("📥 E-Payment response:", response.data);

        const checkoutUrl = response?.data?.payment?.checkoutUrl;

        if (!checkoutUrl) {
          throw new Error("No checkout URL received from payment provider");
        }

        showToast("Redirecting to payment...");
        
        // Open payment URL
        const canOpen = await Linking.canOpenURL(checkoutUrl);
        
        if (!canOpen) {
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
              onPress: () => router.replace("/tabs/orders") 
            }
          ]
        );

        return;
      }

      // ✅ COD FLOW
      showToast("Placing order...");
      
      const res = await handlePlaceOrder();
      
      if (res?.success) {
        const orderId = res.order?._id || res.order?.id;
        const shortId = String(orderId || "").slice(-6).toUpperCase();
        
        showToast(`Order #${shortId} placed!`);
        
        setTimeout(() => {
          router.replace("/tabs/orders");
        }, 1000);
      } else {
        throw new Error(res?.message || "Order creation failed");
      }

    } catch (error) {
      console.error("❌ Place order error:", error);
      
      const errorMessage = 
        error?.response?.data?.message || 
        error?.message || 
        "Failed to place order. Please try again.";
      
      Alert.alert("Order Failed", errorMessage);
    } finally {
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
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Delivery Fee</Text>
            <Text style={[s.summaryValue, deliveryMethod === "pickup" && s.freeText]}>
              {deliveryMethod === "pickup" ? "FREE" : `₱${getDeliveryFee(deliveryMethod)}.00`}
            </Text>
          </View>
          <View style={s.summaryDivider} />
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total Amount</Text>
            <Text style={s.totalValue}>₱{(cartTotal + getDeliveryFee(deliveryMethod)).toFixed(2)}</Text>
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

          {/* Address Section */}
          {deliveryMethod !== "pickup" && (
            <View style={s.sectionContainer}>
              <View style={s.sectionHeader}>
                <Ionicons name="location-outline" size={22} color={GREEN} />
                <Text style={s.sectionTitle}>
                  {deliveryMethod === "in-house" ? "Delivery Address" : "Delivery Location"}
                </Text>
              </View>
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
                <Ionicons 
                  name="location" 
                  size={20} 
                  color={!!addrError ? "#EF4444" : GRAY} 
                  style={s.inputIcon} 
                />
              </View>
              {!!addrError && <Text style={s.errorText}>{addrError}</Text>}
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
                  123 Main Street, Barangay San Antonio{'\n'}
                  Paranaque City, Metro Manila
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
});