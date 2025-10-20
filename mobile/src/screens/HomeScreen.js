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
import SearchBar from "../components/SearchBar";
import { Colors, Radii } from "../../constants/theme";

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const {
    recommendedProducts,
    categories, // Get categories from context
    products,
    bundles,
    user,
    justLoggedInName,
    setJustLoggedInName,
    justRegistered,
    setJustRegistered,
    toAbsoluteUrl,
    toggleWishlist,
    isInWishlist,
    setSelectedCategory,
  } = useContext(AppCtx);

  // Debug logging
  console.log("HomeScreen DEBUG: products:", products);
  console.log("HomeScreen DEBUG: products length:", products?.length);
  console.log("HomeScreen DEBUG: recommendedProducts:", recommendedProducts);
  console.log("HomeScreen DEBUG: recommendedProducts length:", recommendedProducts?.length);

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
    
    const rawImg = product?.imageUrl || product?.images?.[0] || null;
    const img = rawImg ? (toAbsoluteUrl?.(rawImg) || rawImg) : null;
    const saved = isInWishlist?.(product?._id);

    return (
      <TouchableOpacity 
        style={styles.productCard} 
        activeOpacity={0.8}
        onPress={() => router.push(`/product-detail?id=${product._id}`)}
      >
        <View style={styles.productImageContainer}>
          {img ? (
            <Image source={{ uri: img }} style={styles.productImage} resizeMode="cover" />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Text style={styles.productImageText}>📦</Text>
            </View>
          )}
          
          {/* Heart toggle (top-right) */}
          <TouchableOpacity
            onPress={async (e) => {
              e.stopPropagation?.();
              const action = await toggleWishlist?.(product?._id);
              if (action === "added") Alert.alert("Added to wishlist");
              else if (action === "removed") Alert.alert("Removed from wishlist");
            }}
            activeOpacity={0.7}
            style={[styles.wishlistHeart, saved && styles.wishlistHeartActive]}
          >
            <Text style={[styles.wishlistHeartIcon, saved && styles.wishlistHeartIconActive]}>
              {saved ? "♥" : "♡"}
            </Text>
          </TouchableOpacity>

          {/* Price badge (bottom-left) */}
          <View style={styles.priceTag}>
            <Text style={styles.priceTagText}>₱{Number(product?.price || 0).toFixed(2)}</Text>
          </View>

          {/* Rating badge (bottom-right) */}
          <View style={styles.ratingChip}>
            <Text style={styles.ratingChipText}>⭐ {product?.averageRating || '4.5'}</Text>
          </View>
        </View>
        
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {product.name}
          </Text>
          <View style={styles.productMeta}>
            <Text style={styles.productCategory} numberOfLines={1}>
              {product.category || 'General'}
            </Text>
            {product.stock && (
              <Text style={[styles.stockIndicator, product.stock < 10 && styles.lowStock]}>
                {product.stock < 10 ? 'Low Stock' : 'In Stock'}
              </Text>
            )}
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
      style={styles.categoryChip}
      onPress={() => {
        setSelectedCategory?.(category);
        router.push('/tabs/products');
      }}
      activeOpacity={0.8}
    >
      <View style={[styles.categoryChipIconWrap, { backgroundColor: getCategoryColor(index) }]}>
        <Text style={styles.categoryChipIcon}>{getCategoryIcon(category)}</Text>
      </View>
      <Text style={styles.categoryChipLabel} numberOfLines={1}>{category}</Text>
    </TouchableOpacity>
  );

  const OfferCard = ({ data }) => {
    const isBundle = data?.type === 'bundle';
    const item = data?.item || {};
    const name = isBundle ? (item?.name || 'Bundle') : (item?.name || 'Product');
    const price = isBundle
      ? Number(item?.totalPrice || item?.items?.reduce((s, it) => s + Number(it?.productId?.price || 0) * Number(it?.quantity || 1), 0) || 0)
      : Number(item?.price || 0);
    const img = isBundle
      ? (item?.imageUrl || item?.coverImage || '')
      : (item?.imageUrl || item?.images?.[0] || '');
    const uri = img ? (toAbsoluteUrl?.(img) || img) : null;

    return (
      <TouchableOpacity
        style={styles.offerCard}
        activeOpacity={0.85}
        onPress={() => {
          if (isBundle) {
            router.push(`/bundle-detail?id=${item?._id || ''}`);
          } else {
            router.push(`/product-detail?id=${item?._id || ''}`);
          }
        }}
      >
        <View style={styles.offerImageWrap}>
          {uri ? (
            <Image source={{ uri }} style={styles.offerImage} resizeMode="cover" />
          ) : (
            <View style={styles.offerImagePlaceholder}><Text style={{ fontSize: 28 }}>🛍️</Text></View>
          )}
          {isBundle && (
            <View style={styles.bundleTag}><Text style={styles.bundleTagText}>Bundle</Text></View>
          )}
        </View>
        <View style={styles.offerInfo}>
          <Text numberOfLines={1} style={styles.offerName}>{name}</Text>
          <Text style={styles.offerPrice}>₱{price.toFixed(2)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Build Best Offers: mix top bundles and cheapest products
  const bestOffers = (() => {
    const bundleCards = (bundles || [])
      .slice(0, 4)
      .map((b) => ({ type: 'bundle', item: b }));
    const cheapest = [...(products || [])]
      .sort((a, b) => Number(a?.price || 0) - Number(b?.price || 0))
      .slice(0, 6)
      .map((p) => ({ type: 'product', item: p }));
    return [...bundleCards, ...cheapest].slice(0, 8);
  })();

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
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.pageWrap}>
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
        <View style={styles.searchContainer}>
          <SearchBar />
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
            <View style={styles.categoriesChipsRow}>
              {categories.slice(0, 8).map((category, index) => (
                <CategoryCard key={category} category={category} index={index} />
              ))}
            </View>
          </View>
        )}

        {/* Best Offers */}
        {bestOffers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Best Offers</Text>
              <TouchableOpacity onPress={() => router.push('/tabs/products')}>
                <Text style={styles.seeAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.productsScroll}
              contentContainerStyle={styles.productsScrollContent}
            >
              {bestOffers.map((o, idx) => (
                <OfferCard key={(o.item?._id || idx) + '-' + o.type} data={o} />
              ))}
            </ScrollView>
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
              onPress={() => router.push("/tabs/profile")}
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
    backgroundColor: Colors.light.surface,
  },
  // Center content and limit max width on wide screens
  pageWrap: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 1200,
  },
  
  // Header
  header: {
    backgroundColor: Colors.light.accent,
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
    backgroundColor: Colors.light.card,
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
    backgroundColor: Colors.light.surface,
    borderRadius: Radii.lg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  
  searchPlaceholder: {
    fontSize: 16,
    color: Colors.light.muted,
    flex: 1,
    fontWeight: "500",
  },
  
  searchButton: {
    backgroundColor: Colors.light.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radii.md,
  },
  
  searchButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  // Sections
  section: {
    backgroundColor: Colors.light.card,
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
    color: Colors.light.text,
    letterSpacing: -0.3,
  },
  
  seeAllText: {
    fontSize: 16,
    color: Colors.light.accent,
    fontWeight: "600",
  },

  // Categories
  categoriesChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  categoryChip: {
    width: (width - 80) / 4, // 4 per row on phones
    minWidth: 80,
    backgroundColor: Colors.light.surface,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  categoryChipIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  categoryChipIcon: {
    fontSize: 18,
  },

  categoryChipLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.text,
    textAlign: 'center',
    textTransform: 'capitalize',
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
    width: 170,
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  
  productImageContainer: {
    height: 130,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
    position: "relative",
  },

  // Overlays on product image
  wishlistHeart: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  wishlistHeartActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  wishlistHeartIcon: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '700',
  },
  wishlistHeartIconActive: {
    color: '#DC2626',
  },

  priceTag: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(16,185,129,0.92)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  priceTagText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  ratingChip: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(254,243,199,0.92)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ratingChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  
  productImage: {
    width: "100%",
    height: "100%",
  },
  
  productImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.light.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  
  productImageText: {
    fontSize: 32,
  },
  
  productInfo: {
    padding: 14,
    paddingTop: 12,
  },
  
  productName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 8,
    lineHeight: 20,
  },
  
  productMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  
  productCategory: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.light.muted,
    textTransform: "capitalize",
    flex: 1,
  },
  
  stockIndicator: {
    fontSize: 11,
    fontWeight: "600",
    color: "#10B981",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    textAlign: "center",
  },
  
  lowStock: {
    color: "#DC2626",
    backgroundColor: "#FEF2F2",
  },
  
  productFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  
  productPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.accent,
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
    backgroundColor: Colors.light.surface,
    borderRadius: Radii.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
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

  // Best Offers cards
  offerCard: {
    width: 220,
    backgroundColor: Colors.light.card,
    borderRadius: Radii.lg,
    marginRight: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  offerImageWrap: {
    height: 120,
    position: 'relative',
  },
  offerImage: {
    width: '100%',
    height: '100%',
  },
  offerImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.surface,
  },
  bundleTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bundleTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  offerInfo: {
    padding: 12,
  },
  offerName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 6,
  },
  offerPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.light.accent,
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