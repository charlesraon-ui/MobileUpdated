import { router } from "expo-router";
import { useContext, useMemo } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { AppCtx } from "../context/AppContext";
import ProductCard from "../components/ProductCard";

export default function WishlistScreen() {
  const { products = [], wishlist = [] } = useContext(AppCtx);

  const wishlistItems = useMemo(() => {
    const set = new Set((wishlist || []).map(String));
    return (products || []).filter((p) => set.has(String(p?._id)));
  }, [products, wishlist]);

  if (!wishlistItems.length) {
    return (
      <View style={s.emptyContainer}>
        <Text style={s.emptyTitle}>Your wishlist is empty</Text>
        <Text style={s.emptySub}>Tap the heart on any product to save it.</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
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
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 8 },
  emptySub: { fontSize: 14, color: "#6B7280" },
});