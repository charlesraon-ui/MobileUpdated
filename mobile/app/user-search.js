// app/user-search.js
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { 
  ActivityIndicator, 
  FlatList, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View 
} from "react-native";
import { searchUsersApi } from "../src/api/apiClient";
import Avatar from "../src/components/Avatar";
import { AppCtx } from "../src/context/AppContext";
import { safeGoBackToHome } from "../src/utils/navigationUtils";

const GREEN = "#10B981";
const BORDER = "#E5E7EB";
const GRAY = "#6B7280";

export default function UserSearchScreen() {
  const { isLoggedIn } = useContext(AppCtx);
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const debouncedQuery = useMemo(() => query.trim(), [query]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/login");
    }
  }, [isLoggedIn]);

  useEffect(() => {
    let active = true;
    const timeout = setTimeout(async () => {
      if (!active) return;
      
      try {
        setLoading(true);
        setError("");
        
        // If no query, search for a common term to show some users initially
        // This helps users see that there are users available to chat with
        const searchQuery = debouncedQuery.length > 0 ? debouncedQuery : "";
        
        const response = await searchUsersApi(searchQuery || "");
        if (active) {
          const users = response.data?.users || response.data || [];
          setUsers(Array.isArray(users) ? users : []);
        }
      } catch (e) {
        if (active) {
          const status = e?.response?.status;
          let errorMessage = e?.response?.data?.message || e?.message || "Failed to search users";
          
          // Handle authentication errors specifically
          if (status === 401) {
            errorMessage = "Please log in to search for users";
          } else if (status === 403) {
            errorMessage = "You don't have permission to search for users";
          } else if (!navigator.onLine) {
            errorMessage = "No internet connection. Please check your network.";
          }
          
          setError(errorMessage);
          setUsers([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    }, debouncedQuery.length > 0 ? 350 : 100); // Faster initial load

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [debouncedQuery]);

  const startChat = (userId) => {
    router.push({ pathname: "/chat", params: { userId } });
  };

  const renderUser = ({ item }) => (
    <TouchableOpacity 
      style={styles.userItem} 
      onPress={() => startChat(item._id)}
      activeOpacity={0.8}
    >
      <Avatar 
        avatarUrl={item.avatarUrl} 
        name={item.name} 
        email={item.email}
        size={40}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName} numberOfLines={1}>
          {item.name || item.email}
        </Text>
        <Text style={styles.userEmail} numberOfLines={1}>
          {item.email}
        </Text>
      </View>
      <Ionicons name="chatbubble-outline" size={20} color={GREEN} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => safeGoBackToHome()}
        >
          <Ionicons name="arrow-back" size={24} color={GREEN} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Users</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={GRAY} style={styles.searchIcon} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search by name or email..."
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => setQuery("")}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color={GRAY} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={GREEN} size="large" />
            <Text style={styles.loadingText}>Searching users...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            {error.includes("log in") ? (
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => router.push("/login")}
              >
                <Text style={styles.retryButtonText}>Go to Login</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => setQuery(query + " ")} // Trigger search again
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : query.length === 0 ? (
          users.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color={GRAY} />
              <Text style={styles.emptyTitle}>No Users Available</Text>
              <Text style={styles.emptySubtitle}>
                There are no other users to chat with at the moment. Try again later or invite friends to join!
              </Text>
            </View>
          ) : (
            <View style={styles.content}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Users</Text>
                <Text style={styles.sectionSubtitle}>Start a conversation with someone</Text>
              </View>
              <FlatList
                data={users}
                keyExtractor={(item) => item._id}
                renderItem={renderUser}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )
        ) : users.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={64} color={GRAY} />
            <Text style={styles.emptyTitle}>No users found</Text>
            <Text style={styles.emptySubtitle}>
              Try searching with a different name or email
            </Text>
          </View>
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => item._id}
            renderItem={renderUser}
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
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111827",
  },
  clearButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: GRAY,
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
    textAlign: "center",
    fontWeight: "500",
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
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: GRAY,
    textAlign: "center",
    lineHeight: 24,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: GRAY,
  },
  separator: {
    height: 12,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#F8FAFC",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: GRAY,
  },
});