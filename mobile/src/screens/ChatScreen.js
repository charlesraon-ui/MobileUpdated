import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useContext, useRef, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { AppCtx } from "../context/AppContext";
import { getMyMessagesApi, sendMessageApi, getDMThreadApi, sendDMMessageApi } from "../api/apiClient";

const GREEN = "#10B981";
const BORDER = "#E5E7EB";
const GRAY = "#6B7280";

export default function ChatScreen() {
  const { isLoggedIn } = useContext(AppCtx);
  const { userId: targetUserId } = useLocalSearchParams();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      const { data } = targetUserId ? await getDMThreadApi(String(targetUserId)) : await getMyMessagesApi();
      const list = Array.isArray(data?.messages) ? data.messages : [];
      setMessages(list);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 50);
    } catch (e) {
      // noop
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, targetUserId]);

  useFocusEffect(useCallback(() => { fetchMessages(); }, [fetchMessages]));

  const onSend = async () => {
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    try {
      const { data } = targetUserId ? await sendDMMessageApi(String(targetUserId), t) : await sendMessageApi(t);
      const msg = data?.message || null;
      if (msg) setMessages((prev) => [...(prev || []), msg]);
      setText("");
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    } catch (e) {
      // noop
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={s.header}>
        <Ionicons name="chatbubbles-outline" size={22} color="#FFFFFF" />
        <Text style={s.headerTitle}>{targetUserId ? "Chat" : "Live Chat"}</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView ref={scrollRef} style={s.list} contentContainerStyle={{ padding: 16 }}>
        {loading ? (
          <Text style={{ color: GRAY }}>Loading messages...</Text>
        ) : messages.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="chatbubble-ellipsis-outline" size={48} color={GRAY} />
            <Text style={s.emptyText}>Start a conversation with our support team.</Text>
          </View>
        ) : (
          messages.map((m) => {
            const mine = String(m?.senderRole || "customer") === "customer";
            return (
              <View key={m?._id || String(m.createdAt)} style={[s.bubble, mine ? s.mine : s.theirs]}>
                <Text style={s.bubbleText}>{m?.text}</Text>
                <Text style={s.bubbleMeta}>{new Date(m?.createdAt).toLocaleString()}</Text>
              </View>
            );
          })
        )}
        <View style={{ height: 8 }} />
      </ScrollView>
      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          placeholder="Type your message"
          placeholderTextColor={GRAY}
          value={text}
          onChangeText={setText}
          multiline
        />
        <TouchableOpacity style={[s.sendBtn, sending && { opacity: 0.6 }]} onPress={onSend} disabled={sending}>
          <Ionicons name="send" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { backgroundColor: GREEN, paddingTop: 50, paddingBottom: 16, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { color: "#FFFFFF", fontWeight: "800", fontSize: 18 },
  list: { flex: 1 },
  empty: { alignItems: "center", marginTop: 40, gap: 12 },
  emptyText: { color: GRAY, fontWeight: "600" },
  bubble: { maxWidth: "80%", borderRadius: 12, padding: 12, marginVertical: 6 },
  mine: { alignSelf: "flex-end", backgroundColor: "#DCFCE7", borderWidth: 1, borderColor: BORDER },
  theirs: { alignSelf: "flex-start", backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: BORDER },
  bubbleText: { color: "#111827", fontWeight: "600" },
  bubbleMeta: { marginTop: 6, fontSize: 10, color: GRAY },
  inputRow: { flexDirection: "row", alignItems: "center", padding: 12, borderTopWidth: 1, borderColor: BORDER, backgroundColor: "#FFFFFF", gap: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, backgroundColor: "#F3F4F6", color: "#111827" },
  sendBtn: { backgroundColor: GREEN, borderRadius: 12, padding: 12, alignItems: "center", justifyContent: "center" },
});