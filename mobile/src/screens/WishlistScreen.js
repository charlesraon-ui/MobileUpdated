import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useContext, useMemo } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppCtx } from "../context/AppContext";
import ProductCard from "../components/ProductCard";

export default function WishlistScreen() {
  const { products = [], wishlist = [] } = useContext(AppCtx);

  const wishlistItems = useMemo(() => {
    const set = new Set((wishlist || []).map(String));
    return (products || []).filter((p) => set.has(String(p?._id)));
  }, [products, wishlist]);

  return (
    <View style={s.container}>
      {/* Header with back button */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={s.title}>My Wishlist</Text>
        <View style={s.placeholder} />
      </View>

      {!wishlistItems.length ? (
        <View style={s.emptyContainer}>
          <Text style={s.emptyTitle}>Your wishlist is empty</Text>
          <Text style={s.emptySub}>Tap the heart on any product to save it.</Text>
        </View>
      ) : (
        <FlatList
          data={wishlistItems}
          keyExtractor={(item) => String(item?._id)}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => router.push(`/tabs/product-detail?id=${item?._id}`)}
            />
          )}
          contentContainerStyle={{ padding: 16 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  title: { fontSize: 20, fontWeight: "800", color: "#111827", flex: 1, textAlign: "center" },
  placeholder: { width: 40 }, // To balance the header layout
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 8 },
  emptySub: { fontSize: 14, color: "#6B7280" },
});