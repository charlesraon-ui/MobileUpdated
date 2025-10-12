import * as ImagePicker from "expo-image-picker";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Image, Modal } from "react-native";
import { getOrderRefundStatus, uploadRefundImagesFromUris, createRefundTicketApi, toAbsoluteUrl } from "../../src/api/apiClient";

const GREEN = "#10B981";
const GREEN_BG = "#ECFDF5";
const GREEN_BORDER = "#A7F3D0";
const GREEN_DARK = "#065F46";
const BORDER = "#E5E7EB";
const GRAY = "#6B7280";

export default function RefundRequestScreen() {
  const { orderId } = useLocalSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [hasRefund, setHasRefund] = useState(false);
  const [existingTicketId, setExistingTicketId] = useState(null);
  const [refundStatus, setRefundStatus] = useState(null);
  const [reason, setReason] = useState("");
  const [images, setImages] = useState([]); // [{ uri, fileName, type }]
  const [submitting, setSubmitting] = useState(false);
  const [viewer, setViewer] = useState({ visible: false, uri: null });

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getOrderRefundStatus(orderId);
        setOrder(data?.order);
        setHasRefund(Boolean(data?.order?.hasRefundRequest));
        setExistingTicketId(data?.order?.refundTicketId || null);
        setRefundStatus(data?.order?.refundStatus || null);
      } catch (e) {
        console.warn("refund status fetch failed:", e?.message);
        Alert.alert("Error", "Failed to load order refund status.");
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  const canRequestRefund = useMemo(() => {
    const status = String(order?.status || "").toLowerCase();
    const allowed = ["pending", "confirmed", "completed", "delivered", "ready"]; // allow READY status
    return !hasRefund && allowed.includes(status);
  }, [order, hasRefund]);

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Allow photo library access to upload evidence.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 5,
      quality: 0.8,
    });
    if (!res.canceled) {
      const picked = (res.assets || []).map((a) => ({ uri: a.uri, fileName: a.fileName || "photo.jpg", type: a.mimeType || "image/jpeg" }));
      setImages((prev) => [...prev, ...picked].slice(0, 5));
    }
  };

  const submitRefund = async () => {
    if (!canRequestRefund) return;
    if (String(reason).trim().length < 10) {
      Alert.alert("Reason too short", "Please provide at least 10 characters.");
      return;
    }
    setSubmitting(true);
    try {
      let attachments = [];
      if (images.length) {
        const uploadResp = await uploadRefundImagesFromUris(images);
        attachments = Array.isArray(uploadResp?.urls) ? uploadResp.urls : [];
      }
      const { data } = await createRefundTicketApi({ orderId, reason, attachments });
      Alert.alert("Refund submitted", "Your request has been submitted.");
      router.replace(`/refund/my-tickets`);
    } catch (e) {
      console.warn("refund submit failed:", e?.message);
      Alert.alert("Error", e?.response?.data?.message || e?.message || "Failed to submit refund.");
    } finally {
      setSubmitting(false);
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <View style={s.centered}> 
        <ActivityIndicator size="large" color={GREEN} />
        <Text style={{ marginTop: 12, color: GRAY }}>Loading order…</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={s.centered}>
        <Text style={{ color: GRAY }}>Order not found.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <Stack.Screen options={{ title: "Request Refund" }} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={s.card}>
          <Text style={s.title}>Order #{String(order._id).slice(-8).toUpperCase()}</Text>
          <Text style={s.subtle}>Status: {String(order.status || "pending").toUpperCase()}</Text>
          <Text style={s.subtle}>Total: ₱{Number(order.total || 0).toFixed(2)}</Text>
        </View>

        {hasRefund ? (
          <View style={[s.card, { borderColor: BORDER }]}> 
            <Text style={s.title}>Refund already requested</Text>
            <Text style={s.subtle}>Ticket: {existingTicketId}</Text>
            <Text style={s.subtle}>Status: {String(refundStatus || "requested").toUpperCase()}</Text>
            <TouchableOpacity style={[s.btn, { backgroundColor: GREEN }]} onPress={() => router.replace(`/refund/my-tickets`)}>
              <Text style={s.btnTextLight}>View My Tickets</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.card}>
            <Text style={s.title}>Describe the issue</Text>
            <TextInput
              style={s.input}
              placeholder="E.g. Wrong item received, damaged on arrival…"
              placeholderTextColor="rgba(107,114,128,0.5)"
              multiline
              value={reason}
              onChangeText={setReason}
            />

            {/* Images */}
            <View style={{ marginTop: 12 }}>
              <Text style={s.subtle}>Optional: upload up to 5 photos</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {images.map((img, idx) => (
                  <View key={idx} style={{ width: 80, height: 80 }}>
                    <TouchableOpacity style={{ width: 80, height: 80 }} onPress={() => setViewer({ visible: true, uri: img.uri })}>
                      <Image source={{ uri: img.uri }} style={{ width: 80, height: 80, borderRadius: 8 }} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => removeImage(idx)} style={s.removeBadge}>
                      <Text style={s.removeBadgeText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
              <TouchableOpacity style={[s.btn, { backgroundColor: GREEN_BG, borderColor: GREEN_BORDER, borderWidth: 1 }]} onPress={pickImages}>
                <Text style={[s.btnText, { color: GREEN_DARK }]}>Add Photos</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity disabled={!canRequestRefund || submitting} style={[s.btn, { backgroundColor: canRequestRefund ? GREEN : GRAY }]} onPress={submitRefund}>
              <Text style={s.btnTextLight}>{submitting ? "Submitting…" : "Submit Refund Request"}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[s.btn, { backgroundColor: "#374151" }]} onPress={() => router.replace(`/orders`)}>
              <Text style={s.btnTextLight}>Back to Orders</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      {/* Fullscreen Image Viewer */}
      <Modal visible={viewer.visible} transparent animationType="fade" onRequestClose={() => setViewer({ visible: false, uri: null })}>
        <View style={s.viewerBackdrop}>
          <TouchableOpacity style={s.viewerClose} onPress={() => setViewer({ visible: false, uri: null })}>
            <Text style={s.btnTextLight}>Close</Text>
          </TouchableOpacity>
          {viewer.uri ? (
            <Image source={{ uri: viewer.uri }} style={s.viewerImage} resizeMode="contain" />
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: GREEN_BORDER,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  title: { fontSize: 16, fontWeight: "700", color: "#111827" },
  subtle: { fontSize: 14, color: GRAY, marginTop: 6 },
  input: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    textAlignVertical: "top",
  },
  btn: { marginTop: 16, paddingVertical: 14, borderRadius: 10, alignItems: "center" },
  btnText: { fontSize: 14, fontWeight: "700" },
  btnTextLight: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  removeBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#EF4444",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  removeBadgeText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16, lineHeight: 16 },
  viewerBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.9)", alignItems: "center", justifyContent: "center" },
  viewerImage: { width: "90%", height: "80%" },
  viewerClose: { position: "absolute", top: 40, right: 20, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#111827", borderRadius: 8 },
});