// app/search.js
import axios from "axios";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Image, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { API_URL } from "../src/api/apiClient";

export default function SearchScreen() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const inputRef = useRef(null);

  const debouncedQ = useMemo(() => q.trim(), [q]);
  useEffect(() => {
    let active = true;
    const t = setTimeout(async () => {
      if (!active) return;
      if (debouncedQ.length < 1) { setItems([]); setErr(""); setLoading(false); return; }
      try {
        setLoading(true); setErr("");
        const res = await axios.get(`${API_URL}/products/search`, { params: { q: debouncedQ, limit: 50 } });
        if (active) setItems(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        if (active) { setErr(e?.response?.data?.message || e?.message || "Failed to search"); setItems([]); }
      } finally { if (active) setLoading(false); }
    }, 350);
    return () => { active = false; clearTimeout(t); };
  }, [debouncedQ]);

  const renderItem = ({ item }) => {
    const img = item.imageUrl || item.images?.[0] || "https://via.placeholder.com/120x120.png?text=Item";
    return (
      <TouchableOpacity style={s.card} onPress={() => { Keyboard.dismiss(); router.push(`/product/${item._id}`); }} activeOpacity={0.8}>
        <Image source={{ uri: img }} style={s.img} />
        <View style={{ flex: 1 }}>
          <Text style={s.name} numberOfLines={2}>{item.name}</Text>
          <Text style={s.price}>₱{Number(item.price || 0).toLocaleString("en-PH")}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>Search</Text>
      <View style={s.searchBar}>
        <TextInput
          ref={inputRef}
          placeholder="Search products…"
          placeholderTextColor="#9CA3AF"
          value={q}
          onChangeText={setQ}
          style={s.input}
          autoFocus
          returnKeyType="search"
          onSubmitEditing={() => Keyboard.dismiss()}
        />
      </View>

      {q.trim().length < 1 && <Text style={s.hint}>Type at least 1 character to search.</Text>}
      {loading && <View style={s.center}><ActivityIndicator /><Text style={s.muted}>Searching…</Text></View>}
      {!loading && err ? <Text style={s.error}>{err}</Text> : null}
      {!loading && !err && q.trim().length >= 1 && items.length === 0 && <Text style={s.muted}>No results found.</Text>}

      {!loading && items.length > 0 && (
        <FlatList
          data={items}
          keyExtractor={(it) => it._id}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={s.sep} />}
          contentContainerStyle={{ paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 8 },
  searchBar: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10 },
  input: { flex: 1, color: "#111827", fontSize: 16 },
  hint: { color: "#6B7280", marginTop: 8 },
  center: { alignItems: "center", marginTop: 16 },
  muted: { color: "#6B7280", marginTop: 8 },
  error: { color: "tomato", marginTop: 12 },
  sep: { height: 1, backgroundColor: "#E5E7EB" },
  card: { flexDirection: "row", gap: 12, paddingVertical: 8, alignItems: "center" },
  img: { width: 60, height: 60, borderRadius: 8, backgroundColor: "#F3F4F6" },
  name: { fontWeight: "700", color: "#111827" },
  price: { marginTop: 2, color: "#059669", fontWeight: "800" },
});
