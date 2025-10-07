// src/screens/ProductsScreen.js
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import BundleCard from "../components/BundleCard";
import ProductCard from "../components/ProductCard";
import { AppCtx } from "../context/AppContext";

const { width } = Dimensions.get('window');

export default function ProductsScreen() {
  const {
    products,
    bundles,
    categories,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    loading,
    user,
    handleAddToCart: contextAddToCart
  } = useContext(AppCtx);
  
  // Check if user is logged in
  const isLoggedIn = !!user?._id || !!user?.id || !!user?.email;

  const [refreshing, setRefreshing] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const { viewMode, setViewMode } = useContext(AppCtx);
  
  // Cart confirmation modal
  const [showCartConfirmation, setShowCartConfirmation] = useState(false);
  const [addedProduct, setAddedProduct] = useState(null);
  
  // Filter states
  const [sortBy, setSortBy] = useState("popularity");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [tempFilters, setTempFilters] = useState({
    category: "All",
    sortBy: "popularity",
    minPrice: "",
    maxPrice: ""
  });

  const filteredBundles = useMemo(() => {
  console.log('Processing bundles:', bundles);
  const q = (searchQuery || "").toLowerCase();
  return (bundles || []).filter((b) => {
    const name = (b?.name || "").toLowerCase();
    const desc = (b?.description || "").toLowerCase();
    return name.includes(q) || desc.includes(q);
  });
}, [bundles, searchQuery]);

const renderBundlesSection = () => {
  if (!filteredBundles || filteredBundles.length === 0) return null;
  
  return (
    <View style={styles.bundlesSection}>
      <View style={styles.sectionHeader}>
        <Ionicons name="gift-outline" size={24} color="#10B981" />
        <Text style={styles.sectionTitle}>Special Bundles</Text>
        <View style={styles.bundleBadge}>
          <Text style={styles.bundleBadgeText}>{filteredBundles.length}</Text>
        </View>
      </View>
      
      <Text style={styles.sectionSubtitle}>
        Save more with our curated product bundles
      </Text>
      
      {filteredBundles.map((bundle) => (
        <BundleCard
          key={bundle._id}
          bundle={bundle}
          onPress={() => router.push(`/bundle-detail?id=${bundle._id}`)}
        />
      ))}
      
      <View style={styles.bundleDivider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>Individual Products</Text>
        <View style={styles.dividerLine} />
      </View>
    </View>
  );
};

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const searchInputRef = useRef(null);
  const cartModalScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Animate cart confirmation modal
  useEffect(() => {
    if (showCartConfirmation) {
      Animated.spring(cartModalScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(cartModalScale, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [showCartConfirmation]);

  // Function to handle add to cart with confirmation
  const handleAddToCart = (product) => {
    setAddedProduct(product);
    setShowCartConfirmation(true);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setShowCartConfirmation(false);
    }, 3000);
  };

  const goToCart = () => {
    setShowCartConfirmation(false);
    
    // Check if user is authenticated before redirecting to cart
    if (isLoggedIn) {
      router.push('/cart');
    } else {
      // Redirect to login page if not authenticated
      router.push('/login');
    }
  };

  const continueShopping = () => {
    setShowCartConfirmation(false);
  };

  // Filter and sort products
  const getFilteredAndSortedProducts = () => {
    let filtered = products || [];

    if (selectedCategory !== "All") {
      filtered = filtered.filter(product => {
        const productCategory = product.category;
        if (typeof productCategory === "string") {
          return productCategory === selectedCategory;
        }
        if (typeof productCategory === "object") {
          return productCategory?.name === selectedCategory || productCategory?.categoryName === selectedCategory;
        }
        return false;
      });
    }

    if (searchQuery) {
      filtered = filtered.filter(product => 
        product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (minPrice && !isNaN(minPrice)) {
      filtered = filtered.filter(product => product.price >= parseFloat(minPrice));
    }
    if (maxPrice && !isNaN(maxPrice)) {
      filtered = filtered.filter(product => product.price <= parseFloat(maxPrice));
    }

    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        break;
      case "oldest":
        filtered.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
        break;
      case "highPrice":
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case "lowPrice":
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case "review":
        filtered.sort((a, b) => {
          const avgA = a.reviews?.length ? a.reviews.reduce((s, r) => s + r.rating, 0) / a.reviews.length : 0;
          const avgB = b.reviews?.length ? b.reviews.reduce((s, r) => s + r.rating, 0) / b.reviews.length : 0;
          return avgB - avgA;
        });
        break;
      default:
        break;
    }

    return filtered;
  };

  const filteredProducts = getFilteredAndSortedProducts();
  const columns = viewMode === "list" ? 1 : (width >= 1200 ? 4 : width >= 900 ? 3 : width >= 600 ? 2 : 1);
  const columnGap = columns >= 4 ? 24 : columns === 3 ? 20 : columns === 2 ? 16 : 0;

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  const clearSearch = () => {
    setSearchQuery("");
    searchInputRef.current?.blur();
  };

  const openFilterModal = () => {
    setTempFilters({
      category: selectedCategory,
      sortBy,
      minPrice,
      maxPrice,
      viewMode
    });
    setShowFilterModal(true);
  };

  const applyFilters = () => {
    setSelectedCategory(tempFilters.category);
    setSortBy(tempFilters.sortBy);
    setMinPrice(tempFilters.minPrice);
    setMaxPrice(tempFilters.maxPrice);
    if (tempFilters.viewMode) setViewMode(tempFilters.viewMode);
    setShowFilterModal(false);
  };

  const resetFilters = () => {
    setTempFilters({
      category: "All",
      sortBy: "popularity",
      minPrice: "",
      maxPrice: "",
      viewMode: "grid"
    });
  };

  const FilterButton = ({ title, selected, onPress }) => (
    <TouchableOpacity
      style={[styles.filterButton, selected && styles.selectedFilterButton]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.filterButtonText, selected && styles.selectedFilterButtonText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  // Cart Confirmation Modal
  const renderCartConfirmationModal = () => (
    <Modal
      visible={showCartConfirmation}
      animationType="fade"
      transparent={true}
      onRequestClose={continueShopping}
    >
      <View style={styles.cartModalOverlay}>
        <Animated.View 
          style={[
            styles.cartModalContent,
            {
              transform: [{ scale: cartModalScale }]
            }
          ]}
        >
          {/* Success Icon */}
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark-circle" size={64} color="#10B981" />
          </View>

          {/* Product Info */}
          {addedProduct && (
            <>
              <Text style={styles.cartModalTitle}>Added to Cart!</Text>
              
              <View style={styles.addedProductInfo}>
                {addedProduct.images && addedProduct.images[0] && (
                  <Image 
                    source={{ uri: addedProduct.images[0] }}
                    style={styles.addedProductImage}
                  />
                )}
                <View style={styles.addedProductDetails}>
                  <Text style={styles.addedProductName} numberOfLines={2}>
                    {addedProduct.name}
                  </Text>
                  <Text style={styles.addedProductPrice}>
                    ₱{addedProduct.price?.toFixed(2)}
                  </Text>
                </View>
              </View>
            </>
          )}

          {/* Action Buttons */}
          <View style={styles.cartModalActions}>
            <TouchableOpacity
              style={styles.continueShoppingButton}
              onPress={continueShopping}
              activeOpacity={0.8}
            >
              <Text style={styles.continueShoppingText}>Continue Shopping</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.viewCartButton}
              onPress={goToCart}
              activeOpacity={0.8}
            >
              <Ionicons name="cart-outline" size={20} color="#FFFFFF" />
              <Text style={styles.viewCartText}>View Cart</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter</Text>
            <TouchableOpacity
              onPress={() => setShowFilterModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Category</Text>
            <View style={styles.filterOptions}>
              {categories.map((category) => (
                <FilterButton
                  key={category}
                  title={category}
                  selected={tempFilters.category === category}
                  onPress={() => setTempFilters(prev => ({ ...prev, category }))}
                />
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>View Mode</Text>
            <View style={styles.filterOptions}>
              <FilterButton
                title="Grid"
                selected={tempFilters.viewMode === "grid"}
                onPress={() => setTempFilters(prev => ({ ...prev, viewMode: "grid" }))}
              />
              <FilterButton
                title="List"
                selected={tempFilters.viewMode === "list"}
                onPress={() => setTempFilters(prev => ({ ...prev, viewMode: "list" }))}
              />
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Sort By</Text>
            <View style={styles.filterOptions}>
              <FilterButton
                title="Popularity"
                selected={tempFilters.sortBy === "popularity"}
                onPress={() => setTempFilters(prev => ({ ...prev, sortBy: "popularity" }))}
              />
              <FilterButton
                title="Newest"
                selected={tempFilters.sortBy === "newest"}
                onPress={() => setTempFilters(prev => ({ ...prev, sortBy: "newest" }))}
              />
              <FilterButton
                title="Oldest"
                selected={tempFilters.sortBy === "oldest"}
                onPress={() => setTempFilters(prev => ({ ...prev, sortBy: "oldest" }))}
              />
              <FilterButton
                title="High Price"
                selected={tempFilters.sortBy === "highPrice"}
                onPress={() => setTempFilters(prev => ({ ...prev, sortBy: "highPrice" }))}
              />
              <FilterButton
                title="Low Price"
                selected={tempFilters.sortBy === "lowPrice"}
                onPress={() => setTempFilters(prev => ({ ...prev, sortBy: "lowPrice" }))}
              />
              <FilterButton
                title="Review"
                selected={tempFilters.sortBy === "review"}
                onPress={() => setTempFilters(prev => ({ ...prev, sortBy: "review" }))}
              />
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Price Range</Text>
            <View style={styles.priceInputsContainer}>
              <TextInput
                style={styles.priceInput}
                placeholder="Min Price"
                placeholderTextColor="#9CA3AF"
                value={tempFilters.minPrice}
                onChangeText={(text) => setTempFilters(prev => ({ ...prev, minPrice: text }))}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.priceInput}
                placeholder="Max Price"
                placeholderTextColor="#9CA3AF"
                value={tempFilters.maxPrice}
                onChangeText={(text) => setTempFilters(prev => ({ ...prev, maxPrice: text }))}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={resetFilters}
              activeOpacity={0.8}
            >
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={applyFilters}
              activeOpacity={0.8}
            >
              <Text style={styles.applyButtonText}>Apply Filter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderProductCard = ({ item, index }) => (
    <Animated.View
      style={[
        styles.productCardContainer,
        { flex: 1 },
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: Animated.add(
                slideAnim,
                new Animated.Value(index * 10)
              )
            }
          ]
        }
      ]}
    >
      <ProductCard
        product={item}
        onPress={() => {
          console.log('Navigating to product:', item._id);
          router.push(`/product-detail?id=${item._id}`);
        }}
        onAddToCart={() => handleAddToCart(item)}
        compact
      />
    </Animated.View>
  );

  // Featured product (large) at top; others in compact grid
  const featuredProduct = useMemo(() => (filteredProducts && filteredProducts.length > 0 ? filteredProducts[0] : null), [filteredProducts]);
  const gridProducts = useMemo(() => (featuredProduct ? filteredProducts.slice(1) : filteredProducts), [filteredProducts, featuredProduct]);

  const renderFeaturedProduct = () => {
    if (!featuredProduct) return null;
    return (
      <Animated.View
        style={[
          styles.featuredContainer,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}
      >
        <ProductCard
          product={featuredProduct}
          onPress={() => {
            router.push(`/product-detail?id=${featuredProduct._id}`);
          }}
          onAddToCart={() => handleAddToCart(featuredProduct)}
        />
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <Animated.View 
      style={[
        styles.emptyContainer,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}
    >
      <View style={styles.emptyIconContainer}>
        <Text style={styles.emptyIcon}>
          {loading ? "⏳" : searchQuery ? "🔍" : "📦"}
        </Text>
      </View>
      <Text style={styles.emptyTitle}>
        {loading ? "Loading products..." : "No products found"}
      </Text>
      <Text style={styles.emptySubtitle}>
        {loading 
          ? "Please wait while we fetch the latest products"
          : searchQuery 
            ? `No results for "${searchQuery}"`
            : "Try adjusting your search or category filter"
        }
      </Text>
      {!loading && searchQuery && (
        <TouchableOpacity style={styles.clearSearchButton} onPress={clearSearch}>
          <Text style={styles.clearSearchText}>Clear Search</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );

  const renderSkeletonGrid = () => {
    const placeholders = Array.from({ length: viewMode === "list" ? 4 : columns * 4 }).map((_, i) => i);
    return (
      <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
        {/* featured skeleton */}
        {viewMode === "grid" && (
          <View style={[styles.featuredContainer, { paddingHorizontal: 0 }]}> 
            <View style={styles.skeletonCardLarge}>
              <View style={styles.skeletonImageLarge} />
              <View style={styles.skeletonTextRow}>
                <View style={styles.skeletonLineWide} />
                <View style={styles.skeletonLineShort} />
              </View>
            </View>
          </View>
        )}
        {/* grid/list skeletons */}
        <View style={{ flexDirection: columns > 1 ? 'row' : 'column', flexWrap: 'wrap', gap: columnGap }}>
          {placeholders.map((i) => (
            <View key={`sk-${i}`} style={[styles.skeletonCard, columns > 1 ? { width: (width - 56 - columnGap) / columns } : { width: '100%' }]}>
              <View style={styles.skeletonImage} />
              <View style={styles.skeletonTextBlock}>
                <View style={styles.skeletonLine} />
                <View style={[styles.skeletonLine, { width: '60%' }]} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#10B981" />
      
      <Animated.View 
        style={[
          styles.header,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Products</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statBadge}>
              <Text style={styles.statNumber}>{filteredProducts.length}</Text>
              <Text style={styles.statLabel}>
                {filteredProducts.length === 1 ? 'product' : 'products'}
              </Text>
            </View>
          </View>
        </View>
        <Text style={styles.headerSubtitle}>
          Discover our amazing collection
        </Text>
      </Animated.View>

      <Animated.View 
        style={[
          styles.searchContainer,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}
      >
        <View style={[
          styles.searchInputContainer,
          searchFocused && styles.searchInputFocused
        ]}>
          <Ionicons name="search-outline" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            ref={searchInputRef}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search products..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity
          style={styles.filterIconButton}
          onPress={openFilterModal}
          activeOpacity={0.8}
        >
          <Ionicons name="options-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Inline View Toggle (Grid/List) */}
        <View style={styles.viewToggleContainer}>
          <TouchableOpacity
            style={[styles.viewToggleBtn, viewMode === "grid" && styles.viewToggleBtnActive]}
            onPress={() => setViewMode("grid")}
            activeOpacity={0.8}
          >
            <Ionicons
              name="grid-outline"
              size={18}
              color={viewMode === "grid" ? "#FFFFFF" : "#10B981"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewToggleBtn, viewMode === "list" && styles.viewToggleBtnActive]}
            onPress={() => setViewMode("list")}
            activeOpacity={0.8}
          >
            <Ionicons
              name="list-outline"
              size={18}
              color={viewMode === "list" ? "#FFFFFF" : "#10B981"}
            />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {(selectedCategory !== "All" || sortBy !== "popularity" || minPrice || maxPrice) && (
        <View style={styles.activeFiltersContainer}>
          <Text style={styles.activeFiltersLabel}>Active filters:</Text>
          <View style={styles.activeFiltersList}>
            {selectedCategory !== "All" && (
              <View style={styles.activeFilterTag}>
                <Text style={styles.activeFilterText}>{selectedCategory}</Text>
                <TouchableOpacity onPress={() => setSelectedCategory("All")}>
                  <Ionicons name="close" size={14} color="#10B981" />
                </TouchableOpacity>
              </View>
            )}
            {sortBy !== "popularity" && (
              <View style={styles.activeFilterTag}>
                <Text style={styles.activeFilterText}>
                  {sortBy === "newest" ? "Newest" : 
                   sortBy === "oldest" ? "Oldest" :
                   sortBy === "highPrice" ? "High Price" :
                   sortBy === "lowPrice" ? "Low Price" :
                   sortBy === "review" ? "Best Review" : sortBy}
                </Text>
                <TouchableOpacity onPress={() => setSortBy("popularity")}>
                  <Ionicons name="close" size={14} color="#10B981" />
                </TouchableOpacity>
              </View>
            )}
            {(minPrice || maxPrice) && (
              <View style={styles.activeFilterTag}>
                <Text style={styles.activeFilterText}>
                  ₱{minPrice || "0"} - ₱{maxPrice || "∞"}
                </Text>
                <TouchableOpacity onPress={() => { setMinPrice(""); setMaxPrice(""); }}>
                  <Ionicons name="close" size={14} color="#10B981" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderBundlesSection()}

      <FlatList
        data={gridProducts}
        renderItem={renderProductCard}
        keyExtractor={(item) => item._id}
        numColumns={columns}
        key={`grid-${columns}`}
        ListEmptyComponent={loading ? renderSkeletonGrid : renderEmptyState}
        ListHeaderComponent={renderFeaturedProduct}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={columns > 1 ? { gap: columnGap, paddingHorizontal: 20 } : undefined}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#10B981"]}
            tintColor="#10B981"
            progressBackgroundColor="#F8FAFC"
          />
        }
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
      />
      {renderFilterModal()}
      {renderCartConfirmationModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  listContainer: {
    paddingBottom: 100,
    alignSelf: "center",
    width: "100%",
    maxWidth: 1200,
  },

    featuredContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },

  headerContainer: {
    marginBottom: 6,
    alignSelf: "center",
    width: "100%",
    maxWidth: 1200,
  },

  header: {
    backgroundColor: "#10B981",
    paddingTop: Platform.OS === 'ios' ? 38 : 24,
    paddingBottom: 12,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },

  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },

  statsContainer: {
    alignItems: "flex-end",
  },

  statBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    alignItems: "center",
  },

  statNumber: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 20,
  },

  statLabel: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.85)",
    fontWeight: "500",
    fontStyle: "italic",
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: "#F8FAFC",
    gap: 12,
  },

  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "transparent",
  },

  searchInputFocused: {
    borderColor: "#10B981",
    shadowColor: "#10B981",
    shadowOpacity: 0.15,
  },

  searchIcon: {
    marginRight: 12,
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    fontWeight: "500",
  },

  clearButton: {
    padding: 2,
  },

  filterIconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },

  viewToggleContainer: {
    flexDirection: "row",
    gap: 8,
  },

  viewToggleBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },

  viewToggleBtnActive: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },

  activeFiltersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#F8FAFC",
  },

  activeFiltersLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 6,
  },

  activeFiltersList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  activeFilterTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#10B981",
  },

  activeFilterText: {
    fontSize: 12,
    color: "#10B981",
    fontWeight: "600",
    marginRight: 6,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },

  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 34,
    maxHeight: "80%",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },

  closeButton: {
    padding: 4,
  },

  filterSection: {
    marginVertical: 20,
  },

  filterSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },

  filterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },

  selectedFilterButton: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },

  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },

  selectedFilterButtonText: {
    color: "#FFFFFF",
  },

  priceInputsContainer: {
    flexDirection: "row",
    gap: 12,
  },

  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111827",
  },

  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },

  resetButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },

  resetButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },

  applyButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#10B981",
    alignItems: "center",
  },

  applyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  productCardContainer: {
    marginBottom: 16,
    marginTop: 4,
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
    marginTop: 40,
  },

  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  emptyIcon: {
    fontSize: 36,
  },

  emptyTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: -0.3,
  },

  emptySubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },

  clearSearchButton: {
    backgroundColor: "#10B981",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },

  clearSearchText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  // Skeleton styles
  skeletonCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  skeletonImage: {
    height: 120,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    marginBottom: 12,
  },
  skeletonTextBlock: {
    gap: 8,
  },
  skeletonLine: {
    height: 10,
    backgroundColor: "#F3F4F6",
    borderRadius: 6,
  },
  skeletonCardLarge: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
  },
  skeletonImageLarge: {
    height: 180,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    marginBottom: 12,
  },
  skeletonTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  skeletonLineWide: {
    flex: 1,
    height: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 6,
  },
  skeletonLineShort: {
    width: 80,
    height: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 6,
  },

  // Cart Confirmation Modal Styles
  cartModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  cartModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },

  successIconContainer: {
    marginBottom: 16,
  },

  cartModalTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 20,
    textAlign: "center",
  },

  addedProductInfo: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    padding: 16,
    width: "100%",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  addedProductImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
    marginRight: 12,
  },

  addedProductDetails: {
    flex: 1,
    justifyContent: "center",
  },

  addedProductName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
    lineHeight: 20,
  },

  addedProductPrice: {
    fontSize: 18,
    fontWeight: "800",
    color: "#10B981",
  },

  cartModalActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },

  continueShoppingButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
  },

  continueShoppingText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#10B981",
  },

  viewCartButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },

  viewCartText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  bundlesSection: {
  paddingHorizontal: 16,
  paddingTop: 4,
  paddingBottom: 12,
},

sectionHeader: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 6,
  gap: 8,
},

sectionTitle: {
  fontSize: 18,
  fontWeight: "800",
  color: "#111827",
  flex: 1,
},

bundleBadge: {
  backgroundColor: "#10B981",
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 12,
},

bundleBadgeText: {
  color: "#FFFFFF",
  fontSize: 12,
  fontWeight: "700",
},

sectionSubtitle: {
  fontSize: 12,
  color: "#6B7280",
  marginBottom: 10,
  fontStyle: "italic",
},

bundleDivider: {
  flexDirection: "row",
  alignItems: "center",
  marginTop: 16,
  marginBottom: 12,
  gap: 12,
},

dividerLine: {
  flex: 1,
  height: 1,
  backgroundColor: "#E5E7EB",
},

dividerText: {
  fontSize: 14,
  fontWeight: "600",
  color: "#6B7280",
  textTransform: "uppercase",
  letterSpacing: 0.5,
},
});










