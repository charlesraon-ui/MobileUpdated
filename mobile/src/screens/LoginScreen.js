import { Link } from "expo-router";
import { useContext, useState } from "react";
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
} from "react-native";
import { AppCtx } from "../context/AppContext";
import GoAgriLogo from "../../components/GoAgriLogo";

const { height } = Dimensions.get('window');
const placeholderColor = 'rgba(55, 65, 81, 0.5)';

export default function LoginScreen() {
  const { doLogin } = useContext(AppCtx);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing info", "Please enter your email and password.");
      return;
    }

    setSubmitting(true);
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
      Alert.alert("Login failed", msg);
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
          <Text style={s.title}>Welcome back</Text>

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
          style={[s.primaryBtn, (!email.trim() || !password) && s.btnDisabled]}
          onPress={onSubmit}
          disabled={!email.trim() || !password}
          activeOpacity={0.9}
        >
          <Text style={s.primaryBtnText}>Login</Text>
        </TouchableOpacity>
      )}

      <View style={{ height: 16 }} />

      <Text style={s.small}>
        Don’t have an account? <Link href="/register">Register</Link>
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
});