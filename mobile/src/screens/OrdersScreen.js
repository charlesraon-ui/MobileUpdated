import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useContext, useRef, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AppCtx } from "../context/AppContext";

const GREEN = "#10B981";
const GREEN_BG = "#ECFDF5";
const GREEN_BORDER = "#A7F3D0";
const GREEN_DARK = "#065F46";
const GRAY = "#6B7280";
const BORDER = "#E5E7EB";
const BLUE = "#3B82F6";

function OrderDetailsModal({ order, visible, onClose }) {
  if (!order) return null;

  const getStatusColor = (status) => {
    const statusLower = String(status || "").toLowerCase();
    switch (statusLower) {
      case 'delivered':
      case 'completed':
        return GREEN;
      case 'processing':
      case 'confirmed':
        return BLUE;
      case 'cancelled':
      case 'failed':
        return '#EF4444';
      case 'shipped':
      case 'out_for_delivery':
        return '#F59E0B';
      default:
        return GRAY;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={s.modalContainer}>
        <View style={s.modalHeader}>
          <Text style={s.modalTitle}>Order Details</Text>
          <TouchableOpacity onPress={onClose} style={s.closeButton}>
            <Text style={s.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={s.modalContent} showsVerticalScrollIndicator={false}>
          {/* Order Info */}
          <View style={s.detailSection}>
            <Text style={s.detailSectionTitle}>Order Information</Text>
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>Order ID:</Text>
              <Text style={s.detailValue}>#{String(order._id).slice(-8).toUpperCase()}</Text>
            </View>
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>Date Placed:</Text>
              <Text style={s.detailValue}>{new Date(order.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</Text>
            </View>
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>Status:</Text>
              <View style={[s.statusBadge, { backgroundColor: `${getStatusColor(order.status)}20` }]}>
                <Text style={[s.statusText, { color: getStatusColor(order.status) }]}>
                  {String(order.status || 'Pending').toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>Payment Method:</Text>
              <Text style={s.detailValue}>{order.paymentMethod || 'COD'}</Text>
            </View>
            <View style={s.detailRow}>
              <Text style={s.detailLabel}>Total Amount:</Text>
              <Text style={[s.detailValue, s.totalAmount]}>₱{Number(order.totalAmount || order.total || 0).toFixed(2)}</Text>
            </View>
          </View>

          {/* Delivery Address */}
          <View style={s.detailSection}>
            <Text style={s.detailSectionTitle}>Delivery Address</Text>
            <Text style={s.addressText}>{order.deliveryAddress || order.address || 'No address provided'}</Text>
          </View>

          {/* Items */}
          {order.items && order.items.length > 0 && (
            <View style={s.detailSection}>
              <Text style={s.detailSectionTitle}>Items Ordered ({order.items.length})</Text>
              {order.items.map((item, index) => (
                <View key={index} style={s.itemRow}>
                  <View style={s.itemInfo}>
                    <Text style={s.itemName}>{item.product?.name || item.name || 'Product'}</Text>
                    <Text style={s.itemDetails}>Qty: {item.quantity} × ₱{Number(item.price || 0).toFixed(2)}</Text>
                  </View>
                  <Text style={s.itemTotal}>₱{(Number(item.quantity || 1) * Number(item.price || 0)).toFixed(2)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Order Timeline */}
          <View style={s.detailSection}>
            <Text style={s.detailSectionTitle}>Order Timeline</Text>
            <View style={s.timelineContainer}>
              <View style={s.timelineItem}>
                <View style={[s.timelineDot, { backgroundColor: GREEN }]} />
                <View style={s.timelineContent}>
                  <Text style={s.timelineTitle}>Order Placed</Text>
                  <Text style={s.timelineDate}>{new Date(order.createdAt).toLocaleString()}</Text>
                </View>
              </View>
              {order.status !== 'pending' && (
                <View style={s.timelineItem}>
                  <View style={[s.timelineDot, { backgroundColor: BLUE }]} />
                  <View style={s.timelineContent}>
                    <Text style={s.timelineTitle}>Order Confirmed</Text>
                    <Text style={s.timelineDate}>Processing your order</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Support Button */}
        <View style={s.modalFooter}>
          <TouchableOpacity style={s.supportButton} activeOpacity={0.8}>
            <Text style={s.supportButtonText}>📞 Contact Support</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function OrdersScreen() {
  const { focusOrderId } = useLocalSearchParams();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const {
    orders,
    isLoggedIn,
    refreshAuthedData,
  } = useContext(AppCtx);

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

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <Text style={s.h1}>Order History</Text>

      {orders.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyText}>📦</Text>
          <Text style={s.emptyTitle}>No orders yet</Text>
          <Text style={s.emptySubtitle}>You haven't placed any orders yet. Start shopping to see your orders here!</Text>
        </View>
      ) : (
        orders.map((o) => {
          const isFocus = String(o._id) === String(focusOrderId || "");
          return (
            <View
              key={o._id}
              style={[
                s.orderRow,
                isFocus && { borderColor: "#059669", borderWidth: 2 },
              ]}
            >
              <View style={s.orderAccent} />
              <View style={s.orderHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={s.orderId}>#{String(o._id).slice(-6).toUpperCase()}</Text>
                  <Text style={s.orderMeta}>{new Date(o.createdAt).toLocaleString()}</Text>
                  <Text style={s.orderAddress}>📍 {o.address || 'No address'}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={s.orderAmt}>₱{Number(o.totalAmount || o.total || 0).toFixed(2)}</Text>
                  <Text style={s.orderStatus}>{o.status || "Pending"}</Text>
                </View>
              </View>

              {/* View Details Button */}
              <TouchableOpacity 
                style={s.viewDetailsButton} 
                onPress={() => handleViewDetails(o)}
                activeOpacity={0.8}
              >
                <Text style={s.viewDetailsText}>View Full Details</Text>
                <Text style={s.viewDetailsArrow}>→</Text>
              </TouchableOpacity>
            </View>
          );
        })
      )}

      {/* Order Details Modal */}
      <OrderDetailsModal 
        order={selectedOrder}
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSelectedOrder(null);
        }}
      />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  h1: { 
    fontSize: 24, 
    fontWeight: "700", 
    marginBottom: 20,
    textAlign: "center",
  },

  // Empty state
  empty: { 
    alignItems: "center", 
    paddingVertical: 60, 
    paddingHorizontal: 20,
    marginTop: 40,
  },
  emptyText: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: GRAY,
    textAlign: "center",
    lineHeight: 20,
  },

  // Order cards
  orderRow: {
    marginTop: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: GREEN_BORDER,
    backgroundColor: GREEN_BG,
    borderRadius: 12,
    position: "relative",
  },
  orderAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: GREEN,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  orderHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  orderId: { fontWeight: "800", color: GREEN_DARK },
  orderMeta: { color: "#065F46AA", marginTop: 2 },
  orderAddress: { color: "#065F46AA", marginTop: 4, fontSize: 12 },
  orderAmt: { fontWeight: "800", color: GREEN_DARK, textAlign: "right" },
  orderStatus: { 
    color: GREEN, 
    textTransform: "capitalize", 
    fontWeight: "700", 
    marginTop: 2, 
    textAlign: "right" 
  },

  // View Details Button
  viewDetailsButton: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: GREEN,
  },
  viewDetailsText: {
    color: GREEN_DARK,
    fontWeight: "600",
    marginRight: 4,
  },
  viewDetailsArrow: {
    color: GREEN_DARK,
    fontWeight: "700",
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: "#F9FAFB",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "600",
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    backgroundColor: "#F9FAFB",
  },

  // Detail sections
  detailSection: {
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: GRAY,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
    marginLeft: 16,
  },
  totalAmount: {
    color: GREEN_DARK,
    fontSize: 16,
    fontWeight: "700",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  addressText: {
    fontSize: 14,
    color: "#111827",
    lineHeight: 20,
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
  },

  // Items
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 12,
    color: GRAY,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: "700",
    color: GREEN_DARK,
  },

  // Timeline
  timelineContainer: {
    marginTop: 8,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  timelineDate: {
    fontSize: 12,
    color: GRAY,
  },

  // Support button
  supportButton: {
    backgroundColor: BLUE,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  supportButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});