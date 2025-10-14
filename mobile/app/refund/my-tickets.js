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
      <Stack.Screen options={{ headerShown: false }} />
      <FlatList
        data={tickets}
        keyExtractor={(item) => String(item._id)}
        contentContainerStyle={{ padding: 12 }}
        ListHeaderComponent={() => (
          <View style={s.topBar}>
            <TouchableOpacity style={s.backBtn} onPress={() => router.replace(`/tabs/orders`)} activeOpacity={0.8}>
              <Text style={s.backIcon}>←</Text>
              <Text style={s.backText}>Back to Orders</Text>
            </TouchableOpacity>
            <Text style={s.topBarTitle}>My Refund Tickets</Text>
            <View style={{ width: 12 }} />
          </View>
        )}
        stickyHeaderIndices={[0]}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => {
          const oid = String(item?.order?._id || item?.order || item?.orderId || "");
          const shortOid = oid ? String(oid).slice(-8).toUpperCase() : "—";
          const onViewOrder = () => {
            if (oid) router.push(`/orders/${oid}?from=refund`);
            else router.push(`/tabs/orders`);
          };
          return (
            <View style={s.card}>
              <Text style={s.title}>Ticket #{String(item._id).slice(-8).toUpperCase()}</Text>
              <Text style={s.subtle}>Order: {shortOid}</Text>
              <Text style={s.subtle}>Status: {String(item.status || "requested").toUpperCase()}</Text>
              <Text style={s.subtle} numberOfLines={3}>Reason: {item.reason}</Text>
              <TouchableOpacity style={s.btn} onPress={onViewOrder}>
                <Text style={s.btnText}>{oid ? "View Order" : "Open Orders"}</Text>
              </TouchableOpacity>
            </View>
          );
        }}
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
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    marginBottom: 10,
  },
  topBarTitle: { fontSize: 16, fontWeight: "800", color: "#111827" },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#F3F4F6",
  },
  backIcon: { fontSize: 16, marginRight: 6 },
  backText: { fontSize: 14, fontWeight: "700", color: "#111827" },
  card: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: BORDER, borderRadius: 12, padding: 12 },
  title: { fontSize: 16, fontWeight: "700", color: "#111827" },
  subtle: { fontSize: 14, color: GRAY, marginTop: 6 },
  btn: { marginTop: 12, paddingVertical: 12, borderRadius: 8, alignItems: "center", backgroundColor: GREEN },
  btnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});