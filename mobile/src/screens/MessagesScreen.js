import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getConversationsApi } from "../api/apiClient";
import Avatar from "../components/Avatar";

const GREEN = "#10B981";
const BORDER = "#E5E7EB";
const GRAY = "#6B7280";

export default function MessagesScreen() {
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([]);

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getConversationsApi();
      console.log('Conversations API response:', data);
      setConversations(Array.isArray(data?.conversations) ? data.conversations : []);
    } catch (e) {
      console.error('Error loading conversations:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

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



  return (
    <View style={s.container}>
      <View style={s.titleContainer}>
        <Text style={s.title}>Messages</Text>
      </View>

      {loading ? (
        <View style={s.loadingRow}><ActivityIndicator color={GREEN} /></View>
      ) : conversations.length === 0 ? (
        <View style={s.emptyState}>
          <Ionicons name="chatbubbles-outline" size={48} color={GRAY} />
          <Text style={s.emptyTitle}>No conversations yet</Text>
          <Text style={s.emptySubtitle}>Start a conversation to see it here</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.otherUserId}
          renderItem={renderConversation}
          ItemSeparatorComponent={() => <View style={s.sep} />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  titleContainer: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, backgroundColor: "#F8FAFC" },
  title: { fontSize: 24, fontWeight: "700", color: "#111827", textAlign: "left" },

  loadingRow: { alignItems: "center", justifyContent: "center", marginTop: 24 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, paddingTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#111827", marginTop: 16, textAlign: "center" },
  emptySubtitle: { fontSize: 14, color: GRAY, marginTop: 8, textAlign: "center", lineHeight: 20 },
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

});