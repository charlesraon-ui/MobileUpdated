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
import { createGCashOrder } from "../api/apiClient";
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
    gcashNumber,
    setGcashNumber,
    handlePlaceOrder,
    isLoggedIn,
    refreshAuthedData,
  } = useContext(AppCtx);

  const [deliveryMethod, setDeliveryMethod] = useState("in-house");
  const [placing, setPlacing] = useState(false);
  const isPayMongoGCash = paymentMethod === "PayMongo-GCash";
  const isPayMongoPayMaya = paymentMethod === "PayMongo-PayMaya";
  const isCOD = paymentMethod === "COD";
  const isLegacyGCash = paymentMethod === "GCash";

  console.log("Payment states:", {
  paymentMethod,
  isPayMongoGCash,
  isPayMongoPayMaya,
  isCOD,
  isLegacyGCash,
});

  // --- toast ---
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);
  const showToast = (msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2200);
  };
  useEffect(() => () => toastTimer.current && clearTimeout(toastTimer.current), []);

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

  // validations
  const addrError = useMemo(() => {
    // Only require address for in-house and third-party delivery
    if (deliveryMethod === "pickup") return "";
    
    const txt = (deliveryAddress || "").trim();
    if (!txt) return "Delivery address is required.";
    if (txt.length < 5) return "Please enter a more specific address.";
    return "";
  }, [deliveryAddress, deliveryMethod]);

  const gcashError = useMemo(() => {
    if (!isPayMongoGCash) return "";
    const n = (gcashNumber || "").trim();
    return /^(09\d{9})$/.test(n) ? "" : "Enter a valid 11-digit GCash number starting with 09.";
  }, [gcashNumber, isPayMongoGCash]);

  const disabled =
    !isLoggedIn || cartTotal <= 0 || !!addrError || !!gcashError || placing;

  const onPlace = async () => {
  if (disabled) return;
  setPlacing(true);
  
  try {
    // ========== GCASH PAYMENT ==========
    if (paymentMethod === "GCash") {
      console.log("🔵 GCash payment selected");
      
      // Validate GCash number
      if (!gcashNumber || gcashNumber.trim().length !== 11) {
        Alert.alert("Invalid GCash Number", "Please enter a valid 11-digit GCash number");
        setPlacing(false);
        return;
      }

      showToast("Creating payment...");

      const payload = {
        items: cart,
        total: cartTotal,
        address: deliveryAddress,
        gcashNumber: gcashNumber.trim(),
        deliveryType: deliveryMethod,
      };

      console.log("📤 Sending GCash order:", payload);

      try {
        const response = await createGCashOrder(payload);

        console.log("📥 Response:", response.data);

        if (response?.data?.success && response.data.payment?.checkoutUrl) {
          const checkoutUrl = response.data.payment.checkoutUrl;
          
          console.log("🔗 Opening PayMongo URL:", checkoutUrl);
          
          showToast("Redirecting to payment...");
          
          // Open GCash checkout in browser
          const canOpen = await Linking.canOpenURL(checkoutUrl);
          if (canOpen) {
            await Linking.openURL(checkoutUrl);
            
            // Show success message
            Alert.alert(
              "Complete Your Payment",
              "Please complete your GCash payment in the browser. Your order will be confirmed once payment is received.",
              [
                {
                  text: "View My Orders",
                  onPress: () => router.push("/tabs/orders"),
                },
              ]
            );
          } else {
            Alert.alert("Error", "Cannot open payment page. Please try again.");
          }
        } else {
          Alert.alert("Error", response?.data?.message || "Failed to create payment");
        }
      } catch (error) {
        console.error("❌ GCash order error:", error);
        Alert.alert(
          "Payment Error",
          error.response?.data?.message || error.message || "Failed to create payment. Please try again."
        );
      }
      
      setPlacing(false);
      return;
    }

    // ========== COD PAYMENT ==========
    console.log("🔵 COD payment selected");
    const res = await handlePlaceOrder();
    
    if (res?.success) {
      const orderId = res.order?._id || res.order?.id;
      const shortId = String(orderId || "").slice(-6).toUpperCase();
      showToast(`Order #${shortId} placed!`);
      
      setTimeout(() => {
        router.push("/tabs/orders");
      }, 1000);
    } else {
      Alert.alert("Order Failed", res?.message || "Please try again.");
    }
  } catch (error) {
    console.error("❌ Place order error:", error);
    Alert.alert(
      "Error",
      error.response?.data?.message || error.message || "Failed to place order"
    );
  } finally {
    setPlacing(false);
  }
};

  const getDeliveryFee = (method) => {
    switch (method) {
      case "pickup":
        return 0;
      case "in-house":
        return 50;
      case "third-party":
        return 80;
      default:
        return 0;
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
                active={!isPayMongoGCash}
                onPress={() => {
                  setPaymentMethod("COD");
                  setGcashNumber("");
                }}
              />
              <PaymentChip
                icon="phone-portrait-outline"
                label="GCash"
                active={isPayMongoGCash}
                onPress={() => setPaymentMethod("PayMongo-Gcash")}
              />
            </View>

            {/* GCash Number Input */}
            {isPayMongoGCash && (
              <View style={s.gcashContainer}>
                <Text style={s.inputLabel}>GCash Mobile Number</Text>
                <View style={s.inputContainer}>
                  <TextInput
                    value={gcashNumber}
                    onChangeText={(t) => setGcashNumber(t.replace(/[^\d]/g, "").slice(0, 11))}
                    placeholder="09xxxxxxxxx"
                    keyboardType="number-pad"
                    style={[s.modernInput, !!gcashError && s.inputError]}
                    placeholderTextColor={GRAY}
                  />
                  <Ionicons 
                    name="phone-portrait" 
                    size={20} 
                    color={!!gcashError ? "#EF4444" : GRAY} 
                    style={s.inputIcon} 
                  />
                </View>
                {!!gcashError && <Text style={s.errorText}>{gcashError}</Text>}
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
              <Text style={s.btnText}>Processing Order...</Text>
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
  container: { 
    flex: 1, 
    backgroundColor: "#F8FAFC" 
  },
  
  scrollContainer: { 
    paddingBottom: 20 
  },

  // Modern Header
  modernHeader: {
    backgroundColor: GREEN,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },

  modernBackBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  headerContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  modernH1: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  headerSpacer: {
    width: 44,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: -10,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },

  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },

  summaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  summaryLabel: {
    fontSize: 14,
    color: GRAY,
    fontWeight: "500",
  },

  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },

  freeText: {
    color: GREEN,
    fontWeight: "700",
  },

  summaryDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },

  totalValue: {
    fontSize: 20,
    fontWeight: "800",
    color: GREEN,
  },

  // Modern Card
  modernCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  // Section Styling
  sectionContainer: {
    marginBottom: 24,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },

  // Delivery Options
  deliveryOptions: {
    gap: 12,
  },

  deliveryCard: {
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#FFFFFF",
  },

  deliveryCardSelected: {
    borderColor: GREEN,
    backgroundColor: GREEN_BG,
  },

  deliveryContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },

  iconContainerSelected: {
    backgroundColor: GREEN_BORDER,
  },

  deliveryInfo: {
    flex: 1,
  },

  deliveryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },

  deliveryTitleSelected: {
    color: GREEN_DARK,
  },

  deliverySubtitle: {
    fontSize: 13,
    color: GRAY,
  },

  feeContainer: {
    alignItems: "flex-end",
    position: "relative",
  },

  feeText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },

  feeTextSelected: {
    color: GREEN_DARK,
  },

  selectedDot: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: GREEN,
  },

  // Input Styling
  inputContainer: {
    position: "relative",
  },

  modernInput: {
    borderWidth: 2,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingRight: 48,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
    color: "#111827",
    fontWeight: "500",
  },

  inputError: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },

  inputIcon: {
    position: "absolute",
    right: 16,
    top: 16,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
  },

  errorText: {
    color: "#DC2626",
    fontSize: 12,
    marginTop: 6,
    fontWeight: "500",
  },

  // Pickup Card
  pickupCard: {
    backgroundColor: "#F0F9FF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },

  pickupHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },

  pickupTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },

  pickupAddress: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
    marginBottom: 12,
  },

  pickupHours: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },

  pickupHoursText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },

  pickupNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  pickupNoteText: {
    fontSize: 12,
    color: "#D97706",
    fontWeight: "500",
  },

  // Payment Options
  paymentOptions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },

  paymentChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: GREEN_BORDER,
    backgroundColor: "#FFFFFF",
    gap: 8,
  },

  paymentChipActive: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },

  chipIcon: {
    marginRight: 4,
  },

  chipLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: GREEN,
  },

  chipLabelActive: {
    color: "#FFFFFF",
  },

  gcashContainer: {
    marginTop: 16,
  },

  // Modern Button
  modernBtn: {
    backgroundColor: BLUE,
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },

  btnDisabled: {
    backgroundColor: "#93C5FD",
    shadowOpacity: 0,
    elevation: 0,
  },

  btnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  btnText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.5,
  },

  // Modern Toast
  modernToast: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 24,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: GREEN,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    gap: 8,
  },

  toastText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },

  bottomSpacer: {
    height: 32,
  },

  // Payment Options
  paymentOptions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },

  paymentChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: GREEN_BORDER,
    backgroundColor: "#FFFFFF",
    gap: 8,
  },

  paymentChipActive: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },

  chipIcon: {
    marginRight: 4,
  },

  chipLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: GREEN,
  },

  chipLabelActive: {
    color: "#FFFFFF",
  },

  gcashContainer: {
    marginTop: 16,
  },

  // Modern Button
  modernBtn: {
    backgroundColor: BLUE,
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },

  btnDisabled: {
    backgroundColor: "#93C5FD",
    shadowOpacity: 0,
    elevation: 0,
  },

  btnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  btnText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.5,
  },

  // Modern Toast
  modernToast: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 24,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: GREEN,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    gap: 8,
  },

  toastText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },

  bottomSpacer: {
    height: 32,
  },
});