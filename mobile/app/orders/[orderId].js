import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useContext, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppCtx } from "../../src/context/AppContext";
import { getOrderRefundStatus } from "../../src/api/apiClient";
import { safeGoBackToProfile } from "../../src/utils/navigationUtils";

const GREEN = "#10B981";
const GREEN_BG = "#ECFDF5";
const GREEN_BORDER = "#A7F3D0";
const GREEN_DARK = "#065F46";
const GRAY = "#6B7280";
const LIGHT_GRAY = "#F3F4F6";
const BORDER = "#E5E7EB";
const BLUE = "#3B82F6";
const ORANGE = "#F59E0B";
const RED = "#EF4444";

export default function OrderDetailsPage() {
  const { orderId, from } = useLocalSearchParams();
  const router = useRouter();
  const { orders = [], refreshAuthedData, user } = useContext(AppCtx);

  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);

  const current = useMemo(() => {
    const oid = String(orderId || "");
    return (orders || []).find((o) => String(o._id) === oid) || null;
  }, [orders, orderId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Prefer context order; if missing, try fetching details via refund status API.
      if (!current) {
        try {
          setLoading(true);
          // Ensure freshest orders list for authed users
          if (user) {
            await refreshAuthedData?.(user);
          }
          // Fetch single order details via refund status endpoint (returns order object as part of payload)
          const { data } = await getOrderRefundStatus(orderId);
          const fetched = data?.order || null;
          if (!cancelled) setOrder(fetched);
        } catch (e) {
          console.warn("order detail fetch failed:", e?.message);
          if (!cancelled) setOrder(null);
        } finally {
          if (!cancelled) setLoading(false);
        }
      } else {
        setOrder(current);
      }
    })();
    return () => { cancelled = true; };
  }, [orderId, current, user]);

  const deliveryStatus = useMemo(() => {
    const base = String(order?.delivery?.status || order?.status || "pending").toLowerCase();
    const isEPayment = String(order?.paymentMethod || "").toLowerCase() === "e-payment";
    return isEPayment && base === "pending" ? "confirmed" : base;
  }, [order]);

  const onRefresh = async () => {
    try {
      setLoading(true);
      if (user) await refreshAuthedData?.(user);
      const { data } = await getOrderRefundStatus(orderId);
      setOrder(data?.order || null);
    } catch (e) {
      console.warn("order refresh failed:", e?.message);
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    // If navigated from refund tickets, go back to tickets list
    if (String(from || "").toLowerCase() === "refund") {
      router.replace("/refund/my-tickets");
      return;
    }
    // Use safe navigation with fallback to profile
    safeGoBackToProfile();
  };

  const oidShort = String(orderId || "").slice(-8).toUpperCase();

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.backBtn} onPress={goBack} activeOpacity={0.8}>
          <Text style={s.backIcon}>←</Text>
          <Text style={s.backText}>Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
      </View>

      {(!order && loading) ? (
        <View style={s.centered}> 
          <ActivityIndicator size="large" color={GREEN} />
          <Text style={{ marginTop: 12, color: GRAY }}>Loading order…</Text>
        </View>
      ) : !order ? (
        <View style={s.centered}> 
          <Text style={{ color: GRAY }}>Order not found.</Text>
          <TouchableOpacity style={[s.actionBtn, { marginTop: 16 }]} onPress={() => router.replace("/tabs/profile")}>
            <Text style={s.actionBtnText}>Open Orders</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} colors={[GREEN]} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={s.header}>
            <View>
              <Text style={s.headerTitle}>Order Details</Text>
              <Text style={s.headerSubtitle}>#{oidShort}</Text>
            </View>
            <View style={s.totalPriceBadge}>
              <Text style={s.totalPriceText}>₱{Number(order.total || 0).toFixed(2)}</Text>
            </View>
          </View>

          {/* Status banner */}
          <View style={[s.statusBanner, { backgroundColor: `${getDeliveryStatusColor(deliveryStatus)}15`, borderColor: `${getDeliveryStatusColor(deliveryStatus)}40` }]}> 
            <Text style={s.statusIcon}>{getDeliveryStatusIcon(deliveryStatus)}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[s.statusBannerTitle, { color: getDeliveryStatusColor(deliveryStatus) }]}> 
                {getDeliveryStatusText(deliveryStatus)}
              </Text>
              <Text style={s.statusBannerSubtitle}>
                Order placed on {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
          </View>

          {/* Quick info */}
          <View style={s.quickInfoContainer}>
            <View style={s.quickInfoCard}>
              <Text style={s.quickInfoIcon}>📅</Text>
              <Text style={s.quickInfoLabel}>Date</Text>
              <Text style={s.quickInfoValue}>{new Date(order.createdAt).toLocaleDateString()}</Text>
            </View>
            <View style={s.quickInfoCard}>
              <Text style={s.quickInfoIcon}>💳</Text>
              <Text style={s.quickInfoLabel}>Payment</Text>
              <Text style={s.quickInfoValue}>{order.paymentMethod || 'COD'}</Text>
            </View>
            <View style={s.quickInfoCard}>
              <Text style={s.quickInfoIcon}>📦</Text>
              <Text style={s.quickInfoLabel}>Items</Text>
              <Text style={s.quickInfoValue}>{order.items?.length || 0}</Text>
            </View>
          </View>

          {/* Delivery info */}
          {order.delivery && (
            <View style={s.detailSection}>
              <Text style={s.detailSectionTitle}>🚚 Delivery Information</Text>
              <View style={s.deliveryCard}>
                <View style={s.deliveryRow}>
                  <Text style={s.deliveryLabel}>Type:</Text>
                  <Text style={s.deliveryValue}>{order.delivery.type || 'N/A'}</Text>
                </View>
                {order.delivery.assignedDriver && (
                  <>
                    <View style={s.deliveryRow}>
                      <Text style={s.deliveryLabel}>Driver:</Text>
                      <Text style={s.deliveryValue}>{order.delivery.assignedDriver.name || 'N/A'}</Text>
                    </View>
                    <View style={s.deliveryRow}>
                      <Text style={s.deliveryLabel}>Phone:</Text>
                      <Text style={s.deliveryValue}>{order.delivery.assignedDriver.phone || 'N/A'}</Text>
                    </View>
                  </>
                )}
                {order.delivery.assignedVehicle && (
                  <View style={s.deliveryRow}>
                    <Text style={s.deliveryLabel}>Vehicle:</Text>
                    <Text style={s.deliveryValue}>
                      {order.delivery.assignedVehicle.plate || 'N/A'}
                      {order.delivery.assignedVehicle.model ? ` (${order.delivery.assignedVehicle.model})` : ''}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Address */}
          <View style={s.detailSection}>
            <Text style={s.detailSectionTitle}>
              📍 {String(order?.delivery?.type || order?.deliveryType || '').toLowerCase() === 'pickup' ? 'Pickup Address' : 'Delivery Address'}
            </Text>
            <View style={s.addressCard}>
              <Text style={s.addressText}>
                {String(order?.delivery?.type || order?.deliveryType || '').toLowerCase() === 'pickup'
                  ? (order.address || 'Poblacion 1, Moncada\nTarlac, Philippines')
                  : (order.address || 'No address provided')}
              </Text>
            </View>
          </View>

          {/* Items */}
          {order.items && order.items.length > 0 && (
            <View style={s.detailSection}>
              <Text style={s.detailSectionTitle}>🛍️ Items Ordered</Text>
              <View style={s.itemsContainer}>
                {order.items.map((item, index) => (
                  <View key={index} style={[s.itemRow, index === order.items.length - 1 && { borderBottomWidth: 0 }]}> 
                    <View style={s.itemIcon}><Text style={s.itemIconText}>📦</Text></View>
                    <View style={s.itemInfo}>
                      <Text style={s.itemName}>{item.name || 'Product'}</Text>
                      <Text style={s.itemDetails}>Quantity: {item.quantity}</Text>
                      <Text style={s.itemPrice}>₱{Number(item.price || 0).toFixed(2)} each</Text>
                    </View>
                    <View style={s.itemTotalContainer}>
                      <Text style={s.itemTotal}>₱{(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}</Text>
                    </View>
                  </View>
                ))}
              </View>
              <View style={s.orderSummary}>
                <View style={s.summaryRow}>
                  <Text style={s.summaryLabel}>Subtotal</Text>
                  <Text style={s.summaryValue}>₱{Number(order.items?.reduce((sum, it) => sum + (Number(it.price || 0) * Number(it.quantity || 0)), 0)).toFixed(2)}</Text>
                </View>
                <View style={s.summaryRow}>
                  <Text style={s.summaryLabel}>Delivery Fee</Text>
                  <Text style={s.summaryValue}>₱{Number(order.deliveryFee || 0).toFixed(2)}</Text>
                </View>
                <View style={[s.summaryRow, s.summaryTotal]}>
                  <Text style={s.summaryTotalLabel}>Total</Text>
                  <Text style={s.summaryTotalValue}>₱{Number(order.total || 0).toFixed(2)}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Timeline */}
          <View style={s.timelineContainer}>
            <View style={s.timelineItem}>
              <View style={[s.timelineDot, { backgroundColor: GREEN }]} />
              <View style={s.timelineLine} />
              <View style={s.timelineContent}>
                <Text style={s.timelineTitle}>Order Placed</Text>
                <Text style={s.timelineDate}>{new Date(order.createdAt).toLocaleString()}</Text>
                <Text style={s.timelineDescription}>Your order has been received and is being processed.</Text>
              </View>
            </View>
            {deliveryStatus !== 'pending' && deliveryStatus !== 'cancelled' && (
              <View style={s.timelineItem}>
                <View style={[s.timelineDot, { backgroundColor: BLUE }]} />
                {deliveryStatus !== 'completed' && <View style={s.timelineLine} />}
                <View style={s.timelineContent}>
                  <Text style={s.timelineTitle}>
                    {deliveryStatus === 'assigned' ? 'Driver Assigned' : 'Preparing Your Order'}
                  </Text>
                  <Text style={s.timelineDate}>
                    {deliveryStatus === 'assigned' ? 'Driver is preparing for pickup' : 'Getting your items ready'}
                  </Text>
                  <Text style={s.timelineDescription}>
                    {deliveryStatus === 'assigned' 
                      ? 'A driver has been assigned and will pick up your order soon.'
                      : 'We are preparing your items for delivery.'}
                  </Text>
                </View>
              </View>
            )}
            {deliveryStatus === 'in-transit' && (
              <View style={s.timelineItem}>
                <View style={[s.timelineDot, { backgroundColor: ORANGE }]} />
                <View style={s.timelineLine} />
                <View style={s.timelineContent}>
                  <Text style={s.timelineTitle}>In Transit</Text>
                  <Text style={s.timelineDate}>Courier is en route to your address</Text>
                  <Text style={s.timelineDescription}>Your order is on its way. Please keep your phone accessible.</Text>
                </View>
              </View>
            )}
            {deliveryStatus === 'completed' && (
              <View style={s.timelineItem}>
                <View style={[s.timelineDot, { backgroundColor: GREEN }]} />
                <View style={s.timelineContent}>
                  <Text style={s.timelineTitle}>Delivered</Text>
                  <Text style={s.timelineDate}>Order completed</Text>
                  <Text style={s.timelineDescription}>Thanks for shopping with us!</Text>
                </View>
              </View>
            )}
            {deliveryStatus === 'cancelled' && (
              <View style={s.timelineItem}>
                <View style={[s.timelineDot, { backgroundColor: RED }]} />
                <View style={s.timelineContent}>
                  <Text style={s.timelineTitle}>Cancelled</Text>
                  <Text style={s.timelineDate}>Order cancelled</Text>
                  <Text style={s.timelineDescription}>This order has been cancelled.</Text>
                </View>
              </View>
            )}
          </View>

          {/* Footer actions */}
          <View style={{ paddingVertical: 24 }}>
            <TouchableOpacity style={s.supportButton} activeOpacity={0.8}>
              <Text style={s.supportIcon}>📞</Text>
              <Text style={s.supportButtonText}>Contact Support</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

// Helpers copied from OrdersScreen modal
function getDeliveryStatusColor(status) {
  switch (String(status || "pending").toLowerCase()) {
    case "confirmed":
    case "completed":
      return GREEN;
    case "assigned":
    case "in-transit":
      return BLUE;
    case "cancelled":
      return RED;
    case "pending":
    default:
      return GRAY;
  }
}

function getDeliveryStatusIcon(status) {
  switch (String(status || "pending").toLowerCase()) {
    case "confirmed":
      return "✅";
    case "completed":
      return "✅";
    case "assigned":
      return "👤";
    case "in-transit":
      return "🚚";
    case "cancelled":
      return "❌";
    case "pending":
    default:
      return "⏳";
  }
}

function getDeliveryStatusText(status) {
  switch (String(status || "pending").toLowerCase()) {
    case "confirmed":
      return "Order Confirmed";
    case "completed":
      return "Delivered";
    case "assigned":
      return "Driver Assigned";
    case "in-transit":
      return "In Transit";
    case "cancelled":
      return "Cancelled";
    case "pending":
    default:
      return "Pending";
  }
}

const s = StyleSheet.create({
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: "#FFFFFF",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: LIGHT_GRAY,
  },
  backIcon: { fontSize: 16, marginRight: 6 },
  backText: { fontSize: 14, fontWeight: "700", color: "#111827" },

  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#111827" },
  headerSubtitle: { fontSize: 14, color: GRAY, fontWeight: "600" },
  totalPriceBadge: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  totalPriceText: { fontSize: 18, color: GREEN_DARK, fontWeight: "800" },

  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  statusIcon: { fontSize: 32, marginRight: 16 },
  statusBannerTitle: { fontSize: 20, fontWeight: "800", marginBottom: 4 },
  statusBannerSubtitle: { fontSize: 14, color: GRAY, fontWeight: "500" },

  quickInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginBottom: 16,
  },
  quickInfoCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 16,
    marginRight: 8,
  },
  quickInfoIcon: { fontSize: 18, marginBottom: 6 },
  quickInfoLabel: { fontSize: 12, color: GRAY, fontWeight: "700" },
  quickInfoValue: { fontSize: 14, color: "#111827", fontWeight: "700" },

  detailSection: { marginHorizontal: 16, marginBottom: 16 },
  detailSectionTitle: { fontSize: 18, fontWeight: "800", marginBottom: 8 },

  deliveryCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 16,
  },
  deliveryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  deliveryLabel: { fontSize: 14, color: GRAY, fontWeight: "600" },
  deliveryValue: { fontSize: 14, color: "#111827", fontWeight: "600" },

  addressCard: {
    backgroundColor: LIGHT_GRAY,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 12,
  },
  addressText: { fontSize: 14, color: "#111827" },

  itemsContainer: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    overflow: "hidden",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GREEN_BG,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  itemIconText: { fontSize: 16 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: "600", color: "#111827", marginBottom: 4 },
  itemDetails: { fontSize: 14, color: GRAY, marginBottom: 2 },
  itemPrice: { fontSize: 14, color: GRAY },
  itemTotalContainer: { alignItems: "flex-end" },
  itemTotal: { fontSize: 16, fontWeight: "700", color: GREEN_DARK },

  orderSummary: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderTopWidth: 2,
    borderTopColor: GREEN_BORDER,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  summaryLabel: { fontSize: 14, color: GRAY, fontWeight: "500" },
  summaryValue: { fontSize: 14, color: "#111827", fontWeight: "600" },
  summaryTotal: { borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 12, marginTop: 8 },
  summaryTotalLabel: { fontSize: 16, color: "#111827", fontWeight: "700" },
  summaryTotalValue: { fontSize: 20, color: GREEN_DARK, fontWeight: "800" },

  timelineContainer: { marginTop: 8, marginHorizontal: 16 },
  timelineItem: { flexDirection: "row", marginBottom: 24 },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginTop: 4,
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  timelineLine: { position: "absolute", left: 7, top: 20, bottom: -24, width: 2, backgroundColor: BORDER },
  timelineContent: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  timelineTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 4 },
  timelineDate: { fontSize: 14, color: GRAY, fontWeight: "500", marginBottom: 8 },
  timelineDescription: { fontSize: 14, color: "#374151", lineHeight: 20 },

  supportButton: {
    backgroundColor: BLUE,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  supportIcon: { fontSize: 18, marginRight: 8 },
  supportButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  actionBtn: { backgroundColor: GREEN, paddingVertical: 14, paddingHorizontal: 18, borderRadius: 10 },
  actionBtnText: { color: "#FFFFFF", fontWeight: "700" },
});