import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useContext, useEffect, useState } from "react";
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image
} from "react-native";
import { AppCtx } from "../context/AppContext";
import { getDigitalCard, getLoyaltyStatus, issueLoyaltyCard, getMyRefundTicketsApi } from "../api/apiClient";
// Avatar upload removed

const { width, height } = Dimensions.get('window');

export default function ProfileScreen() {
  const { user, isLoggedIn, handleLogout, myReviews, fetchMyReviews, toAbsoluteUrl, setUserState, persistUser, orders } = useContext(AppCtx);
  const [cardVisible, setCardVisible] = useState(false);
  const [cardLoading, setCardLoading] = useState(false);
  const [card, setCard] = useState(null);
  const [loyalty, setLoyalty] = useState(null);
  const [issueLoading, setIssueLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [refundMap, setRefundMap] = useState({});
  // Avatar upload removed

  // Safely format dates coming from backend, avoiding RangeError on invalid values
  const formatDateSafe = (input) => {
    if (!input) return "-";
    try {
      const d = new Date(input);
      if (isNaN(d.getTime())) return "-";
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
    } catch {
      return "-";
    }
  };

  const getCardTheme = (tier, active) => {
    if (!active) {
      return {
        bg: "#1F2937",
        brand: "#E5E7EB",
        label: "#9CA3AF",
        value: "#FFFFFF",
      };
    }
    switch (String(tier || "sprout").toLowerCase()) {
      case "sprout":
        return { bg: "#10B981", brand: "#E6FDF4", label: "#D1FAE5", value: "#FFFFFF" };
      case "seedling":
        return { bg: "#22C55E", brand: "#ECFDF5", label: "#BBF7D0", value: "#FFFFFF" };
      case "cultivator":
        return { bg: "#84CC16", brand: "#F7FEE7", label: "#D9F99D", value: "#1F2937" };
      case "bloom":
        return { bg: "#8B5CF6", brand: "#EEF2FF", label: "#DDD6FE", value: "#FFFFFF" };
      case "harvester":
        return { bg: "#F59E0B", brand: "#FFFBEB", label: "#FDE68A", value: "#1F2937" };
      default:
        return { bg: "#10B981", brand: "#E6FDF4", label: "#D1FAE5", value: "#FFFFFF" };
    }
  };

  useEffect(() => {
    if (isLoggedIn) fetchMyReviews();
    (async () => {
      if (!isLoggedIn) return;
      try {
        const { data } = await getLoyaltyStatus();
        setLoyalty(data?.loyalty || null);
      } catch {
        setLoyalty(null);
      }
    })();
    // Fetch refund tickets
    (async () => {
      if (!isLoggedIn) return;
      try {
        const { data } = await getMyRefundTicketsApi();
        const tickets = Array.isArray(data?.tickets) ? data.tickets : [];
        const map = {};
        tickets.forEach((t) => {
          const oid = String(t?.order?._id || t?.order || t?.orderId || "");
          const status = String(t?.status || "");
          if (["requested", "under_review", "approved"].includes(status) && oid) {
            map[oid] = status;
          }
        });
        setRefundMap(map);
      } catch (e) {
        console.warn("refund tickets fetch failed:", e?.message);
      }
    })();
  }, [isLoggedIn]);

  // pickAvatar removed

  // removeAvatar removed

  const ProfileButton = ({ title, onPress, icon, style = {} }) => (
    <TouchableOpacity 
      style={[s.profileButton, style]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={s.buttonContent}>
        <Ionicons name={icon} size={20} color="#10B981" style={s.buttonIcon} />
        <Text style={s.buttonText}>{title}</Text>
        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );

  const InfoCard = ({ icon, title, subtitle }) => (
    <View style={s.infoCard}>
      <View style={s.infoIcon}>
        <Text style={s.infoIconText}>{icon}</Text>
      </View>
      <View style={s.infoContent}>
        <Text style={s.infoTitle}>{title}</Text>
        <Text style={s.infoSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );

  // Order helper functions
  const getDeliveryStatusColor = (order) => {
    const base = String(order.delivery?.status || order.status || "pending").toLowerCase();
    const status =
      String(order.paymentMethod || "").toLowerCase() === "e-payment" && base === "pending"
        ? "confirmed"
        : base;
    
    switch (status) {
      case 'confirmed':
      case 'completed':
        return "#10B981";
      case 'assigned':
      case 'in-transit':
        return "#3B82F6";
      case 'cancelled':
        return "#EF4444";
      case 'pending':
      default:
        return "#6B7280";
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

  const handleViewOrderDetails = (order) => {
    setSelectedOrder(order);
    setOrderModalVisible(true);
  };

  if (!isLoggedIn) {
    return (
      <View style={s.container}>
        <View style={s.loginPrompt}>
          <View style={s.loginIcon}>
            <Ionicons name="person-circle-outline" size={80} color="#10B981" />
          </View>
          <Text style={s.loginTitle}>Welcome!</Text>
          <Text style={s.loginSubtitle}>Please log in to access your profile</Text>
          
          <TouchableOpacity 
            style={s.primaryButton}
            onPress={() => router.push("/login")}
            activeOpacity={0.9}
          >
            <Text style={s.primaryButtonText}>Login</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={s.secondaryButton}
            onPress={() => router.push("/register")}
            activeOpacity={0.9}
          >
            <Text style={s.secondaryButtonText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={s.profileHeader}>
        <View style={s.avatarContainer}>
          <View style={s.avatar}>
            {user?.avatarUrl ? (
              <Image
                source={{ uri: (toAbsoluteUrl?.(user.avatarUrl) || user.avatarUrl) }}
                style={s.avatarImage}
              />
            ) : (
              <Text style={s.avatarText}>
                {(user?.name || "U").charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
        </View>

        <Text style={s.userName}>{user?.name || "User"}</Text>
        <Text style={s.userEmail}>{user?.email || "-"}</Text>
      </View>

      {/* Quick Actions */}
      <View style={s.section}>
        <ProfileButton
          title="Edit Profile"
          icon="person-outline"
          onPress={() => router.push("/edit-profile")}
        />
        <ProfileButton
          title="Manage Addresses"
          icon="location-outline"
          onPress={() => router.push("/(modal)/addresses")}
        />
        <TouchableOpacity 
          style={s.viewAllOrdersButton}
          onPress={() => router.push("/full-orders")}
          activeOpacity={0.8}
        >
          <View style={s.viewAllOrdersContent}>
            <Ionicons name="receipt-outline" size={20} color="#10B981" />
            <Text style={s.viewAllOrdersText}>Orders</Text>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Loyalty Rewards */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Loyalty Rewards</Text>
        <InfoCard
          icon="🎁"
          title="Rewards Program"
          subtitle="Tiered by monthly spend (see mechanics below)"
        />
        {/* Mechanics box */}
        <View style={s.mechanicsBox}>
          <Text style={s.mechanicsTitle}>Program Mechanics</Text>
          <Text style={s.mechanicsItem}>• Minimum spend is calculated per month.</Text>
          <Text style={s.mechanicsItem}>• Sprout — ₱5,000 monthly spend.</Text>
          <Text style={s.mechanicsItem}>• Seedling — ₱15,000 monthly spend.</Text>
          <Text style={s.mechanicsItem}>• Cultivator — ₱40,000 monthly spend.</Text>
          <Text style={s.mechanicsItem}>• Bloom — ₱75,000 monthly spend.</Text>
          <Text style={s.mechanicsItem}>• Harvester — ₱100,000 and above monthly spend.</Text>
        </View>
        <InfoCard
          icon="⭐"
          title="Current Status"
          subtitle={user?.loyaltyStatus || "Not yet earned"}
        />
        {/* Removed Issue Card button per request */}
        <TouchableOpacity
          style={s.viewCardBtn}
          activeOpacity={0.85}
          onPress={async () => {
            if (!isLoggedIn) return;
            setCardLoading(true);
            setCardVisible(true);
            try {
              const { data } = await getDigitalCard();
              setCard(data?.card || null);
            } catch (e) {
              setCard(null);
            } finally {
              setCardLoading(false);
            }
          }}
        >
          <Ionicons name="card-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={s.viewCardText}>View Digital Card</Text>
        </TouchableOpacity>
      </View>

      {/* My Reviews */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>My Reviews</Text>
          <Text style={s.reviewCount}>({myReviews.length})</Text>
        </View>
        
        {myReviews.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color="#D1D5DB" />
            <Text style={s.emptyStateTitle}>No Reviews Yet</Text>
            <Text style={s.emptyStateText}>
              Start shopping and share your experience with others!
            </Text>
          </View>
        ) : (
          <View style={s.reviewsList}>
            {myReviews.slice(0, 3).map((item, index) => (
              <View key={index} style={s.reviewCard}>
                <View style={s.reviewHeader}>
                  <Text style={s.reviewProduct} numberOfLines={1}>
                    {item.productName}
                  </Text>
                  <Text style={s.reviewDate}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={s.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Text 
                      key={star}
                      style={[
                        s.star,
                        { color: star <= item.rating ? "#FFD700" : "#E5E7EB" }
                      ]}
                    >
                      ★
                    </Text>
                  ))}
                </View>
                <Text style={s.reviewComment} numberOfLines={2}>
                  {item.comment}
                </Text>
              </View>
            ))}
            {myReviews.length > 3 && (
              <TouchableOpacity style={s.viewAllButton}>
                <Text style={s.viewAllText}>View All Reviews</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>



      {/* Digital Card Modal */}
      <Modal
        visible={cardVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCardVisible(false)}
      >
        <View style={s.modalBackdrop}>
          <View style={[s.modalSheet, { maxHeight: Math.min(height * 0.8, 720), alignSelf: 'center' }]}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>My Loyalty Card</Text>
              <TouchableOpacity onPress={() => setCardVisible(false)} style={s.closeBtn}>
                <Ionicons name="close" size={20} color="#111827" />
              </TouchableOpacity>
            </View>

            {cardLoading ? (
              <View style={s.modalBody}>
                <Text style={s.loadingText}>Loading...</Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: Math.min(height * 0.6, 520) }} contentContainerStyle={{ paddingVertical: 8 }}>
                {card ? (
                  (() => {
                    const isActive = Boolean(card?.isActive);
                    const theme = getCardTheme(loyalty?.tier || card.cardType, isActive);
                    return (
                      <View style={s.cardContainer}>
                        <View style={[s.cardVisual, { backgroundColor: theme.bg, width: Math.min(width - 64, 680) }]}>
                          <View style={s.cardTopRow}>
                            <Text style={[s.cardBrand, { color: theme.brand }]}>Go Agri Trading</Text>
                            <View style={[s.tierBadge, { borderColor: theme.value }]}> 
                              <Text style={[s.tierBadgeText, { color: theme.value }]}>{String((loyalty?.tier || "Sprout")).toUpperCase()}</Text>
                            </View>
                          </View>
                          <Text style={[s.cardId, { color: theme.value }]}>{card.cardId || "LOYALTY-CARD"}</Text>
                          <View style={s.cardRow}>
                            <Text style={[s.cardLabel, { color: theme.label }]}>Level</Text>
                            <Text style={[s.cardValue, { color: theme.value }]}>{String((loyalty?.tier || "Sprout")).toUpperCase()}</Text>
                          </View>
                          <View style={s.cardRow}>
                            <Text style={[s.cardLabel, { color: theme.label }]}>Discount</Text>
                            <Text style={[s.cardValue, { color: theme.value }]}>{
                              card?.discountPercentage != null ? `${card.discountPercentage}%` : "-"
                            }</Text>
                          </View>
                          <View style={s.cardRow}>
                            <Text style={[s.cardLabel, { color: theme.label }]}>Issued</Text>
                            {/* Removed Issued row per request */}
                            {/* <Text style={[s.cardValue, { color: theme.value }]}>{formatDateSafe(card?.issuedDate)}</Text> */}
                          </View>
                          <View style={s.cardRow}>
                            <Text style={[s.cardLabel, { color: theme.label }]}>Expiry</Text>
                            {/* Removed Expiry row per request */}
                            {/* <Text style={[s.cardValue, { color: theme.value }]}>{formatDateSafe(card?.expiryDate)}</Text> */}
                          </View>
                          <View style={s.cardRow}>
                            <Text style={[s.cardLabel, { color: theme.label }]}>Status</Text>
                            {/* Removed Status row per request */}
                            {/* <Text style={[s.cardValue, { color: theme.value }]}>{isActive ? "Active" : "Inactive"}</Text> */}
                          </View>
                        </View>
                      </View>
                    );
                  })()
                ) : (
                  (() => {
                    const theme = getCardTheme(loyalty?.tier || "Sprout", false);
                    return (
                      <>
                        <View style={s.cardContainer}>
                          <View style={[s.cardVisual, { backgroundColor: theme.bg, width: Math.min(width - 64, 680) }]}>
                            <View style={s.cardTopRow}>
                              <Text style={[s.cardBrand, { color: theme.brand }]}>Go Agri Trading</Text>
                              <View style={[s.tierBadge, { borderColor: theme.value }]}> 
                                <Text style={[s.tierBadgeText, { color: theme.value }]}>{String((loyalty?.tier || "Sprout")).toUpperCase()}</Text>
                              </View>
                            </View>
                            <Text style={[s.cardId, { color: theme.value }]}>LOYALTY-CARD</Text>
                            <View style={s.cardRow}>
                              <Text style={[s.cardLabel, { color: theme.label }]}>Level</Text>
                              <Text style={[s.cardValue, { color: theme.value }]}>{String((loyalty?.tier || "Sprout")).toUpperCase()}</Text>
                            </View>
                            <View style={s.cardRow}>
                              <Text style={[s.cardLabel, { color: theme.label }]}>Discount</Text>
                              <Text style={[s.cardValue, { color: theme.value }]}>5%</Text>
                            </View>
                            <View style={s.cardRow}>
                              <Text style={[s.cardLabel, { color: theme.label }]}>Issued</Text>
                              {/* Removed Issued row per request */}
                              {/* <Text style={[s.cardValue, { color: theme.value }]}>-</Text> */}
                            </View>
                            <View style={s.cardRow}>
                              <Text style={[s.cardLabel, { color: theme.label }]}>Expiry</Text>
                              {/* Removed Expiry row per request */}
                              {/* <Text style={[s.cardValue, { color: theme.value }]}>-</Text> */}
                            </View>
                            <View style={s.cardRow}>
                              <Text style={[s.cardLabel, { color: theme.label }]}>Status</Text>
                              {/* Removed Status row per request */}
                              {/* <Text style={[s.cardValue, { color: theme.value }]}>Not Activated</Text> */}
                            </View>
                          </View>
                        </View>
                        {/* Manual activation removed; loyalty is auto-activated on login */}
                      </>
                    );
                  })()
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Order Detail Modal */}
      <Modal
        visible={orderModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setOrderModalVisible(false)}
      >
        <View style={s.modalBackdrop}>
          <View style={[s.modalSheet, { maxHeight: Math.min(height * 0.8, 720) }]}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Order Details</Text>
              <TouchableOpacity 
                onPress={() => setOrderModalVisible(false)}
                style={s.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            {selectedOrder && (
              <ScrollView style={s.modalContent} showsVerticalScrollIndicator={false}>
                <View style={s.orderDetailHeader}>
                  <Text style={s.orderDetailId}>
                    Order #{String(selectedOrder._id || "").slice(-8).toUpperCase()}
                  </Text>
                  <View style={[s.orderStatus, { backgroundColor: `${getDeliveryStatusColor(selectedOrder)}15` }]}>
                    <Text style={[s.orderStatusText, { color: getDeliveryStatusColor(selectedOrder) }]}>
                      {getDeliveryStatusText(selectedOrder)}
                    </Text>
                  </View>
                </View>
                
                <View style={s.orderDetailSection}>
                  <Text style={s.orderDetailSectionTitle}>Order Information</Text>
                  <View style={s.orderDetailRow}>
                    <Text style={s.orderDetailLabel}>Date:</Text>
                    <Text style={s.orderDetailValue}>
                      {new Date(selectedOrder.createdAt).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Text>
                  </View>
                  <View style={s.orderDetailRow}>
                    <Text style={s.orderDetailLabel}>Total:</Text>
                    <Text style={s.orderDetailValue}>₱{Number(selectedOrder.total || 0).toFixed(2)}</Text>
                  </View>
                  <View style={s.orderDetailRow}>
                    <Text style={s.orderDetailLabel}>Payment:</Text>
                    <Text style={s.orderDetailValue}>{selectedOrder.paymentMethod || 'N/A'}</Text>
                  </View>
                </View>
                
                {selectedOrder.items && selectedOrder.items.length > 0 && (
                  <View style={s.orderDetailSection}>
                    <Text style={s.orderDetailSectionTitle}>Items ({selectedOrder.items.length})</Text>
                    {selectedOrder.items.map((item, index) => (
                      <View key={index} style={s.orderItemCard}>
                        <View style={s.orderItemInfo}>
                          <Text style={s.orderItemName}>{item.name || 'Unknown Item'}</Text>
                          <Text style={s.orderItemDetails}>
                            Qty: {item.quantity || 1} × ₱{Number(item.price || 0).toFixed(2)}
                          </Text>
                        </View>
                        <Text style={s.orderItemTotal}>
                          ₱{Number((item.quantity || 1) * (item.price || 0)).toFixed(2)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
                
                {selectedOrder.deliveryAddress && (
                  <View style={s.orderDetailSection}>
                    <Text style={s.orderDetailSectionTitle}>Delivery Address</Text>
                    <Text style={s.orderDetailAddress}>
                      {selectedOrder.deliveryAddress}
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Logout Button */}
      <View style={s.section}>
        <TouchableOpacity 
          style={s.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.9}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={s.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={s.bottomSpacer} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  // Login Prompt
  loginPrompt: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  
  loginIcon: {
    marginBottom: 24,
  },
  
  loginTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  
  loginSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },

  // Profile Header
  profileHeader: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  
  avatarContainer: {
    marginBottom: 16,
  },
  
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#10B981",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  
  avatarText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarActions: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#10B981",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FEE2E2",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  removeBtnText: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "700",
  },
  
  userName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  
  userEmail: {
    fontSize: 16,
    color: "#6B7280",
  },

  // Sections
  section: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  
  reviewCount: {
    fontSize: 16,
    color: "#6B7280",
    marginLeft: 8,
  },

  // Profile Buttons
  profileButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  
  buttonIcon: {
    marginRight: 12,
  },
  
  buttonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },

  // Info Cards
  infoCard: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  
  infoIconText: {
    fontSize: 20,
  },
  
  infoContent: {
    flex: 1,
  },
  
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  
  infoSubtitle: {
    fontSize: 14,
    color: "#6B7280",
  },

  // Mechanics
  mechanicsBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  mechanicsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  mechanicsItem: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },

  // View Card button
  viewCardBtn: {
    marginTop: 8,
    backgroundColor: "#10B981",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  viewCardText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  // Reviews
  emptyState: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginTop: 16,
    marginBottom: 8,
  },
  
  emptyStateText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  
  reviewsList: {
    gap: 12,
  },
  
  reviewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  
  reviewProduct: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
    marginRight: 8,
  },
  
  reviewDate: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  
  starsContainer: {
    flexDirection: "row",
    marginBottom: 8,
  },
  
  star: {
    fontSize: 16,
    marginRight: 2,
  },
  
  reviewComment: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
  },
  
  viewAllButton: {
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  
  viewAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10B981",
  },

  // Issue Card button
  issueCardBtn: {
    marginTop: 8,
    backgroundColor: "#10B981",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  issueCardText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    minHeight: 260,
    width: "95%",
    maxWidth: 720,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
  modalBody: {
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    paddingVertical: 32,
  },
  emptyCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginTop: 16,
  },
  emptyCardText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 6,
  },
  cardVisual: {
    backgroundColor: "#10B981",
    borderRadius: 16,
    padding: 16,
    minHeight: 160,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  cardContainer: {
    alignItems: "center",
  },
  cardBrand: {
    color: "#E6FDF4",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  cardId: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 6,
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  cardLabel: {
    color: "#D1FAE5",
    fontSize: 14,
    fontWeight: "600",
  },
  cardValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tierBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  tierBadgeText: {
    fontSize: 12,
    fontWeight: "800",
  },

  // Buttons
  primaryButton: {
    backgroundColor: "#10B981",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: "100%",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#10B981",
  },
  
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#10B981",
  },
  
  logoutButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FEE2E2",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  
  logoutButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
    marginLeft: 8,
  },

  bottomSpacer: {
    height: 32,
  },

  // Order styles
  ordersList: {
    gap: 12,
  },

  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  orderIdContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  orderIdText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },

  refundBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },

  refundBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#D97706",
  },

  orderStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },

  orderStatusText: {
    fontSize: 12,
    fontWeight: "600",
  },

  orderDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  orderDate: {
    fontSize: 14,
    color: "#6B7280",
  },

  orderItems: {
    fontSize: 14,
    color: "#6B7280",
  },

  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  orderTotal: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },

  // Order detail modal styles
  orderDetailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },

  orderDetailId: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },

  orderDetailSection: {
    marginBottom: 24,
  },

  orderDetailSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },

  orderDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  orderDetailLabel: {
    fontSize: 14,
    color: "#6B7280",
  },

  orderDetailValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1F2937",
  },

  orderItemCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },

  orderItemInfo: {
    flex: 1,
  },

  orderItemName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1F2937",
    marginBottom: 4,
  },

  orderItemDetails: {
    fontSize: 12,
    color: "#6B7280",
  },

  viewAllOrdersButton: {
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#D1FAE5",
  },

  viewAllOrdersContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    justifyContent: "space-between",
  },

  viewAllOrdersText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#10B981",
    flex: 1,
    marginLeft: 12,
  },

  orderItemTotal: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },

  orderDetailAddress: {
    fontSize: 14,
    color: "#1F2937",
    lineHeight: 20,
  },
});