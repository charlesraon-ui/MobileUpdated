import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useContext, useEffect } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { AppCtx } from "../context/AppContext";

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { user, isLoggedIn, handleLogout, myReviews, fetchMyReviews } = useContext(AppCtx);

  useEffect(() => {
    if (isLoggedIn) fetchMyReviews();
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
          subtitle="Earn card after 5 purchases or ₱5000 spend"
        />
        <InfoCard
          icon="⭐"
          title="Current Status"
          subtitle={user?.loyaltyStatus || "Not yet earned"}
        />
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