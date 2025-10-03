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
  View
} from "react-native";
import { AppCtx } from "../context/AppContext";
import { getDigitalCard, getLoyaltyStatus, issueLoyaltyCard } from "../api/apiClient";

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { user, isLoggedIn, handleLogout, myReviews, fetchMyReviews } = useContext(AppCtx);
  const [cardVisible, setCardVisible] = useState(false);
  const [cardLoading, setCardLoading] = useState(false);
  const [card, setCard] = useState(null);
  const [loyalty, setLoyalty] = useState(null);
  const [issueLoading, setIssueLoading] = useState(false);

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
  }, [isLoggedIn]);

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
            <Text style={s.avatarText}>
              {(user?.name || "U").charAt(0).toUpperCase()}
            </Text>
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
        <ProfileButton
          title="Order History"
          icon="receipt-outline"
          onPress={() => router.push("/tabs/orders")}
        />
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
        {isLoggedIn && loyalty?.isEligible && !loyalty?.cardIssued && (
          <TouchableOpacity
            style={s.issueCardBtn}
            activeOpacity={0.9}
            onPress={async () => {
              try {
                setIssueLoading(true);
                const { data } = await issueLoyaltyCard();
                // After issuing, fetch card and show modal
                setLoyalty({ ...(loyalty || {}), cardIssued: true });
                setCardLoading(true);
                setCardVisible(true);
                const cardResp = await getDigitalCard();
                setCard(cardResp?.data?.card || null);
              } catch (e) {
                // noop
              } finally {
                setCardLoading(false);
                setIssueLoading(false);
              }
            }}
          >
            <Ionicons name="gift-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={s.issueCardText}>{issueLoading ? "Issuing..." : "Issue Card"}</Text>
          </TouchableOpacity>
        )}
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
          <View style={s.modalSheet}>
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
              <View style={s.modalBody}>
                {card ? (
                  (() => {
                    const theme = getCardTheme(loyalty?.tier || card.cardType, card.isActive);
                    return (
                      <View style={s.cardContainer}>
                        <View style={[s.cardVisual, { backgroundColor: theme.bg, width: Math.min(width - 64, 680) }]}>
                          <View style={s.cardTopRow}>
                            <Text style={[s.cardBrand, { color: theme.brand }]}>Go Agri Trading</Text>
                            <View style={[s.tierBadge, { borderColor: theme.value }]}> 
                              <Text style={[s.tierBadgeText, { color: theme.value }]}>{String((loyalty?.tier || "Sprout")).toUpperCase()}</Text>
                            </View>
                          </View>
                          <Text style={[s.cardId, { color: theme.value }]}>{card.cardId}</Text>
                          <View style={s.cardRow}>
                            <Text style={[s.cardLabel, { color: theme.label }]}>Level</Text>
                            <Text style={[s.cardValue, { color: theme.value }]}>{String((loyalty?.tier || "Sprout")).toUpperCase()}</Text>
                          </View>
                          <View style={s.cardRow}>
                            <Text style={[s.cardLabel, { color: theme.label }]}>Discount</Text>
                            <Text style={[s.cardValue, { color: theme.value }]}>{card.discountPercentage}%</Text>
                          </View>
                          <View style={s.cardRow}>
                            <Text style={[s.cardLabel, { color: theme.label }]}>Issued</Text>
                            <Text style={[s.cardValue, { color: theme.value }]}>{card.issuedDate ? new Date(card.issuedDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' }) : "-"}</Text>
                          </View>
                          <View style={s.cardRow}>
                            <Text style={[s.cardLabel, { color: theme.label }]}>Expiry</Text>
                            <Text style={[s.cardValue, { color: theme.value }]}>{card.expiryDate ? new Date(card.expiryDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' }) : "-"}</Text>
                          </View>
                          <View style={s.cardRow}>
                            <Text style={[s.cardLabel, { color: theme.label }]}>Status</Text>
                            <Text style={[s.cardValue, { color: theme.value }]}>{card.isActive ? "Active" : "Inactive"}</Text>
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
                              <Text style={[s.cardValue, { color: theme.value }]}>-</Text>
                            </View>
                            <View style={s.cardRow}>
                              <Text style={[s.cardLabel, { color: theme.label }]}>Expiry</Text>
                              <Text style={[s.cardValue, { color: theme.value }]}>-</Text>
                            </View>
                            <View style={s.cardRow}>
                              <Text style={[s.cardLabel, { color: theme.label }]}>Status</Text>
                              <Text style={[s.cardValue, { color: theme.value }]}>Not Activated</Text>
                            </View>
                          </View>
                        </View>
                        {isLoggedIn && loyalty?.isEligible && !loyalty?.cardIssued && (
                          <TouchableOpacity
                            style={[s.viewCardBtn, { marginTop: 12 }]}
                            activeOpacity={0.9}
                            onPress={async () => {
                              try {
                                setIssueLoading(true);
                                await issueLoyaltyCard();
                                setLoyalty({ ...(loyalty || {}), cardIssued: true });
                                const { data } = await getDigitalCard();
                                setCard(data?.card || null);
                              } catch (e) {
                                // noop
                              } finally {
                                setIssueLoading(false);
                              }
                            }}
                          >
                            <Ionicons name="flash-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                            <Text style={s.viewCardText}>{issueLoading ? "Activating..." : "Activate Now"}</Text>
                          </TouchableOpacity>
                        )}
                      </>
                    );
                  })()
                )}
              </View>
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
});