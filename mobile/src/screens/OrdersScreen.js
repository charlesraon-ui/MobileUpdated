import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useContext, useRef, useState } from "react";
import {
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { AppCtx } from "../context/AppContext";

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

function OrderDetailsModal({ order, visible, onClose }) {
  if (!order) return null;

  // ✅ Compute UI status: if E-Payment and order is pending, show confirmed
  const baseStatus = order.delivery?.status || order.status || "pending";
  const deliveryStatus =
    String(order.paymentMethod || "").toLowerCase() === "e-payment" && String(baseStatus).toLowerCase() === "pending"
      ? "confirmed"
      : baseStatus;

  const getDeliveryStatusColor = (status) => {
    const statusLower = String(status || "").toLowerCase();
    switch (statusLower) {
      case 'confirmed':
        return GREEN;
      case 'completed':
        return GREEN;
      case 'assigned':
      case 'in-transit':
        return BLUE;
      case 'cancelled':
        return RED;
      case 'pending':
      default:
        return GRAY;
    }
  };

  const getDeliveryStatusIcon = (status) => {
    const statusLower = String(status || "").toLowerCase();
    switch (statusLower) {
      case 'confirmed':
        return '✅';
      case 'completed':
        return '✅';
      case 'assigned':
        return '👨‍🚚';
      case 'in-transit':
        return '🚚';
      case 'cancelled':
        return '❌';
      case 'pending':
      default:
        return '⏳';
    }
  };

  const getDeliveryStatusText = (status) => {
    const statusLower = String(status || "").toLowerCase();
    switch (statusLower) {
      case 'confirmed':
        return 'CONFIRMED';
      case 'completed':
        return 'COMPLETED';
      case 'assigned':
        return 'ASSIGNED';
      case 'in-transit':
        return 'IN TRANSIT';
      case 'cancelled':
        return 'CANCELLED';
      case 'pending':
      default:
        return 'PENDING';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={s.modalContainer}>
        <View style={s.modalHeader}>
          <View>
            <Text style={s.modalTitle}>Order Details</Text>
            <Text style={s.modalSubtitle}>#{String(order._id).slice(-8).toUpperCase()}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={s.closeButton}>
            <Text style={s.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={s.modalContent} showsVerticalScrollIndicator={false}>
          {/* Delivery Status Banner */}
          <View style={[s.statusBanner, { backgroundColor: `${getDeliveryStatusColor(deliveryStatus)}15` }]}>
            <Text style={s.statusIcon}>{getDeliveryStatusIcon(deliveryStatus)}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[s.statusBannerTitle, { color: getDeliveryStatusColor(deliveryStatus) }]}>
                {getDeliveryStatusText(deliveryStatus)}
              </Text>
              <Text style={s.statusBannerSubtitle}>
                Order placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </Text>
            </View>
            <View style={s.totalPriceBadge}>
              <Text style={s.totalPriceText}>₱{Number(order.total || 0).toFixed(2)}</Text>
            </View>
          </View>

          {/* Quick Info Cards */}
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

          {/* Delivery Info */}
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

          {/* Delivery Address */}
          <View style={s.detailSection}>
            <Text style={s.detailSectionTitle}>📍 Delivery Address</Text>
            <View style={s.addressCard}>
              <Text style={s.addressText}>{order.address || 'No address provided'}</Text>
            </View>
          </View>

          {/* Items */}
          {order.items && order.items.length > 0 && (
            <View style={s.detailSection}>
              <Text style={s.detailSectionTitle}>🛍️ Items Ordered</Text>
              <View style={s.itemsContainer}>
                {order.items.map((item, index) => (
                  <View key={index} style={[s.itemRow, index === order.items.length - 1 && { borderBottomWidth: 0 }]}>
                    <View style={s.itemIcon}>
                      <Text style={s.itemIconText}>📦</Text>
                    </View>
                    <View style={s.itemInfo}>
                      <Text style={s.itemName}>{item.name || 'Product'}</Text>
                      <Text style={s.itemDetails}>Quantity: {item.quantity}</Text>
                      <Text style={s.itemPrice}>₱{Number(item.price || 0).toFixed(2)} each</Text>
                    </View>
                    <View style={s.itemTotalContainer}>
                      <Text style={s.itemTotal}>₱{(Number(item.quantity || 1) * Number(item.price || 0)).toFixed(2)}</Text>
                    </View>
                  </View>
                ))}
                
                {/* Order Summary */}
                <View style={s.orderSummary}>
                  <View style={s.summaryRow}>
                    <Text style={s.summaryLabel}>Subtotal:</Text>
                    <Text style={s.summaryValue}>
                      ₱{order.items.reduce((sum, item) => sum + (Number(item.quantity || 1) * Number(item.price || 0)), 0).toFixed(2)}
                    </Text>
                  </View>
                  <View style={s.summaryRow}>
                    <Text style={s.summaryLabel}>Delivery Fee:</Text>
                    <Text style={s.summaryValue}>₱0.00</Text>
                  </View>
                  <View style={[s.summaryRow, s.summaryTotal]}>
                    <Text style={s.summaryTotalLabel}>Total:</Text>
                    <Text style={s.summaryTotalValue}>₱{Number(order.total || 0).toFixed(2)}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Delivery Timeline */}
          <View style={s.detailSection}>
            <Text style={s.detailSectionTitle}>🚚 Delivery Timeline</Text>
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
                        : 'We\'re carefully preparing your items for delivery.'}
                    </Text>
                  </View>
                </View>
              )}
              {deliveryStatus === 'in-transit' && (
                <View style={s.timelineItem}>
                  <View style={[s.timelineDot, { backgroundColor: ORANGE }]} />
                  <View style={s.timelineLine} />
                  <View style={s.timelineContent}>
                    <Text style={s.timelineTitle}>Out for Delivery</Text>
                    <Text style={s.timelineDate}>On the way to you</Text>
                    <Text style={s.timelineDescription}>Your order is currently being delivered to your address.</Text>
                  </View>
                </View>
              )}
              {deliveryStatus === 'completed' && (
                <View style={s.timelineItem}>
                  <View style={[s.timelineDot, { backgroundColor: GREEN }]} />
                  <View style={s.timelineContent}>
                    <Text style={s.timelineTitle}>Delivered</Text>
                    <Text style={s.timelineDate}>Successfully delivered</Text>
                    <Text style={s.timelineDescription}>Your order has been delivered successfully!</Text>
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
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={s.modalFooter}>
          <TouchableOpacity style={s.supportButton} activeOpacity={0.8}>
            <Text style={s.supportIcon}>📞</Text>
            <Text style={s.supportButtonText}>Contact Support</Text>
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
  const [refreshing, setRefreshing] = useState(false);

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

  const onRefresh = useCallback(async () => {
    if (!isLoggedIn) return;
    setRefreshing(true);
    try {
      await refreshAuthedData?.();
    } finally {
      setRefreshing(false);
    }
  }, [isLoggedIn, refreshAuthedData]);

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  // ✅ Updated to use delivery.status instead of order.status
  const getDeliveryStatusColor = (order) => {
    const base = String(order.delivery?.status || order.status || "pending").toLowerCase();
    const status =
      String(order.paymentMethod || "").toLowerCase() === "e-payment" && base === "pending"
        ? "confirmed"
        : base;
    switch (status) {
      case 'confirmed':
        return GREEN;
      case 'completed':
        return GREEN;
      case 'assigned':
      case 'in-transit':
        return BLUE;
      case 'cancelled':
        return RED;
      case 'pending':
      default:
        return GRAY;
    }
  };

  const getDeliveryStatusIcon = (order) => {
    const base = String(order.delivery?.status || order.status || "pending").toLowerCase();
    const status =
      String(order.paymentMethod || "").toLowerCase() === "e-payment" && base === "pending"
        ? "confirmed"
        : base;
    switch (status) {
      case 'confirmed':
        return '✅';
      case 'completed':
        return '✅';
      case 'assigned':
        return '👨‍🚚';
      case 'in-transit':
        return '🚚';
      case 'cancelled':
        return '❌';
      case 'pending':
      default:
        return '⏳';
    }
  };

  const getDeliveryStatusText = (order) => {
    const base = String(order.delivery?.status || order.status || "pending").toLowerCase();
    const status =
      String(order.paymentMethod || "").toLowerCase() === "e-payment" && base === "pending"
        ? "confirmed"
        : base;
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'completed':
        return 'Completed';
      case 'assigned':
        return 'Assigned';
      case 'in-transit':
        return 'In Transit';
      case 'cancelled':
        return 'Cancelled';
      case 'pending':
      default:
        return 'Pending';
    }
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>My Orders</Text>
        <Text style={s.headerSubtitle}>Track your delivery status</Text>
      </View>

      <ScrollView 
        style={s.scrollContainer}
        contentContainerStyle={s.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[GREEN]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {orders.length === 0 ? (
          <View style={s.empty}>
            <View style={s.emptyIconContainer}>
              <Text style={s.emptyIcon}>🛍️</Text>
            </View>
            <Text style={s.emptyTitle}>No orders yet</Text>
            <Text style={s.emptySubtitle}>
              Your order history will appear here once you make your first purchase. 
              Start shopping to see your orders!
            </Text>
            <TouchableOpacity style={s.emptyButton} activeOpacity={0.8}>
              <Text style={s.emptyButtonText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.ordersContainer}>
            <Text style={s.ordersCount}>
              {orders.length} order{orders.length !== 1 ? 's' : ''} found
            </Text>
            
            {orders.map((order, index) => {
              const isFocus = String(order._id) === String(focusOrderId || "");
              const deliveryStatusColor = getDeliveryStatusColor(order);
              const deliveryStatusIcon = getDeliveryStatusIcon(order);
              
              return (
                <TouchableOpacity
                  key={order._id}
                  style={[
                    s.orderCard,
                    isFocus && s.orderCardFocused,
                  ]}
                  onPress={() => handleViewDetails(order)}
                  activeOpacity={0.95}
                >
                  {/* Delivery Status indicator */}
                  <View style={[s.statusIndicator, { backgroundColor: deliveryStatusColor }]} />
                  
                  {/* Order Header */}
                  <View style={s.orderCardHeader}>
                    <View style={s.orderIdContainer}>
                      <Text style={s.orderIdLabel}>Order</Text>
                      <Text style={s.orderId}>#{String(order._id).slice(-6).toUpperCase()}</Text>
                    </View>
                    <View style={s.statusContainer}>
                      <Text style={s.statusIcon}>{deliveryStatusIcon}</Text>
                      <Text style={[s.statusText, { color: deliveryStatusColor }]}>
                        {getDeliveryStatusText(order)}
                      </Text>
                    </View>
                  </View>

                  {/* Order Info */}
                  <View style={s.orderInfo}>
                    <View style={s.orderMetaRow}>
                      <View style={s.orderMetaItem}>
                        <Text style={s.orderMetaIcon}>📅</Text>
                        <Text style={s.orderMetaText}>
                          {new Date(order.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </Text>
                      </View>
                      <View style={s.orderMetaItem}>
                        <Text style={s.orderMetaIcon}>📦</Text>
                        <Text style={s.orderMetaText}>
                          {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                        </Text>
                      </View>
                    </View>
                    
                    {order.address && (
                      <View style={s.addressPreview}>
                        <Text style={s.addressIcon}>📍</Text>
                        <Text style={s.addressText} numberOfLines={1}>
                          {order.address}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Price and Action */}
                  <View style={s.orderCardFooter}>
                    <View style={s.priceContainer}>
                      <Text style={s.priceLabel}>Total</Text>
                      <Text style={s.priceValue}>
                        ₱{Number(order.total || 0).toFixed(2)}
                      </Text>
                    </View>
                    <View style={s.actionButton}>
                      <Text style={s.actionButtonText}>Track Delivery</Text>
                      <Text style={s.actionButtonArrow}>→</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Order Details Modal */}
      <OrderDetailsModal 
        order={selectedOrder}
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSelectedOrder(null);
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F8FAFC",
  },
  
  // Header
  header: {
    backgroundColor: "#FFFFFF",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: GRAY,
    fontWeight: "500",
  },

  // Scroll container
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },

  // Orders list
  ordersContainer: {
    padding: 16,
  },
  ordersCount: {
    fontSize: 14,
    color: GRAY,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },

  // Empty state
  empty: { 
    alignItems: "center", 
    paddingVertical: 80, 
    paddingHorizontal: 32,
    marginTop: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: GREEN_BG,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyIcon: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: GRAY,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyButton: {
    backgroundColor: GREEN,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  // Order cards
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    position: "relative",
  },
  orderCardFocused: {
    borderColor: GREEN,
    borderWidth: 2,
    shadowColor: GREEN,
    shadowOpacity: 0.2,
  },
  statusIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  
  // Order card header
  orderCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  orderIdContainer: {
    flex: 1,
  },
  orderIdLabel: {
    fontSize: 12,
    color: GRAY,
    fontWeight: "500",
    marginBottom: 2,
  },
  orderId: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: LIGHT_GRAY,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },

  // Order info
  orderInfo: {
    marginBottom: 16,
  },
  orderMetaRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  orderMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 24,
  },
  orderMetaIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  orderMetaText: {
    fontSize: 14,
    color: GRAY,
    fontWeight: "500",
  },
  addressPreview: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: LIGHT_GRAY,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addressIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  addressText: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
    flex: 1,
  },

  // Order card footer
  orderCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: GRAY,
    fontWeight: "500",
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: "800",
    color: GREEN_DARK,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: GREEN_BG,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: GREEN_BORDER,
  },
  actionButtonText: {
    fontSize: 14,
    color: GREEN_DARK,
    fontWeight: "600",
    marginRight: 6,
  },
  actionButtonArrow: {
    fontSize: 14,
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
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: LIGHT_GRAY,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    color: GRAY,
    fontWeight: "600",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  closeButtonText: {
    fontSize: 18,
    color: GRAY,
    fontWeight: "700",
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    backgroundColor: LIGHT_GRAY,
  },

  // Status banner
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: GREEN_BORDER,
  },
  statusIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  statusBannerTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 4,
  },
  statusBannerSubtitle: {
    fontSize: 14,
    color: GRAY,
    fontWeight: "500",
  },
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
  totalPriceText: {
    fontSize: 18,
    fontWeight: "800",
    color: GREEN_DARK,
  },

  // Quick info cards
  quickInfoContainer: {
    flexDirection: "row",
    marginBottom: 24,
    gap: 12,
  },
  quickInfoCard: {
    flex: 1,
    backgroundColor: LIGHT_GRAY,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  quickInfoIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickInfoLabel: {
    fontSize: 12,
    color: GRAY,
    fontWeight: "600",
    marginBottom: 4,
  },
  quickInfoValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },

  // Detail sections
  detailSection: {
    marginBottom: 32,
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },

  // Delivery card
  deliveryCard: {
    backgroundColor: LIGHT_GRAY,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  deliveryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  deliveryLabel: {
    fontSize: 14,
    color: GRAY,
    fontWeight: "600",
  },
  deliveryValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
  },

  // Address card
  addressCard: {
    backgroundColor: LIGHT_GRAY,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },

  // Items container
  itemsContainer: {
    backgroundColor: LIGHT_GRAY,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
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
  itemIconText: {
    fontSize: 16,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 14,
    color: GRAY,
    marginBottom: 2,
  },
  itemPrice: {
    fontSize: 14,
    color: GRAY,
  },
  itemTotalContainer: {
    alignItems: "flex-end",
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: "700",
    color: GREEN_DARK,
  },

  // Order summary
  orderSummary: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderTopWidth: 2,
    borderTopColor: GREEN_BORDER,
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
    color: "#111827",
    fontWeight: "600",
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 12,
    marginTop: 8,
  },
  summaryTotalLabel: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "700",
  },
  summaryTotalValue: {
    fontSize: 20,
    color: GREEN_DARK,
    fontWeight: "800",
  },

  // Timeline
  timelineContainer: {
    marginTop: 8,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 24,
  },
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
  timelineLine: {
    position: "absolute",
    left: 7,
    top: 20,
    bottom: -24,
    width: 2,
    backgroundColor: BORDER,
  },
  timelineContent: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  timelineDate: {
    fontSize: 14,
    color: GRAY,
    fontWeight: "500",
    marginBottom: 8,
  },
  timelineDescription: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },

  // Support button
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
  supportIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  supportButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});