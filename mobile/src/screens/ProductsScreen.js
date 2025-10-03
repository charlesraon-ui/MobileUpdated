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
      maxPrice
    });
    setShowFilterModal(true);
  };

  const applyFilters = () => {
    setSelectedCategory(tempFilters.category);
    setSortBy(tempFilters.sortBy);
    setMinPrice(tempFilters.minPrice);
    setMaxPrice(tempFilters.maxPrice);
    setShowFilterModal(false);
  };

  const resetFilters = () => {
    setTempFilters({
      category: "All",
      sortBy: "popularity",
      minPrice: "",
      maxPrice: ""
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
      />
    </Animated.View>
  );

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
        data={filteredProducts}
        renderItem={renderProductCard}
        keyExtractor={(item) => item._id}
        numColumns={1}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContainer}
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
  },

  headerContainer: {
    marginBottom: 8,
  },

  header: {
    backgroundColor: "#10B981",
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 24,
    paddingHorizontal: 20,
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
    marginBottom: 8,
  },

  headerTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },

  statsContainer: {
    alignItems: "flex-end",
  },

  statBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: "#F8FAFC",
    gap: 12,
  },

  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
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
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  activeFiltersContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#F8FAFC",
  },

  activeFiltersLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
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
    marginHorizontal: 20,
    marginBottom: 16,
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
    shadowRadius: 8,
    elevation: 6,
  },

  clearSearchText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
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
    borderRadius: 16,
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
    paddingVertical: 14,
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
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  viewCartText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  bundlesSection: {
  paddingHorizontal: 20,
  paddingTop: 8,
  paddingBottom: 24,
},

sectionHeader: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 8,
  gap: 8,
},

sectionTitle: {
  fontSize: 22,
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
  fontSize: 14,
  color: "#6B7280",
  marginBottom: 16,
  fontStyle: "italic",
},

bundleDivider: {
  flexDirection: "row",
  alignItems: "center",
  marginTop: 24,
  marginBottom: 16,
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