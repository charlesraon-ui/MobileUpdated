import { useContext } from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { AppCtx } from "../context/AppContext";





import { platformShadow } from "../utils/shadow";

export default function BundleCard({ bundle, onPress }) {

  const itemCount = bundle?.products?.length || bundle?.items?.length || 0;
  const discount = bundle?.discount || 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.95}
      style={s.card}
    >
      <View style={s.headerContainer}>
        {discount > 0 && (
          <View style={s.discountBadge}>
            <Text style={s.discountText}>SAVE {discount}%</Text>
          </View>
        )}
        
        <View style={s.itemsBadge}>
          <Text style={s.itemsText}>{itemCount} items</Text>
        </View>
      </View>

      <View style={s.content}>
        <Text style={s.name} numberOfLines={2}>
          {bundle?.name || "Unnamed Bundle"}
        </Text>

        {bundle?.description && (
          <Text style={s.description} numberOfLines={2}>
            {bundle.description}
          </Text>
        )}

        <View style={s.priceRow}>
          <View style={s.priceContainer}>
            {bundle?.originalPrice && bundle.originalPrice > bundle.price && (
              <Text style={s.originalPrice}>
                ₱{Number(bundle.originalPrice).toFixed(2)}
              </Text>
            )}
            <View style={s.bundlePriceContainer}>
              <Text style={s.currency}>₱</Text>
              <Text style={s.price}>
                {Number(bundle?.price || 0).toFixed(2)}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={onPress}
            style={({ pressed }) => StyleSheet.flatten([
              s.viewButton,
              pressed && s.viewButtonPressed
            ])}
          >
            <Text style={s.viewButtonText}>View Bundle</Text>
          </Pressable>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    marginBottom: 8,
    backgroundColor: "#fff",
    borderRadius: 16,
    ...platformShadow({ color: "#000", offsetX: 0, offsetY: 2, radius: 8, opacity: 0.1, elevation: 4 }),
    overflow: "hidden",
  },
  
  headerContainer: {
    position: "relative",
    width: "100%",
    height: 42,
    backgroundColor: "#f8f9fa",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  
  discountBadge: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  
  discountText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  
  itemsBadge: {
    backgroundColor: "#10B981",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    alignSelf: "flex-end",
  },
  
  itemsText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  
  content: {
    padding: 12,
  },
  
  name: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
    lineHeight: 22,
    marginBottom: 4,
  },
  
  description: {
    fontSize: 11,
    color: "#6b7280",
    lineHeight: 15,
    marginBottom: 8,
  },
  
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  
  priceContainer: {
    flexDirection: "column",
  },
  
  originalPrice: {
    fontSize: 11,
    color: "#9CA3AF",
    textDecorationLine: "line-through",
    marginBottom: 2,
  },
  
  bundlePriceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  
  currency: {
    fontSize: 12,
    color: "#059669",
    fontWeight: "700",
    marginRight: 2,
  },
  
  price: {
    fontSize: 18,
    color: "#059669",
    fontWeight: "900",
  },
  
  viewButton: {
    backgroundColor: "#059669",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    elevation: 2,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  
  viewButtonPressed: {
    backgroundColor: "#047857",
    transform: [{ scale: 0.98 }],
  },
  
  viewButtonText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
});





