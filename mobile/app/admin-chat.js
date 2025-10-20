// app/admin-chat.js
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { 
  ActivityIndicator, 
  FlatList, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View 
} from "react-native";
import { getAdminUsersApi } from "../src/api/apiClient";
import Avatar from "../src/components/Avatar";

const GREEN = "#10B981";
const BORDER = "#E5E7EB";
const GRAY = "#6B7280";

export default function AdminChatScreen() {
  const [adminUsers, setAdminUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAdminUsers();
  }, []);

  const loadAdminUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await getAdminUsersApi();
      const users = response.data?.data?.users || response.data?.users || [];
      setAdminUsers(Array.isArray(users) ? users : []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load support team");
      setAdminUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const startChat = (userId) => {
    router.push({ pathname: "/chat", params: { userId } });
  };

  const renderAdmin = ({ item }) => (
    <TouchableOpacity 
      style={styles.adminItem} 
      onPress={() => startChat(item._id)}
      activeOpacity={0.8}
    >
      <Avatar 
        avatarUrl={item.avatarUrl} 
        name={item.name} 
        email={item.email}
        size={50}
      />
      <View style={styles.adminInfo}>
        <Text style={styles.adminName} numberOfLines={1}>
          {item.name || item.email}
        </Text>
        <Text style={styles.adminRole} numberOfLines={1}>
          {item.role === 'superadmin' ? 'Senior Support' : 'Customer Support'}
        </Text>
        <Text style={styles.adminEmail} numberOfLines={1}>
          {item.email}
        </Text>
      </View>
      <View style={styles.chatButton}>
        <Ionicons name="chatbubble" size={24} color={GREEN} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={GREEN} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customer Support</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.infoSection}>
          <Ionicons name="headset" size={32} color={GREEN} style={styles.infoIcon} />
          <Text style={styles.infoTitle}>Chat with Support Team</Text>
          <Text style={styles.infoSubtitle}>
            Select a support representative to start a conversation
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={GREEN} />
            <Text style={styles.loadingText}>Loading support team...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text style={styles.errorTitle}>Unable to load support team</Text>
            <Text style={styles.errorSubtitle}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadAdminUsers}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : adminUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={GRAY} />
            <Text style={styles.emptyTitle}>No support team available</Text>
            <Text style={styles.emptySubtitle}>
              Please try again later or contact us via phone or email
            </Text>
          </View>
        ) : (
          <FlatList
            data={adminUsers}
            keyExtractor={(item) => item._id}
            renderItem={renderAdmin}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  infoSection: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  infoIcon: {
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  infoSubtitle: {
    fontSize: 14,
    color: GRAY,
    textAlign: "center",
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: GRAY,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  errorSubtitle: {
    fontSize: 14,
    color: GRAY,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: GREEN,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: GRAY,
    textAlign: "center",
    lineHeight: 20,
  },
  listContainer: {
    paddingVertical: 8,
  },
  adminItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
  },
  adminInfo: {
    flex: 1,
    marginLeft: 12,
  },
  adminName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  adminRole: {
    fontSize: 14,
    fontWeight: "500",
    color: GREEN,
    marginBottom: 2,
  },
  adminEmail: {
    fontSize: 13,
    color: GRAY,
  },
  chatButton: {
    padding: 8,
  },
  separator: {
    height: 1,
    backgroundColor: BORDER,
    marginLeft: 78,
  },
});