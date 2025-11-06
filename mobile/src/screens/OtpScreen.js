import { Link, useRouter } from "expo-router";
import { useContext, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import GoAgriLogo from "../../components/GoAgriLogo";
import Ionicons from "@expo/vector-icons/Ionicons";
import { AppCtx } from "../context/AppContext";

const { height } = Dimensions.get("window");
const placeholderColor = "rgba(55, 65, 81, 0.5)";
const topPad = Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 24 : 56;
const bottomPad = Platform.OS === "ios" ? 72 : 40;

export default function OtpScreen({ route }) {
  const router = useRouter();
  const { verifyRegisterOtp, doRegisterInitiate } = useContext(AppCtx);
  const initialEmail = useMemo(() => String(route?.params?.email || ""), [route?.params?.email]);
  const resendPayload = useMemo(() => ({
    name: String(route?.params?.name || ""),
    email: String(route?.params?.email || ""),
    phoneNumber: String(route?.params?.phoneNumber || ""),
    password: String(route?.params?.password || ""),
    address: String(route?.params?.address || ""),
  }), [route?.params?.name, route?.params?.email, route?.params?.phoneNumber, route?.params?.password, route?.params?.address]);

  const [email, setEmail] = useState(initialEmail);
  const [editingEmail, setEditingEmail] = useState(false);
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const inputsRef = useRef(Array.from({ length: 6 }, () => null));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);

  const code = digits.join("");

  const onVerify = async () => {
    const e = String(email || "").trim().toLowerCase();
    if (!e) { setError("Email is required."); return; }
    if (!code || code.length !== 6) { setError("Enter the 6-digit code."); return; }
    setSubmitting(true);
    setError("");
    try {
      await verifyRegisterOtp({ email: e, otp: code });
      // verifyRegisterOtp handles navigation to home on success
    } catch (err) {
      const status = err?.response?.status;
      const msg = status === 410
        ? "Code expired. Please re-register."
        : status === 401
        ? "Invalid code."
        : err?.response?.data?.message || "Unable to verify code.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDigitChange = (index, val) => {
    const char = val.replace(/\D/g, "").slice(0, 1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);
    if (char && index < inputsRef.current.length - 1) {
      inputsRef.current[index + 1]?.focus?.();
    }
  };

  const handleDigitKeyPress = (index, e) => {
    if (e?.nativeEvent?.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus?.();
      const next = [...digits];
      next[index - 1] = "";
      setDigits(next);
    }
  };

  const onResend = async () => {
    const e = String(email || "").trim().toLowerCase();
    if (!e) { setError("Email is required."); return; }
    if (!resendPayload?.name || !resendPayload?.password) {
      // If payload is incomplete, navigate back to register to re-enter details
      router.push({ pathname: "/register", params: { email: e } });
      return;
    }
    setResending(true);
    setError("");
    try {
      await doRegisterInitiate({ ...resendPayload, email: e });
      // doRegisterInitiate will send a fresh OTP; show a toast-like inline message
      setError("A new code was sent to your email.");
    } catch (err) {
      const msg = err?.response?.data?.message || "Unable to resend code.";
      setError(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ minHeight: height }} style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <View style={{ paddingTop: topPad, paddingBottom: bottomPad, paddingHorizontal: 20 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <Ionicons name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* Title */}
        <Text style={styles.title}>We sent a code to your email</Text>
        <Text style={styles.subtitle}>Enter the 6-digit code we sent to</Text>

        {/* Email display with edit */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          {editingEmail ? (
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="your@email.com"
              placeholderTextColor={placeholderColor}
              style={[styles.input, { width: "80%" }]}
            />
          ) : (
            <Text style={{ color: "#111827", fontSize: 16 }}>{email || "(add email)"}</Text>
          )}
          <TouchableOpacity onPress={() => setEditingEmail((s) => !s)} style={{ marginLeft: 8 }}>
            <Ionicons name={editingEmail ? "checkmark" : "pencil"} size={18} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Email-only flow: no phone display */}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* Segmented OTP inputs */}
        <View style={styles.otpRow}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={(el) => (inputsRef.current[i] = el)}
              value={d}
              onChangeText={(v) => handleDigitChange(i, v)}
              onKeyPress={(e) => handleDigitKeyPress(i, e)}
              keyboardType="numeric"
              maxLength={1}
              style={styles.otpBox}
              placeholder="-"
              placeholderTextColor={placeholderColor}
            />
          ))}
        </View>

        {/* Verify button */}
        <TouchableOpacity
          style={[styles.verifyBtn, submitting && styles.btnDisabled]}
          onPress={onVerify}
          disabled={submitting}
          activeOpacity={0.9}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.verifyText}>Verify</Text>}
        </TouchableOpacity>

        <View style={{ height: 12 }} />
        <Text style={styles.small}>
          Didn’t receive a code? <Text onPress={onResend} style={{ color: "#2563EB" }}>{resending ? "Sending…" : "Resend"}</Text>
        </Text>

        <View style={{ height: 16 }} />
        <Text style={styles.small}>Or go back to <Link href="/login">Login</Link></Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "700", color: "#111827", marginBottom: 4, textAlign: "center" },
  subtitle: { fontSize: 14, color: "#6B7280", marginBottom: 8, textAlign: "center" },
  label: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 6 },
  input: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D1D5DB",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: "#111827",
    marginBottom: 12,
  },
  otpRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8, marginBottom: 16 },
  otpBox: {
    width: 48,
    height: 56,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "600",
    backgroundColor: "#FFFFFF",
    borderColor: "#C7D2FE",
    borderWidth: 2,
    borderRadius: 12,
    color: "#111827",
  },
  verifyBtn: { backgroundColor: "#6366F1", paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  verifyText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  btnDisabled: { opacity: 0.6 },
  small: { fontSize: 12, color: "#6B7280", textAlign: "center" },
  error: { backgroundColor: "#FEE2E2", color: "#B91C1C", padding: 8, borderRadius: 8, marginBottom: 12, textAlign: "center" },
});