import { useContext, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import Toast from "../../components/Toast";
import { Colors } from "../../constants/theme";
import { AppCtx } from "../context/AppContext";
const placeholderColor = 'rgba(55, 65, 81, 0.5)';

export default function AddressesScreen() {
  const { addresses, addAddress, removeAddress, setDeliveryAddress, defaultAddress, setDefaultAddress } = useContext(AppCtx);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [confirmDeleteItem, setConfirmDeleteItem] = useState(null);
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");

  const formatAddress = () => `${street.trim()}, ${city.trim()}, ${province.trim()}`.trim();
  const add = async () => {
    if (!street.trim() || !city.trim() || !province.trim()) {
      setToastType("error");
      setToastMessage("Please fill Street, City, and Province.");
      setToastVisible(true);
      return;
    }
    const addr = formatAddress();
    if ((addresses || []).includes(addr)) {
      setToastType("error");
      setToastMessage("This address is already saved.");
      setToastVisible(true);
      return;
    }
    await addAddress(addr);
    setToastType("success");
    setToastMessage("Your address has been added.");
    setToastVisible(true);
    setStreet("");
    setCity("");
    setProvince("");
  };

  const useAddr = (item) => {
    setDeliveryAddress(item);
    setToastType("success");
    setToastMessage("This address will be used for delivery.");
    setToastVisible(true);
  };

  const setDefault = async (item) => {
    await setDefaultAddress(item);
    setToastType("success");
    setToastMessage("This address is now the default.");
    setToastVisible(true);
  };

  const deleteAddr = async (item) => {
    setConfirmDeleteItem(item);
  };

  const cancelDelete = () => setConfirmDeleteItem(null);
  const confirmDelete = async () => {
    if (!confirmDeleteItem) return;
    await removeAddress(confirmDeleteItem);
    setToastType("success");
    setToastMessage("The address has been removed.");
    setToastVisible(true);
    setConfirmDeleteItem(null);
  };

  return (
    <>
    <View style={s.container}>
      {/* Header with back button */}
      <View style={s.header}>
        <TouchableOpacity 
          style={s.backButton} 
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={s.title}>Manage Addresses</Text>
        <View style={s.placeholder} />
      </View>
      {/* Register-style inputs */}
      <Text style={s.label}>Street</Text>
      <TextInput
        value={street}
        onChangeText={setStreet}
        placeholder="123 Rizal St."
        placeholderTextColor={placeholderColor}
        style={s.input}
      />
      <Text style={s.label}>City</Text>
      <TextInput
        value={city}
        onChangeText={setCity}
        placeholder="Moncada"
        placeholderTextColor={placeholderColor}
        style={s.input}
      />
      <Text style={s.label}>Province</Text>
      <TextInput
        value={province}
        onChangeText={setProvince}
        placeholder="Tarlac"
        placeholderTextColor={placeholderColor}
        style={s.input}
      />

      <TouchableOpacity style={s.primaryBtn} onPress={add} activeOpacity={0.9}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="add-circle" size={18} color="#FFFFFF" />
          <Text style={s.primaryBtnText}>Save Address</Text>
        </View>
      </TouchableOpacity>

      <Text style={s.subTitle}>Saved Addresses</Text>

      <FlatList
        data={addresses || []}
        keyExtractor={(item, i) => i.toString()}
        ListEmptyComponent={() => (
          <Text style={s.emptyText}>No saved addresses yet. Add one above.</Text>
        )}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.itemRow}>
              <Text style={s.item}>🏠 {item}</Text>
              {String(defaultAddress || "") === String(item || "") && (
                <View style={s.defaultBadge}>
                  <Ionicons name="star" size={14} color={Colors.light.warning} style={{ marginRight: 4 }} />
                  <Text style={s.defaultBadgeText}>Default</Text>
                </View>
              )}
            </View>
            <View style={s.itemActions}>
              <TouchableOpacity
                style={s.useBtn}
                onPress={() => useAddr(item)}
                activeOpacity={0.85}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                  <Text style={s.useBtnText}>Use</Text>
                </View>
              </TouchableOpacity>
              {String(defaultAddress || "") !== String(item || "") && (
                <TouchableOpacity
                  style={s.defaultBtn}
                  onPress={() => setDefault(item)}
                  activeOpacity={0.85}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Ionicons name="star" size={16} color="#FFFFFF" />
                    <Text style={s.defaultBtnText}>Set Default</Text>
                  </View>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={s.deleteBtn}
                onPress={() => deleteAddr(item)}
                activeOpacity={0.85}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="trash" size={16} color="#FFFFFF" />
                  <Text style={s.deleteBtnText}>Delete</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>

    {/* Inline bottom sheet for delete confirmation */}
    {confirmDeleteItem ? (
      <View style={s.sheetOverlay} pointerEvents="box-none">
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={cancelDelete} />
        <View style={s.sheet}>
          <View style={s.sheetHeader}>
            <Ionicons name="trash" size={18} color={C.danger} />
            <Text style={s.sheetTitle}>Delete this address?</Text>
          </View>
          <Text style={s.sheetText} numberOfLines={2}>{confirmDeleteItem}</Text>
          <View style={s.sheetButtons}>
            <TouchableOpacity style={s.sheetCancelBtn} onPress={cancelDelete} activeOpacity={0.85}>
              <Text style={s.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.sheetDeleteBtn} onPress={confirmDelete} activeOpacity={0.85}>
              <Text style={s.sheetDeleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    ) : null}

    {/* Toast feedback */}
    <Toast
      visible={toastVisible}
      type={toastType}
      message={toastMessage}
      onClose={() => setToastVisible(false)}
      offset={24}
      duration={3000}
    />
    </>
  );
}

const C = Colors.light;
const s = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: C.surface },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
  },
  title: { fontSize: 20, fontWeight: "800", color: C.text, flex: 1, textAlign: "center" },
  placeholder: { width: 40 }, // To balance the header layout
  subTitle: { fontSize: 16, fontWeight: "700", marginTop: 12, color: C.text },
  label: { fontWeight: "700", color: C.muted, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: C.card,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    marginBottom: 8,
  },
  primaryBtn: {
    backgroundColor: C.accent,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  primaryBtnText: { color: "#FFFFFF", fontWeight: "700" },
  card: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  item: { fontSize: 16, marginTop: 8, flex: 1, marginRight: 10, color: C.text },
  emptyText: { color: C.muted, fontStyle: "italic", marginTop: 8 },
  itemActions: { flexDirection: "row", gap: 8 },
  useBtn: {
    backgroundColor: C.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  useBtnText: { color: "#FFFFFF", fontWeight: "700" },
  defaultBtn: {
    backgroundColor: C.warning,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  defaultBtnText: { color: "#FFFFFF", fontWeight: "700" },
  deleteBtn: {
    backgroundColor: C.danger,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  deleteBtnText: { color: "#FFFFFF", fontWeight: "700" },
  defaultBadge: {
    marginLeft: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  defaultBadgeText: { color: Colors.light.warning, fontWeight: "700" },
  sheetOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 1000,
    justifyContent: "flex-end",
  },
  backdrop: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.2)" },
  sheet: {
    backgroundColor: C.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sheetHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  sheetTitle: { fontWeight: "800", fontSize: 16, color: C.text },
  sheetText: { color: C.muted, marginBottom: 12 },
  sheetButtons: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  sheetCancelBtn: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  sheetCancelText: { color: C.muted, fontWeight: "700" },
  sheetDeleteBtn: { backgroundColor: C.danger, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  sheetDeleteText: { color: "#fff", fontWeight: "700" },
});
