import { Link, useRouter } from "expo-router";
import { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ImageBackground,
  TouchableOpacity,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
  Platform,
  StatusBar,
} from "react-native";
import Constants from "expo-constants";
import { AppCtx } from "../context/AppContext";
import GoAgriLogo from "../../components/GoAgriLogo";
import Toast from "../../components/Toast";

const { height } = Dimensions.get('window');
const placeholderColor = 'rgba(55, 65, 81, 0.5)';
// Dynamic top padding to avoid content hidden under status bar/notch
const topPad = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 24 : 56;

export default function LoginScreen() {
  const { doLogin } = useContext(AppCtx);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const validate = () => {
    const e = email.trim().toLowerCase();
    if (!e || !password) return "Please enter your email and password.";
    if (!/^\S+@\S+\.\S+$/.test(e)) return "Please enter a valid email address.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    return null;
  };

  const onSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }

    setSubmitting(true);
    setError("");
    try {
      await doLogin({ email: email.trim(), password });
      // success: AppContext will redirect to /tabs/home
    } catch (e) {
      const status = e?.response?.status;
      const msg =
        status === 401
          ? "Invalid email or password."
          : status === 400
          ? e?.response?.data?.message || "Please check your input."
          : "Unable to login right now. Please try again.";
      setError(msg);
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
      <Toast visible={!!error} type="error" message={error} onClose={() => setError("")} />
      <ScrollView
        contentContainerStyle={s.container}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="always"
        showsVerticalScrollIndicator={false}
      >
        <View style={s.card}>
          <View style={s.logoRow}>
            <GoAgriLogo width={48} height={48} />
          <Text style={s.brand}>Go Agri Trading</Text>
        </View>
        <Text style={s.title}>Welcome back</Text>
        {/* Inline error banner replaced by sticky toast */}

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

      <Text style={s.label}>Password</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••"
        placeholderTextColor={placeholderColor}
        secureTextEntry
        autoCapitalize="none"
        style={s.input}
        editable={!submitting}
      />

      <View style={{ height: 12 }} />

      {submitting ? (
        <View style={s.loading}>
          <ActivityIndicator />
          <Text style={{ marginLeft: 8 }}>Signing you in…</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[s.primaryBtn, submitting && s.btnDisabled]}
          onPress={onSubmit}
          disabled={submitting}
          activeOpacity={0.9}
        >
          <Text style={s.primaryBtnText}>Login</Text>
        </TouchableOpacity>
      )}

      <View style={{ height: 16 }} />

      {/* Maybe Later - Guest Option */}
      <TouchableOpacity
        style={s.guestBtn}
        onPress={() => router.replace("/tabs/home")}
        activeOpacity={0.9}
      >
        <Text style={s.guestBtnText}>Maybe Later (Continue as Guest)</Text>
      </TouchableOpacity>

      <View style={{ height: 16 }} />

      <Text style={s.small}>
        Don't have an account? <Link href="/register">Register</Link>
      </Text>

      <View style={{ height: 8 }} />
      <Text style={s.small}>
        <Link href="/forgot-password">Forgot password?</Link>
      </Text>

        <View style={{ height: 8 }} />
        <Text style={s.small}>
          <Link href="/landing">Back to landing</Link>
        </Text>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1, minHeight: height, overflow: "hidden" },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.3)" },
  container: { flex: 1, minHeight: height, padding: 20, paddingTop: topPad, justifyContent: "center" },
  card: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 16,
    padding: 20,
    paddingTop: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    maxWidth: 420,
    alignSelf: "center",
    width: "100%",
  },
  logoRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8, paddingTop: 6, width: "100%" },
  brand: { fontSize: 18, lineHeight: 22, fontWeight: "800", color: "#065F46" },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 16, color: "#111827" },
  label: { fontWeight: "700", color: "#374151", marginTop: 8 },
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
  loading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
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
  guestBtn: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  guestBtnText: { color: "#6B7280", fontSize: 15, fontWeight: "600" },
  
});