import { useContext } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { AppCtx } from "../context/AppContext";

const PLACEHOLDER = "https://via.placeholder.com/400x300.png?text=No+Image";

function pickImage(product, toAbsoluteUrl) {
  const first = product?.imageUrl || product?.images?.[0] || null;
  if (!first) return PLACEHOLDER;
  return toAbsoluteUrl ? toAbsoluteUrl(first) : first;
}

export default function ProductCard({ product, onPress }) {
  const { handleAddToCart, categoryLabelOf, toAbsoluteUrl } = useContext(AppCtx);
  const img = pickImage(product, toAbsoluteUrl);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.95}
      style={s.card}
    >
      {/* Image Container with Overlay Shadow */}
      <View style={s.imageContainer}>
        <Image source={{ uri: img }} style={s.image} resizeMode="cover" />
        <View style={s.imageOverlay} />
      </View>

      {/* Content Container */}
      <View style={s.content}>
        {/* Category Badge */}
        <View style={s.categoryBadge}>
          <Text style={s.categoryText}>
            {categoryLabelOf?.(product) || "Uncategorized"}
          </Text>
        </View>

        {/* Product Name */}
        <Text style={s.name} numberOfLines={2}>
          {product?.name || "Unnamed Product"}
        </Text>

        {/* Weight (if available) */}
        {product?.weightKg && (
          <Text style={s.weight}>
            Weight: {product.weightKg}kg
          </Text>
        )}

        {/* Price and Add to Cart Row */}
        <View style={s.bottomRow}>
          <View style={s.priceContainer}>
            <Text style={s.currency}>₱</Text>
            <Text style={s.price}>{Number(product?.price || 0).toFixed(2)}</Text>
          </View>

          <Pressable
            onPress={() => handleAddToCart(product)}
            style={({ pressed }) => [
              s.addButton,
              pressed && s.addButtonPressed
            ]}
          >
            <Text style={s.addButtonText}>Add to Cart</Text>
          </Pressable>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    marginBottom: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: "hidden",
  },
  
  imageContainer: {
    position: "relative",
  },
  
  image: {
    width: "100%",
    height: 140,
    backgroundColor: "#f3f4f6",
  },
  
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  
  content: {
    padding: 16,
  },
  
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  
  categoryText: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 22,
    marginBottom: 8,
  },
  
  weight: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
    marginBottom: 8,
  },
  
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  
  currency: {
    fontSize: 14,
    color: "#059669",
    fontWeight: "600",
    marginRight: 2,
  },
  
  price: {
    fontSize: 20,
    color: "#059669",
    fontWeight: "800",
  },
  
  addButton: {
    backgroundColor: "#059669",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  
  addButtonPressed: {
    backgroundColor: "#047857",
    transform: [{ scale: 0.98 }],
  },
  
  addButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});