import { Link, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Dimensions,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
} from "react-native";
import GoAgriLogo from "../../components/GoAgriLogo";
import { requestPasswordReset, completePasswordReset } from "../api/apiClient";
import Toast from "../../components/Toast";

const { height } = Dimensions.get('window');
const placeholderColor = 'rgba(55, 65, 81, 0.5)';

export default function ForgotPasswordScreen() {
  const { token: tokenParam } = useLocalSearchParams();
  const token = String(tokenParam || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const onSubmit = async () => {
    if (token) {
      if (!password || password.length < 6) { setError("Please enter at least 6 characters."); setSuccess(""); return; }
      if (password !== confirm) { setError("Passwords do not match."); setSuccess(""); return; }
      setSubmitting(true);
      setError("");
      setSuccess("");
      try {
        await completePasswordReset(String(token), String(password));
        setSuccess("Password updated. You can now log in.");
      } catch (e) {
        setError(e?.response?.data?.message || "Reset failed. Try again.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const normalized = email.trim().toLowerCase();
    if (!normalized || !/^\S+@\S+\.\S+$/.test(normalized)) { setError("Please enter a valid email address."); setSuccess(""); return; }
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      await requestPasswordReset(normalized);
      setSuccess("If this email is registered, we’ll send password reset instructions.");
    } catch (e) {
      setError("Unable to request reset right now. Try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ImageBackground
      source={require("../../../assets/images/farm-landing-background.png")}
      style={s.bg}
      resizeMode="cover"
    >
      <View style={s.overlay} />
      <Toast visible={!!error} type="error" message={error} onClose={() => setError("")} offset={20} />
      <Toast visible={!!success} type="success" message={success} onClose={() => setSuccess("")} offset={78} />
      <ScrollView
        contentContainerStyle={s.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={s.card}>
          <View style={s.logoRow}>
            <GoAgriLogo width={32} height={32} />
            <Text style={s.brand}>GoAgri</Text>
          </View>
          <Text style={s.title}>{token ? "Set New Password" : "Forgot Password"}</Text>
          <Text style={s.helper}>
            {token
              ? "Enter and confirm your new password."
              : "Enter your email to receive reset instructions."}
          </Text>


          {token ? (
            <>
              <Text style={s.label}>New Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••"
                placeholderTextColor={placeholderColor}
                secureTextEntry
                style={s.input}
                editable={!submitting}
              />
              <View style={{ height: 8 }} />
              <Text style={s.label}>Confirm Password</Text>
              <TextInput
                value={confirm}
                onChangeText={setConfirm}
                placeholder="••••••"
                placeholderTextColor={placeholderColor}
                secureTextEntry
                style={s.input}
                editable={!submitting}
              />
              <View style={{ height: 12 }} />
              <TouchableOpacity
                style={[s.primaryBtn, submitting && s.btnDisabled]}
                onPress={onSubmit}
                disabled={submitting}
                activeOpacity={0.9}
              >
                <Text style={s.primaryBtnText}>{submitting ? "Updating…" : "Update Password"}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={s.label}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={placeholderColor}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={s.input}
                editable={!submitting}
              />
              <View style={{ height: 12 }} />
              <TouchableOpacity
                style={[s.primaryBtn, submitting && s.btnDisabled]}
                onPress={onSubmit}
                disabled={submitting}
                activeOpacity={0.9}
              >
                <Text style={s.primaryBtnText}>{submitting ? "Sending…" : "Send Reset Link"}</Text>
              </TouchableOpacity>
            </>
          )}

          <View style={{ height: 16 }} />

          {!token && (
            <Text style={s.small}>
              Remembered your password? <Link href="/login">Back to Login</Link>
            </Text>
          )}
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1, minHeight: height, overflow: "hidden" },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.3)" },
  container: { flex: 1, minHeight: height, padding: 20, justifyContent: "center" },
  card: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    maxWidth: 420,
    alignSelf: "center",
    width: "100%",
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  brand: { fontSize: 18, fontWeight: "800", color: "#065F46" },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 8, color: "#111827" },
  label: { fontWeight: "700", color: "#374151", marginTop: 8 },
  helper: { color: "#6B7280", fontSize: 12, marginTop: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  small: { color: "#6B7280", textAlign: "center" },
  primaryBtn: {
    backgroundColor: "#10B981",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  btnDisabled: { opacity: 0.6 },
  
});