import { useEffect, useMemo, useRef } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Toast({ visible, type = "error", message = "", onClose, offset = 20, duration = 4000, autoHide = true, respectSafeArea = true }) {
  const insets = useSafeAreaInsets();
  const topOffset = (respectSafeArea ? (insets?.top || 0) : 0) + offset;
  const boxStyle = useMemo(() => [
    s.toast,
    { top: topOffset },
    type === "success" ? s.successBox : s.errorBox,
  ], [type, topOffset]);
  const textStyle = useMemo(() => [s.text, type === "success" ? s.successText : s.errorText], [type]);

  const timerRef = useRef(null);

  useEffect(() => {
    if (!autoHide) return;
    if (visible && message) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        onClose?.();
      }, duration);
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [visible, message, duration, autoHide, onClose]);

  if (!visible || !message) return null;
  return (
    <View style={boxStyle} pointerEvents="box-none">
      <Text style={textStyle} numberOfLines={3}>{message}</Text>
      <TouchableOpacity onPress={() => { if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; } onClose?.(); }} activeOpacity={0.8} style={s.closeBtn}>
        <Text style={s.closeTxt}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  toast: {
    position: "absolute",
    left: 20,
    right: 20,
    zIndex: 1000,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: { elevation: 6 },
      default: {},
    }),
    backgroundColor: "#fff",
  },
  errorBox: { backgroundColor: "#FEE2E2", borderColor: "#FCA5A5" },
  successBox: { backgroundColor: "#DCFCE7", borderColor: "#86EFAC" },
  text: { fontWeight: "600" },
  errorText: { color: "#B91C1C" },
  successText: { color: "#166534" },
  closeBtn: { marginLeft: 12, paddingHorizontal: 8, paddingVertical: 4 },
  closeTxt: { fontSize: 16, color: "#6B7280" },
});