import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getConversationsApi, getUserGroupChatsApi } from "../api/apiClient";
import Avatar from "../components/Avatar";

const GREEN = "#10B981";
const BORDER = "#E5E7EB";
const GRAY = "#6B7280";

export default function MessagesScreen() {
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [groupChats, setGroupChats] = useState([]);
  const [activeTab, setActiveTab] = useState('direct'); // 'direct' or 'groups'

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load both direct messages and group chats
      const [directResponse, groupResponse] = await Promise.all([
        getConversationsApi(),
        getUserGroupChatsApi()
      ]);
      
      console.log('Direct messages response:', directResponse.data);
      console.log('Group chats response:', groupResponse.data);
      
      setConversations(Array.isArray(directResponse.data?.conversations) ? directResponse.data.conversations : []);
      setGroupChats(Array.isArray(groupResponse.data?.groupChats) ? groupResponse.data.groupChats : []);
    } catch (e) {
      console.error('Error loading conversations:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  const openThread = (userId) => router.push({ pathname: "/chat", params: { userId } });
  const openGroupChat = (groupId) => router.push({ pathname: "/group-chat", params: { groupId } });

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

  const renderGroupChat = ({ item }) => {
    const name = item?.name || "Group Chat";
    const lastText = item?.lastMessage?.text || "";
    const time = item?.lastMessage?.createdAt ? new Date(item.lastMessage.createdAt).toLocaleString() : "";
    const participantCount = item?.participants?.length || 0;
    
    return (
      <TouchableOpacity style={s.convItem} onPress={() => openGroupChat(item._id)} activeOpacity={0.8}>
        <View style={s.groupAvatar}>
          <Ionicons name="people" size={20} color={GREEN} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.convName} numberOfLines={1}>{name}</Text>
          <Text style={s.convLast} numberOfLines={1}>
            {participantCount} participants • {lastText}
          </Text>
        </View>
        <View style={s.convMeta}>
          <Text style={s.convTime}>{time}</Text>
        </View>
      </TouchableOpacity>
    );
  };



  return (
    <View style={s.container}>
      <View style={s.header}>
        <View style={s.headerLeft}>
          <TouchableOpacity style={s.profileButton} onPress={() => router.push('/profile')}>
            <Ionicons name="person-circle-outline" size={32} color={GREEN} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Messages</Text>
        </View>
        <View style={s.headerRight}>
          <TouchableOpacity style={s.searchButton} onPress={() => router.push('/user-search')}>
            <Ionicons name="search-outline" size={24} color={GREEN} />
          </TouchableOpacity>
          <TouchableOpacity style={s.composeButton} onPress={() => router.push('/create-group')}>
            <Ionicons name="create-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={s.tabContainer}>
        <TouchableOpacity 
          style={[s.tab, activeTab === 'direct' && s.activeTab]} 
          onPress={() => setActiveTab('direct')}
        >
          <Text style={[s.tabText, activeTab === 'direct' && s.activeTabText]}>Direct Messages</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[s.tab, activeTab === 'groups' && s.activeTab]} 
          onPress={() => setActiveTab('groups')}
        >
          <Text style={[s.tabText, activeTab === 'groups' && s.activeTabText]}>Group Chats</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.loadingRow}><ActivityIndicator color={GREEN} /></View>
      ) : activeTab === 'direct' ? (
        conversations.length === 0 ? (
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
        )
      ) : (
        groupChats.length === 0 ? (
          <View style={s.emptyState}>
            <Ionicons name="people-outline" size={48} color={GRAY} />
            <Text style={s.emptyTitle}>No group chats yet</Text>
            <Text style={s.emptySubtitle}>Create a group chat to get started</Text>
          </View>
        ) : (
          <FlatList
            data={groupChats}
            keyExtractor={(item) => item._id}
            renderItem={renderGroupChat}
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
  header: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    paddingTop: 60, 
    paddingBottom: 20, 
    paddingHorizontal: 20, 
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  profileButton: { marginRight: 12 },
  headerTitle: { fontSize: 24, fontWeight: "700", color: "#111827" },
  searchButton: { 
    padding: 8, 
    borderRadius: 20, 
    backgroundColor: "#F3F4F6" 
  },
  composeButton: { 
    padding: 8, 
    borderRadius: 20, 
    backgroundColor: GREEN,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },

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

  // Tab styles
  tabContainer: { 
    flexDirection: "row", 
    backgroundColor: "#FFFFFF", 
    borderBottomWidth: 1, 
    borderBottomColor: BORDER 
  },
  tab: { 
    flex: 1, 
    paddingVertical: 16, 
    alignItems: "center", 
    borderBottomWidth: 2, 
    borderBottomColor: "transparent" 
  },
  activeTab: { 
    borderBottomColor: GREEN 
  },
  tabText: { 
    fontSize: 14, 
    fontWeight: "600", 
    color: GRAY 
  },
  activeTabText: { 
    color: GREEN 
  },

  // Group avatar
  groupAvatar: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: "#ECFDF5", 
    alignItems: "center", 
    justifyContent: "center", 
    marginRight: 12 
  },

});