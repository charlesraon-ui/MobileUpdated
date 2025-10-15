import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { getConversationsApi, searchUsersApi } from "../api/apiClient";
import Avatar from "../components/Avatar";

const GREEN = "#10B981";
const BORDER = "#E5E7EB";
const GRAY = "#6B7280";

export default function MessagesScreen() {
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getConversationsApi();
      setConversations(Array.isArray(data?.conversations) ? data.conversations : []);
    } catch (e) {
      // noop
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  const debouncedQ = useMemo(() => q.trim(), [q]);
  useEffect(() => {
    let active = true;
    const t = setTimeout(async () => {
      if (!active) return;
      if (debouncedQ.length < 1) { setResults([]); setSearching(false); return; }
      try {
        setSearching(true);
        const { data } = await searchUsersApi(debouncedQ);
        setResults(Array.isArray(data) ? data : []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => { active = false; clearTimeout(t); };
  }, [debouncedQ]);

  const openThread = (userId) => router.push({ pathname: "/chat", params: { userId } });

  const renderConversation = ({ item }) => {
    const name = item?.user?.name || item?.user?.email || item.otherUserId;
    const lastText = item?.lastMessage?.text || "";
    const time = item?.lastMessage?.createdAt ? new Date(item.lastMessage.createdAt).toLocaleString() : "";
    return (
      <TouchableOpacity style={s.convItem} onPress={() => openThread(item.otherUserId)} activeOpacity={0.8}>
        <View style={{ marginRight: 12 }}>
          <Avatar 
            avatarUrl={item?.user?.avatarUrl} 
            name={name} 
            email={item?.user?.email}
            size={40}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.convName} numberOfLines={1}>{name}</Text>
          <Text style={s.convLast} numberOfLines={1}>{lastText}</Text>
        </View>
        <View style={s.convMeta}>
          {!!item.unreadCount && <View style={s.unreadBadge}><Text style={s.unreadText}>{item.unreadCount}</Text></View>}
          <Text style={s.convTime}>{time}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderResult = ({ item }) => (
    <TouchableOpacity style={s.searchItem} onPress={() => openThread(item._id)} activeOpacity={0.8}>
      <View style={{ marginRight: 12 }}>
        <Avatar 
          avatarUrl={item.avatarUrl} 
          name={item.name} 
          email={item.email}
          size={32}
          textSize={14}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.resultName} numberOfLines={1}>{item.name || item.email}</Text>
        <Text style={s.resultEmail} numberOfLines={1}>{item.email}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={GRAY} />
    </TouchableOpacity>
  );

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Ionicons name="chatbubbles-outline" size={20} color="#fff" />
        <Text style={s.headerTitle}>Messages</Text>
      </View>

      <View style={s.searchRow}>
        <Ionicons name="search" size={16} color={GRAY} />
        <TextInput
          style={s.searchInput}
          placeholder="Search users by name or email"
          placeholderTextColor={GRAY}
          value={q}
          onChangeText={setQ}
        />
      </View>

      {debouncedQ.length > 0 ? (
        searching ? (
          <View style={s.loadingRow}><ActivityIndicator color={GREEN} /></View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item._id}
            renderItem={renderResult}
            ItemSeparatorComponent={() => <View style={s.sep} />}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          />
        )
      ) : (
        loading ? (
          <View style={s.loadingRow}><ActivityIndicator color={GREEN} /></View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.otherUserId}
            renderItem={renderConversation}
            ItemSeparatorComponent={() => <View style={s.sep} />}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          />
        )
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { backgroundColor: GREEN, paddingTop: 50, paddingBottom: 16, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { color: "#fff", fontWeight: "800", fontSize: 18 },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#fff", borderWidth: 1, borderColor: BORDER, margin: 16, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, color: "#111827" },
  loadingRow: { alignItems: "center", justifyContent: "center", marginTop: 24 },
  sep: { height: 1, backgroundColor: BORDER },
  convItem: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderWidth: 1, borderColor: BORDER, borderRadius: 12, padding: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#ECFDF5", alignItems: "center", justifyContent: "center", marginRight: 12 },
  avatarText: { color: GREEN, fontWeight: "800" },
  convName: { fontWeight: "700", color: "#111827", marginBottom: 2 },
  convLast: { color: GRAY, fontSize: 12 },
  convMeta: { alignItems: "flex-end", gap: 6 },
  unreadBadge: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: "#EF4444", alignItems: "center", justifyContent: "center", paddingHorizontal: 6 },
  unreadText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  convTime: { color: GRAY, fontSize: 10 },
  searchItem: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderWidth: 1, borderColor: BORDER, borderRadius: 12, padding: 12 },
  avatarSmall: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#ECFDF5", alignItems: "center", justifyContent: "center", marginRight: 12 },
  avatarTextSmall: { color: GREEN, fontWeight: "800" },
  resultName: { fontWeight: "700", color: "#111827" },
  resultEmail: { color: GRAY, fontSize: 12 },
});