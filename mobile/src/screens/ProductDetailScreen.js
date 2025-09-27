// src/screens/ProductDetailScreen.js
import { router } from "expo-router";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getProductRecommendations } from "../api/apiClient";
import { AppCtx } from "../context/AppContext";

export default function ProductDetailScreen({ route }) {
  // Safely access id
  const id = route?.params?.id;

  const {
    productDetail,
    fetchProductDetail,
    submitReview,
    handleAddToCart,
    toAbsoluteUrl,
  } = useContext(AppCtx);

  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [imageLoading, setImageLoading] = useState(true);
  const [showFullDescription, setShowFullDescription] = useState(false);

  // AI recos
  const [recoLoading, setRecoLoading] = useState(false);
  const [recos, setRecos] = useState({
    similar: [],
    complementary: [],
    addons: [],
  });

  // animation (stable ref)
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // fetch detail + animate in
  useEffect(() => {
    if (!id) return;
    fetchProductDetail(id);
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, [id]);

  // fetch per-product recommendations
  useEffect(() => {
    let active = true;
    (async () => {
      if (!id) return;
      try {
        setRecoLoading(true);
        const res = await getProductRecommendations(id, 8);
        if (!active) return;
        const data = res?.data || {};
        setRecos({
          similar: Array.isArray(data.similar) ? data.similar : [],
          complementary: Array.isArray(data.complementary) ? data.complementary : [],
          addons: Array.isArray(data.addons) ? data.addons : [],
        });
      } catch {
        if (active) setRecos({ similar: [], complementary: [], addons: [] });
      } finally {
        if (active) setRecoLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  // guard: no id
  if (!id) {
    return (
      <View style={s.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#10B981" />
        <View style={s.loadingBox}>
          <Text style={s.loadingText}>Invalid product ID</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginTop: 16, padding: 12, backgroundColor: "#10B981", borderRadius: 8 }}
          >
            <Text style={{ color: "white", textAlign: "center" }}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // guard: loading detail
  if (!productDetail) {
    return (
      <View style={s.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#10B981" />
        <View style={s.loadingBox}>
          <View style={s.loadingSpinner} />
          <Text style={s.loadingText}>Loading product...</Text>
        </View>
      </View>
    );
  }

  const p = productDetail;

  // Better image URL handling
  const getImageUrl = (product) => {
    const imageSource = product?.imageUrl || product?.images?.[0];
    if (!imageSource) return "https://via.placeholder.com/400x300.png?text=No+Image";
    if (String(imageSource).startsWith("http")) return imageSource;
    return toAbsoluteUrl ? toAbsoluteUrl(imageSource) : imageSource;
  };
  const img = getImageUrl(p);

  const averageRating = useMemo(
    () =>
      p.reviews?.length
        ? p.reviews.reduce((s, r) => s + (r.rating || 0), 0) / p.reviews.length
        : 0,
    [p.reviews]
  );

  const handleSubmit = () => {
    if (!newRating || !newComment.trim()) return;
    submitReview(p._id, newRating, newComment);
    setNewRating(0);
    setNewComment("");
  };

  const renderStars = (rating, interactive = false, onPress = null) => (
    <View style={s.starsContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => interactive && onPress?.(star)}
          disabled={!interactive}
          style={interactive ? s.interactiveStar : s.staticStar}
        >
          <Text style={[s.starText, { color: star <= rating ? "#FFD700" : "#E5E7EB" }]}>
            ★
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // small product row for recos
  const RecoRow = ({ item }) => {
    const imgSrc = item.imageUrl || "https://via.placeholder.com/120x120.png?text=Item";
    return (
      <View style={s.recoRow}>
        <Image source={{ uri: imgSrc }} style={s.recoImg} />
        <View style={{ flex: 1 }}>
          <Text style={s.recoName} numberOfLines={2}>{item.name}</Text>
          <Text style={s.recoPrice}>₱{Number(item.price || 0).toLocaleString("en-PH")}</Text>
        </View>
        <TouchableOpacity onPress={() => handleAddToCart(item)}>
          <Text style={s.recoAdd}>Add</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#10B981" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>
          {p?.name || "Product Details"}
        </Text>
        <View style={s.headerSpacer} />
      </View>

      <ScrollView
        style={s.scrollView}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Image */}
          <View style={s.imageContainer}>
            <Image
              source={{ uri: img }}
              style={s.productImage}
              resizeMode="cover"
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
            />
            {imageLoading && (
              <View style={s.imageLoader}>
                <View style={s.loadingSpinner} />
              </View>
            )}
          </View>

          {/* Info */}
          <View style={s.productInfoCard}>
            <Text style={s.productName}>{p.name}</Text>
            <View style={s.priceRatingRow}>
              <Text style={s.productPrice}>₱{Number(p.price || 0).toFixed(2)}</Text>
              <View style={s.ratingBadge}>
                {renderStars(averageRating)}
                <Text style={s.ratingText}>({p.reviews?.length || 0})</Text>
              </View>
            </View>

            {p.weightKg ? (
              <View style={s.weightContainer}>
                <Text style={s.weightLabel}>Weight:</Text>
                <Text style={s.weightValue}>{p.weightKg}kg</Text>
              </View>
            ) : null}

            {!!p.tags?.length && (
              <View style={s.tagsContainer}>
                {p.tags.map((tag, i) => (
                  <View key={i} style={s.tagBadge}>
                    <Text style={s.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={s.descriptionContainer}>
              <Text style={s.descriptionLabel}>Description</Text>
              <Text
                style={s.productDescription}
                numberOfLines={showFullDescription ? undefined : 3}
              >
                {p.description || "No description available."}
              </Text>
              {p.description && p.description.length > 100 && (
                <TouchableOpacity
                  onPress={() => setShowFullDescription(!showFullDescription)}
                  style={s.readMoreButton}
                >
                  <Text style={s.readMoreText}>
                    {showFullDescription ? "Show less" : "Read more"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Add to Cart */}
          <View style={s.addToCartContainer}>
            <TouchableOpacity style={s.addToCartButton} onPress={() => handleAddToCart(p)} activeOpacity={0.8}>
              <Text style={s.addToCartText}>Add to Cart</Text>
            </TouchableOpacity>
          </View>

          {/* ---------- AI RECOMMENDATIONS ---------- */}
          {(recoLoading ||
            recos.similar.length ||
            recos.complementary.length ||
            recos.addons.length) ? (
            <View style={s.recoSection}>
              <Text style={s.recoTitle}>Recommended for this item</Text>

              {recoLoading ? (
                <View style={{ alignItems: "center", marginVertical: 8 }}>
                  <View style={s.loadingSpinner} />
                  <Text style={s.muted}>Finding similar and complementary items…</Text>
                </View>
              ) : (
                <>
                  {recos.similar.length > 0 && (
                    <>
                      <Text style={s.recoHeading}>Similar items</Text>
                      <FlatList
                        data={recos.similar}
                        keyExtractor={(it) => it._id}
                        renderItem={({ item }) => <RecoRow item={item} />}
                        ItemSeparatorComponent={() => <View style={s.sep} />}
                      />
                    </>
                  )}

                  {recos.complementary.length > 0 && (
                    <>
                      <Text style={s.recoHeading}>Frequently bought together</Text>
                      <FlatList
                        data={recos.complementary}
                        keyExtractor={(it) => it._id}
                        renderItem={({ item }) => <RecoRow item={item} />}
                        ItemSeparatorComponent={() => <View style={s.sep} />}
                      />
                    </>
                  )}

                  {recos.addons.length > 0 && (
                    <>
                      <Text style={s.recoHeading}>Customers also added</Text>
                      <FlatList
                        data={recos.addons}
                        keyExtractor={(it) => it._id}
                        renderItem={({ item }) => <RecoRow item={item} />}
                        ItemSeparatorComponent={() => <View style={s.sep} />}
                      />
                    </>
                  )}
                </>
              )}
            </View>
          ) : null}

          {/* Reviews */}
          <View style={s.reviewsSection}>
            <View style={s.reviewsHeader}>
              <Text style={s.sectionTitle}>Reviews & Ratings</Text>
              {averageRating > 0 && (
                <View style={s.averageRatingContainer}>
                  <Text style={s.averageRatingNumber}>{averageRating.toFixed(1)}</Text>
                  <Text style={s.averageRatingText}>★</Text>
                </View>
              )}
            </View>

            {/* Write Review */}
            <View style={s.writeReviewCard}>
              <Text style={s.writeReviewTitle}>Write a Review</Text>
              <Text style={s.ratingLabel}>Your Rating</Text>
              {renderStars(newRating, true, setNewRating)}
              <TextInput
                value={newComment}
                onChangeText={setNewComment}
                placeholder="Share your thoughts about this product..."
                style={s.reviewInput}
                multiline
                textAlignVertical="top"
                maxLength={500}
              />
              <TouchableOpacity
                style={[s.submitButton, (!newRating || !newComment.trim()) && s.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={!newRating || !newComment.trim()}
                activeOpacity={0.8}
              >
                <Text style={[s.submitButtonText, (!newRating || !newComment.trim()) && s.submitButtonTextDisabled]}>
                  Submit Review
                </Text>
              </TouchableOpacity>
            </View>

            {/* Existing Reviews */}
            <View style={s.existingReviews}>
              {p.reviews?.length > 0 ? (
                p.reviews.map((review, index) => (
                  <View key={index} style={s.reviewCard}>
                    <View style={s.reviewHeader}>
                      <View style={s.reviewerInfo}>
                        <View style={s.avatarPlaceholder}>
                          <Text style={s.avatarText}>
                            {(review.userId?.name || "A").charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View>
                          <Text style={s.reviewerName}>{review.userId?.name || "Anonymous"}</Text>
                          {renderStars(review.rating)}
                        </View>
                      </View>
                    </View>
                    <Text style={s.reviewComment}>{review.comment}</Text>
                  </View>
                ))
              ) : (
                <View style={s.noReviewsContainer}>
                  <Text style={s.noReviewsText}>No reviews yet</Text>
                  <Text style={s.noReviewsSubtext}>Be the first to review this product!</Text>
                </View>
              )}
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  loadingContainer: { flex: 1, backgroundColor: "#F8FAFC" },
  loadingBox: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  loadingSpinner: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 3,
    borderColor: "#E5E7EB", borderTopColor: "#10B981", marginBottom: 16,
  },
  loadingText: { fontSize: 16, color: "#6B7280", fontWeight: "500" },

  header: {
    backgroundColor: "#10B981", paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  backIcon: { fontSize: 18, color: "#FFFFFF", fontWeight: "bold" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 18, fontWeight: "700", color: "#FFFFFF", marginHorizontal: 16 },
  headerSpacer: { width: 40 },

  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 32 },

  imageContainer: {
    position: "relative", backgroundColor: "#FFFFFF", marginHorizontal: 16, marginTop: 16,
    borderRadius: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 5, overflow: "hidden",
  },
  productImage: { width: "100%", height: 280, backgroundColor: "#F3F4F6" },
  imageLoader: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center", justifyContent: "center", backgroundColor: "#F3F4F6",
  },

  productInfoCard: {
    backgroundColor: "#FFFFFF", marginHorizontal: 16, marginTop: 16, borderRadius: 16, padding: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  productName: { fontSize: 24, fontWeight: "800", color: "#111827", marginBottom: 12, lineHeight: 32 },
  priceRatingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  productPrice: { fontSize: 28, fontWeight: "700", color: "#059669" },
  ratingBadge: { flexDirection: "row", alignItems: "center" },
  ratingText: { fontSize: 14, color: "#6B7280", marginLeft: 8, fontWeight: "500" },

  weightContainer: { flexDirection: "row", alignItems: "center", marginBottom: 16, paddingHorizontal: 4 },
  weightLabel: { fontSize: 14, color: "#6B7280", fontWeight: "500", marginRight: 8 },
  weightValue: {
    fontSize: 14, color: "#374151", fontWeight: "600", backgroundColor: "#F3F4F6",
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },

  tagsContainer: { flexDirection: "row", flexWrap: "wrap", marginBottom: 20 },
  tagBadge: {
    backgroundColor: "#EFF6FF", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: "#DBEAFE",
  },
  tagText: { fontSize: 12, color: "#1E40AF", fontWeight: "600" },

  descriptionContainer: { marginTop: 4 },
  descriptionLabel: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 8 },
  productDescription: { fontSize: 15, color: "#4B5563", lineHeight: 22 },
  readMoreButton: { marginTop: 8 },
  readMoreText: { fontSize: 14, color: "#10B981", fontWeight: "600" },

  addToCartContainer: { paddingHorizontal: 16, marginTop: 20 },
  addToCartButton: {
    backgroundColor: "#10B981", paddingVertical: 16, borderRadius: 12, alignItems: "center",
    justifyContent: "center", shadowColor: "#10B981", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  addToCartText: { fontSize: 18, fontWeight: "700", color: "#FFFFFF" },

  // Recos
  recoSection: { marginTop: 24, paddingHorizontal: 16 },
  recoTitle: { fontSize: 20, fontWeight: "800", color: "#111827", marginBottom: 8 },
  recoHeading: { fontSize: 16, fontWeight: "800", color: "#374151", marginTop: 10, marginBottom: 6 },
  sep: { height: 1, backgroundColor: "#E5E7EB" },
  muted: { color: "#6B7280", marginTop: 8 },
  recoRow: {
    flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8,
  },
  recoImg: { width: 56, height: 56, borderRadius: 8, backgroundColor: "#F3F4F6" },
  recoName: { flex: 1, fontWeight: "700", color: "#111827" },
  recoPrice: { color: "#059669", fontWeight: "800", marginTop: 2 },
  recoAdd: { color: "#2563EB", fontWeight: "800" },

  // Reviews
  reviewsSection: { marginTop: 24, paddingHorizontal: 16 },
  reviewsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: "#111827" },
  averageRatingContainer: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#FEF3C7",
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  averageRatingNumber: { fontSize: 16, fontWeight: "700", color: "#D97706", marginRight: 4 },
  averageRatingText: { fontSize: 16, color: "#D97706" },

  writeReviewCard: {
    backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, marginBottom: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  writeReviewTitle: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 16 },
  ratingLabel: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 },

  starsContainer: { flexDirection: "row", marginBottom: 16 },
  interactiveStar: { padding: 4 },
  staticStar: { marginRight: 2 },
  starText: { fontSize: 24 },

  reviewInput: {
    borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 12, padding: 16, fontSize: 15,
    minHeight: 100, backgroundColor: "#F9FAFB", marginBottom: 16, color: "#111827",
  },
  submitButton: { backgroundColor: "#10B981", paddingVertical: 12, borderRadius: 8, alignItems: "center" },
  submitButtonDisabled: { backgroundColor: "#D1D5DB" },
  submitButtonText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
  submitButtonTextDisabled: { color: "#9CA3AF" },

  existingReviews: { gap: 12 },
  reviewCard: {
    backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  reviewHeader: { marginBottom: 12 },
  reviewerInfo: { flexDirection: "row", alignItems: "center" },
  avatarPlaceholder: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "#10B981",
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  avatarText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  reviewerName: { fontSize: 16, fontWeight: "600", color: "#111827", marginBottom: 4 },
  reviewComment: { fontSize: 15, color: "#4B5563", lineHeight: 22 },

  noReviewsContainer: { alignItems: "center", paddingVertical: 40 },
  noReviewsText: { fontSize: 18, fontWeight: "600", color: "#9CA3AF", marginBottom: 8 },
  noReviewsSubtext: { fontSize: 14, color: "#D1D5DB" },
});
