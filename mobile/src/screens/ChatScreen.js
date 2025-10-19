import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useContext, useRef, useState, useEffect } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Image, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { AppCtx } from "../context/AppContext";
import { getMyMessagesApi, sendMessageApi, getDMThreadApi, sendDMMessageApi, getUserByIdApi, uploadDirectMessageImageFromUri } from "../api/apiClient";
import Avatar from "../components/Avatar";
import socketService from "../services/socketService";

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
  const [recipient, setRecipient] = useState(null);
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

  useFocusEffect(useCallback(() => { 
    fetchMessages(); 
    
    // Join DM room when screen is focused
    if (targetUserId && isLoggedIn) {
      socketService.joinDMRoom(targetUserId);
    }
    
    return () => {
      // Leave DM room when screen is unfocused
      if (targetUserId && isLoggedIn) {
        socketService.leaveDMRoom(targetUserId);
      }
    };
  }, [fetchMessages, targetUserId, isLoggedIn]));

  // Fetch recipient information when targetUserId changes
  useEffect(() => {
    const fetchRecipient = async () => {
      if (!targetUserId || !isLoggedIn) {
        setRecipient(null);
        return;
      }
      
      try {
        const { data } = await getUserByIdApi(String(targetUserId));
        setRecipient(data?.user || null);
      } catch (e) {
        console.warn("Failed to fetch recipient info:", e.message);
        setRecipient(null);
      }
    };

    fetchRecipient();
  }, [targetUserId, isLoggedIn]);

  // Set up real-time message listeners
  useEffect(() => {
    if (!targetUserId || !isLoggedIn) return;

    const handleNewMessage = (data) => {
      if (data.senderId === targetUserId || data.recipientId === targetUserId) {
        setMessages(prev => [...prev, data.message]);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
      }
    };

    const handleTyping = (data) => {
      // Handle typing indicator if needed
      console.log('User typing:', data);
    };

    socketService.on('new_dm_message', handleNewMessage);
    socketService.on('user_typing_dm', handleTyping);

    return () => {
      socketService.off('new_dm_message', handleNewMessage);
      socketService.off('user_typing_dm', handleTyping);
    };
  }, [targetUserId, isLoggedIn]);

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

  const pickImage = async () => {
    try {
      setSending(true);
      
      // Request permission only on native; web does not require
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission required", "Please allow photo library access");
          setSending(false);
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result?.canceled) {
        setSending(false);
        return;
      }

      const asset = (result?.assets || [])[0];
      if (!asset?.uri) {
        setSending(false);
        return;
      }

      // Upload the image first
      const uploadResponse = await uploadDirectMessageImageFromUri(asset);
      const imageUrl = uploadResponse?.imageUrl;
      
      if (!imageUrl) {
        throw new Error("Upload failed");
      }

      // Send the message with the image URL
      const { data } = targetUserId 
        ? await sendDMMessageApi(String(targetUserId), { imageUrl }) 
        : await sendMessageApi({ imageUrl });
      
      const msg = data?.message || null;
      if (msg) setMessages((prev) => [...(prev || []), msg]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
      
    } catch (e) {
      console.warn("Image upload error:", e?.message || e);
      Alert.alert("Error", "Failed to send image. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={s.header}>
        <TouchableOpacity style={s.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        {targetUserId && recipient ? (
          <>
            <Avatar 
              user={recipient} 
              size={32} 
              textStyle={{ color: "#FFFFFF", fontSize: 14, fontWeight: "600" }}
              style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
            />
            <View style={s.headerInfo}>
              <Text style={s.headerTitle}>{recipient.name || recipient.email}</Text>
              <Text style={s.headerSubtitle}>Online</Text>
            </View>
          </>
        ) : (
          <>
            <Ionicons name="chatbubbles-outline" size={22} color="#FFFFFF" />
            <Text style={s.headerTitle}>{targetUserId ? "Chat" : "Live Chat"}</Text>
          </>
        )}
        <View style={{ width: 24 }} />
      </View>
      <ScrollView ref={scrollRef} style={s.list} contentContainerStyle={{ padding: 16 }}>
        {loading ? (
          <Text style={{ color: GRAY }}>Loading messages...</Text>
        ) : messages.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="chatbubble-ellipsis-outline" size={48} color={GRAY} />
            <Text style={s.emptyText}>
              {targetUserId && recipient 
                ? `Start a chat with ${recipient.name || recipient.email}` 
                : "Start a conversation with our support team."}
            </Text>
          </View>
        ) : (
          messages.map((m) => {
            const mine = String(m?.senderRole || "customer") === "customer";
            return (
              <View key={m?._id || String(m.createdAt)} style={[s.bubble, mine ? s.mine : s.theirs]}>
                {m?.imageUrl && (
                  <Image 
                    source={{ uri: m.imageUrl }} 
                    style={s.messageImage}
                    resizeMode="cover"
                  />
                )}
                {m?.text && <Text style={s.bubbleText}>{m.text}</Text>}
                <Text style={s.bubbleMeta}>{new Date(m?.createdAt).toLocaleString()}</Text>
              </View>
            );
          })
        )}
        <View style={{ height: 8 }} />
      </ScrollView>
      <View style={s.inputRow}>
        <TouchableOpacity style={[s.imageBtn, sending && { opacity: 0.6 }]} onPress={pickImage} disabled={sending}>
          <Ionicons name="image" size={18} color={GREEN} />
        </TouchableOpacity>
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
  backButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255, 255, 255, 0.2)", alignItems: "center", justifyContent: "center" },
  headerInfo: { flex: 1 },
  headerTitle: { color: "#FFFFFF", fontWeight: "800", fontSize: 18 },
  headerSubtitle: { color: "rgba(255, 255, 255, 0.8)", fontSize: 12, fontWeight: "500" },
  list: { flex: 1 },
  empty: { alignItems: "center", marginTop: 40, gap: 12 },
  emptyText: { color: GRAY, fontWeight: "600" },
  bubble: { maxWidth: "80%", borderRadius: 12, padding: 12, marginVertical: 6 },
  mine: { alignSelf: "flex-end", backgroundColor: "#DCFCE7", borderWidth: 1, borderColor: BORDER },
  theirs: { alignSelf: "flex-start", backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: BORDER },
  bubbleText: { color: "#111827", fontWeight: "600" },
  bubbleMeta: { marginTop: 6, fontSize: 10, color: GRAY },
  inputRow: { flexDirection: "row", alignItems: "center", padding: 12, borderTopWidth: 1, borderColor: BORDER, backgroundColor: "#FFFFFF", gap: 8 },
  imageBtn: { borderWidth: 1, borderColor: GREEN, borderRadius: 12, padding: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  input: { flex: 1, borderWidth: 1, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, backgroundColor: "#F3F4F6", color: "#111827" },
  sendBtn: { backgroundColor: GREEN, borderRadius: 12, padding: 12, alignItems: "center", justifyContent: "center" },
  messageImage: { width: 200, height: 150, borderRadius: 8, marginBottom: 8 },
});