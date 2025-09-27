import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useContext, useEffect, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AppCtx } from "../context/AppContext";

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const {
    recommendedProducts,
    categories, // Get categories from context
    user,
    justLoggedInName,
    setJustLoggedInName,
    justRegistered,
    setJustRegistered,
    toAbsoluteUrl,
  } = useContext(AppCtx);

  // show banner once after login/register
  const [showWelcome, setShowWelcome] = useState(false);
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    if (justLoggedInName) {
      setShowWelcome(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
      
      const t = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setShowWelcome(false);
          setJustLoggedInName(null);
          setJustRegistered(false);
        });
      }, 4000);
      return () => clearTimeout(t);
    }
  }, [justLoggedInName]);

  const logout = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove(["pos-token", "pos-user"]);
          Alert.alert("Success", "Signed out successfully");
          router.replace("/login");
        },
      },
    ]);
  };

  const ProductCard = ({ product }) => {
    const img = product.imageUrl
      ? toAbsoluteUrl?.(product.imageUrl) || product.imageUrl
      : null;

    return (
      <TouchableOpacity 
        style={styles.productCard} 
        activeOpacity={0.8}
        onPress={() => router.push(`/tabs/${product._id}`)}
      >
        <View style={styles.productImageContainer}>
          {img ? (
            <Image source={{ uri: img }} style={styles.productImage} resizeMode="cover" />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Text style={styles.productImageText}>📦</Text>
            </View>
          )}
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {product.name}
          </Text>
          <View style={styles.productFooter}>
            <Text style={styles.productPrice}>₱{Number(product.price || 0).toFixed(2)}</Text>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>⭐ {product.averageRating || '4.5'}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Category icons mapping
  const getCategoryIcon = (category) => {
    const icons = {
      'All': '🛍️',
      'Seeds': '🌱',
      'new code': '💻',
      'neee': '✨',
      'Electronics': '📱',
      'Fashion': '👕',
      'Home': '🏡',
      'Sports': '⚽',
      'Books': '📚',
      'Health': '💊',
      'Food': '🍕',
    };
    return icons[category] || '📂';
  };

  const getCategoryColor = (index) => {
    const colors = [
      '#10B981', '#3B82F6', '#F59E0B', '#EF4444', 
      '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'
    ];
    return colors[index % colors.length];
  };

  const CategoryCard = ({ category, index }) => (
    <TouchableOpacity
      style={[styles.categoryCard, { backgroundColor: getCategoryColor(index) }]}
      onPress={() => {
        router.push('/tabs/products');
        // You might want to set the selected category in context here
      }}
      activeOpacity={0.8}
    >
      <View style={styles.categoryContent}>
        <Text style={styles.categoryIcon}>{getCategoryIcon(category)}</Text>
        <Text style={styles.categoryTitle} numberOfLines={1}>{category}</Text>
      </View>
    </TouchableOpacity>
  );

  const FeatureCard = ({ title, subtitle, onPress, icon }) => (
    <TouchableOpacity style={styles.featureCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.featureContent}>
        <View style={styles.featureIconContainer}>
          <Text style={styles.featureIcon}>{icon}</Text>
        </View>
        <View style={styles.featureText}>
          <Text style={styles.featureTitle}>{title}</Text>
          <Text style={styles.featureSubtitle}>{subtitle}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );

  // friendly greeting text (header)
  const getGreeting = () => {
    const hour = new Date().getHours();
    let timeGreeting = "Hello";
    if (hour < 12) timeGreeting = "Good morning";
    else if (hour < 17) timeGreeting = "Good afternoon";
    else timeGreeting = "Good evening";
    
    return user ? `${timeGreeting}, ${user.name?.split(' ')[0] || 'there'}!` : `${timeGreeting}!`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#10B981" />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.headerSubtitle}>What would you like to explore today?</Text>
            </View>
            <TouchableOpacity 
              style={styles.profileButton} 
              onPress={() => router.push("/tabs/profile")}
              activeOpacity={0.8}
            >
              <View style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>
                  {user?.name?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* One-time Welcome banner (login/register) */}
          {showWelcome && (
            <Animated.View style={[styles.bannerWelcome, { opacity: fadeAnim }]}>
              <View style={styles.bannerContent}>
                <Text style={styles.bannerIcon}>
                  {justRegistered ? '🎉' : '👋'}
                </Text>
                <Text style={styles.bannerWelcomeTxt}>
                  {justRegistered
                    ? `Welcome to our store, ${justLoggedInName}!`
                    : `Welcome back, ${justLoggedInName}!`}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                  }).start(() => {
                    setShowWelcome(false);
                    setJustLoggedInName(null);
                    setJustRegistered(false);
                  });
                }}
                style={styles.bannerCloseButton}
              >
                <Text style={styles.bannerWelcomeClose}>✕</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <TouchableOpacity 
            style={styles.searchBar} 
            onPress={() => router.push("/tabs/products")}
            activeOpacity={0.7}
          >
            <Text style={styles.searchIcon}>🔍</Text>
            <Text style={styles.searchPlaceholder}>Search for products...</Text>
            <View style={styles.searchButton}>
              <Text style={styles.searchButtonText}>Search</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Categories - Dynamic from context */}
        {categories && categories.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Shop by Category</Text>
              <TouchableOpacity onPress={() => router.push("/tabs/products")}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.categoriesContainer}>
              {categories.slice(0, 6).map((category, index) => (
                <CategoryCard key={category} category={category} index={index} />
              ))}
            </View>
          </View>
        )}

        {/* Recommended Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recommended for You</Text>
            {recommendedProducts.length > 0 && (
              <TouchableOpacity onPress={() => router.push("/tabs/products")}>
                <Text style={styles.seeAllText}>View All</Text>
              </TouchableOpacity>
            )}
          </View>

          {recommendedProducts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🛍️</Text>
              <Text style={styles.emptyStateTitle}>Discover Amazing Products</Text>
              <Text style={styles.emptyStateSubtitle}>
                Browse our catalog to get personalized recommendations
              </Text>
              <TouchableOpacity
                style={styles.browseButton}
                onPress={() => router.push("/tabs/products")}
                activeOpacity={0.8}
              >
                <Text style={styles.browseButtonText}>Start Shopping</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.productsScroll}
              contentContainerStyle={styles.productsScrollContent}
            >
              {recommendedProducts.slice(0, 10).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </ScrollView>
          )}
        </View>

        {/* Quick Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.featuresContainer}>
            <FeatureCard
              title="My Orders"
              subtitle="Track your purchases"
              icon="📦"
              onPress={() => router.push("/tabs/orders")}
            />
            <FeatureCard
              title="My Profile"
              subtitle="Manage your account"
              icon="👤"
              onPress={() => router.push("/tabs/profile")}
            />
            <FeatureCard
              title="Customer Support"
              subtitle="Get help anytime"
              icon="💬"
              onPress={() => router.push("/support")}
            />
          </View>
        </View>

        {/* Special Offers Banner */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.offerBanner}
            onPress={() => router.push("/tabs/products")}
            activeOpacity={0.8}
          >
            <View style={styles.offerContent}>
              <View style={styles.offerText}>
                <Text style={styles.offerTitle}>🎉 Special Deals</Text>
                <Text style={styles.offerSubtitle}>Discover great products at amazing prices</Text>
              </View>
              <View style={styles.offerButton}>
                <Text style={styles.offerButtonText}>Shop Now</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  
  // Header
  header: {
    backgroundColor: "#10B981",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  
  greetingContainer: {
    flex: 1,
  },
  
  greeting: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },
  
  profileButton: {
    marginLeft: 16,
  },
  
  profileAvatar: {
    width: 44,
    height: 44,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  
  profileAvatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // Welcome banner
  bannerWelcome: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backdropFilter: "blur(10px)",
  },
  
  bannerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  
  bannerIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  
  bannerWelcomeTxt: { 
    color: "#FFFFFF", 
    fontWeight: "600",
    fontSize: 16,
    flex: 1,
  },
  
  bannerCloseButton: {
    padding: 4,
  },
  
  bannerWelcomeClose: { 
    color: "#FFFFFF", 
    fontWeight: "700",
    fontSize: 18,
  },

  // Search
  searchSection: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  
  searchPlaceholder: {
    fontSize: 16,
    color: "#9CA3AF",
    flex: 1,
    fontWeight: "500",
  },
  
  searchButton: {
    backgroundColor: "#10B981",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  
  searchButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  // Sections
  section: {
    backgroundColor: "#FFFFFF",
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.3,
  },
  
  seeAllText: {
    fontSize: 16,
    color: "#10B981",
    fontWeight: "600",
  },

  // Categories
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  
  categoryCard: {
    width: (width - 64) / 3, // 3 columns with gaps
    aspectRatio: 1.2,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  
  categoryContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  
  categoryIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  
  categoryTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    textTransform: "capitalize",
  },

  // Products
  productsScroll: {
    marginHorizontal: -20,
  },
  
  productsScrollContent: {
    paddingHorizontal: 20,
    paddingRight: 40,
  },
  
  productCard: {
    width: 160,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  
  productImageContainer: {
    height: 120,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
  },
  
  productImage: {
    width: "100%",
    height: "100%",
  },
  
  productImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  
  productImageText: {
    fontSize: 32,
  },
  
  productInfo: {
    padding: 16,
  },
  
  productName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
    lineHeight: 20,
  },
  
  productFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  
  productPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: "#10B981",
  },
  
  ratingBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  
  ratingText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#D97706",
  },

  // Features
  featuresContainer: {
    marginTop: 4,
    gap: 12,
  },
  
  featureCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  
  featureContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  
  featureIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  
  featureIcon: {
    fontSize: 20,
  },
  
  featureText: {
    flex: 1,
  },
  
  featureTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  
  featureSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  
  chevron: {
    fontSize: 24,
    color: "#9CA3AF",
    fontWeight: "300",
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  
  emptyStateIcon: {
    fontSize: 56,
    marginBottom: 20,
  },
  
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  
  emptyStateSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  
  browseButton: {
    backgroundColor: "#10B981",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  
  browseButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  // Offer Banner
  offerBanner: {
    backgroundColor: "#10B981",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  
  offerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  
  offerText: {
    flex: 1,
  },
  
  offerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  
  offerSubtitle: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },
  
  offerButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  offerButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#10B981",
  },

  bottomSpacer: {
    height: 100,
  },
});