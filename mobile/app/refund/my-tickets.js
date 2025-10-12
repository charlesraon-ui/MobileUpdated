import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { getMyRefundTicketsApi } from "../../src/api/apiClient";

const GREEN = "#10B981";
const BORDER = "#E5E7EB";
const GRAY = "#6B7280";

export default function MyRefundTicketsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getMyRefundTicketsApi();
        setTickets(Array.isArray(data?.tickets) ? data.tickets : []);
      } catch (e) {
        console.warn("my tickets fetch failed:", e?.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={GREEN} />
        <Text style={{ marginTop: 12, color: GRAY }}>Loading tickets…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <Stack.Screen options={{ title: "My Refund Tickets" }} />
      <FlatList
        data={tickets}
        keyExtractor={(item) => String(item._id)}
        contentContainerStyle={{ padding: 12 }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <View style={s.card}>
            <Text style={s.title}>Ticket #{String(item._id).slice(-8).toUpperCase()}</Text>
            <Text style={s.subtle}>Order: {String(item.orderId).slice(-8).toUpperCase()}</Text>
            <Text style={s.subtle}>Status: {String(item.status || "requested").toUpperCase()}</Text>
            <Text style={s.subtle} numberOfLines={3}>Reason: {item.reason}</Text>
            <TouchableOpacity style={s.btn} onPress={() => router.push(`/orders/${item.orderId}`)}>
              <Text style={s.btnText}>View Order</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={s.centered}>
            <Text style={{ color: GRAY }}>No refund tickets yet.</Text>
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: BORDER, borderRadius: 12, padding: 12 },
  title: { fontSize: 16, fontWeight: "700", color: "#111827" },
  subtle: { fontSize: 14, color: GRAY, marginTop: 6 },
  btn: { marginTop: 12, paddingVertical: 12, borderRadius: 8, alignItems: "center", backgroundColor: GREEN },
  btnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});