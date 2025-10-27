// src/screens/RegisterScreen.js
import { Link } from "expo-router";
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
import { Ionicons } from '@expo/vector-icons';
import { AppCtx } from "../context/AppContext";
import GoAgriLogo from "../../components/GoAgriLogo";
import Toast from "../../components/Toast";

const { height } = Dimensions.get('window');
const placeholderColor = 'rgba(55, 65, 81, 0.5)';
// Dynamic top padding to avoid content hidden under status bar/notch
const topPad = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 24 : 56;
// Bottom padding to ensure last element is reachable across devices
const bottomPad = Platform.OS === 'ios' ? 72 : 40;

export default function RegisterScreen() {
  const { doRegisterInitiate } = useContext(AppCtx);

  // Name fields
  const [firstName, setFirstName] = useState("");
  const [middleInitial, setMiddleInitial] = useState("");
  const [lastName, setLastName] = useState("");

  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const validate = () => {
    if (!firstName.trim()) return "Please enter your first name.";
    if (/\d/.test(firstName.trim())) return "First name should not contain numbers.";
    if (!lastName.trim()) return "Please enter your last name.";
    if (/\d/.test(lastName.trim())) return "Last name should not contain numbers.";
    if (!email.trim()) return "Please enter your email.";
    // very light email check
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return "Please enter a valid email.";
    if (!phoneNumber.trim()) return "Please enter your phone number.";
    // Basic phone number validation (Philippine format)
    if (!/^(\+63|0)?[0-9]{10}$/.test(phoneNumber.replace(/\s|-/g, ''))) {
      return "Please enter a valid phone number.";
    }
    if (password.length < 6) return "Password must be at least 6 characters.";
    if (password !== confirm) return "Passwords do not match.";
    return null;
  };

  const onSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setSubmitting(true);
    setError("");
    try {
      const name = `${firstName.trim()}${middleInitial.trim() ? " " + middleInitial.trim() + "." : ""} ${lastName.trim()}`.trim();

      await doRegisterInitiate({
        name,
        email: email.trim().toLowerCase(),
        phoneNumber: phoneNumber.trim(),
        password,
      });
      // AppContext will alert and route to Login with instructions
    } catch (e) {
      const status = e?.response?.status;
      const apiMsg = e?.response?.data?.message;
      const msg =
        status === 409
          ? "Email is already registered."
          : status === 400
          ? apiMsg || "Please check the information you entered."
          : "Unable to register right now. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ImageBackground
      source={require("../../assets/images/react-logo.png")}
      style={s.bg}
      resizeMode="cover"
    >
      <View style={s.overlay} />
      <Toast visible={!!error} type="error" message={error} onClose={() => setError("")} />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.container}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="always"
        scrollIndicatorInsets={{ bottom: bottomPad }}
        showsVerticalScrollIndicator={true}
      >
        <View style={s.card}>
          <View style={s.logoRow}>
          <GoAgriLogo width={48} height={48} />
          <Text style={s.brand}>Go Agri Trading</Text>
        </View>
        <Text style={s.title}>Create Account</Text>

      <Text style={s.label}>First Name</Text>
      <TextInput
        value={firstName}
        onChangeText={setFirstName}
        placeholder="Juan"
        placeholderTextColor={placeholderColor}
        autoCapitalize="words"
        style={s.input}
        editable={!submitting}
      />

      <Text style={s.label}>Middle Initial (optional)</Text>
      <TextInput
        value={middleInitial}
        onChangeText={(v) => setMiddleInitial(v.slice(0, 1))}
        placeholder="M"
        placeholderTextColor={placeholderColor}
        autoCapitalize="characters"
        style={s.input}
        editable={!submitting}
        maxLength={1}
      />

      <Text style={s.label}>Last Name</Text>
      <TextInput
        value={lastName}
        onChangeText={setLastName}
        placeholder="Dela Cruz"
        placeholderTextColor={placeholderColor}
        autoCapitalize="words"
        style={s.input}
        editable={!submitting}
      />

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

      <Text style={s.label}>Phone Number</Text>
      <TextInput
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        placeholder="09123456789"
        placeholderTextColor={placeholderColor}
        keyboardType="phone-pad"
        autoCapitalize="none"
        style={s.input}
        editable={!submitting}
      />

      <Text style={s.label}>Password</Text>
      <View style={s.passwordContainer}>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor={placeholderColor}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          style={s.passwordInput}
          editable={!submitting}
        />
        <TouchableOpacity
          style={s.eyeButton}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Ionicons
            name={showPassword ? "eye-off" : "eye"}
            size={20}
            color="rgba(55, 65, 81, 0.7)"
          />
        </TouchableOpacity>
      </View>

      <Text style={s.label}>Confirm Password</Text>
      <View style={s.passwordContainer}>
        <TextInput
          value={confirm}
          onChangeText={setConfirm}
          placeholder="••••••••"
          placeholderTextColor={placeholderColor}
          secureTextEntry={!showConfirmPassword}
          autoCapitalize="none"
          style={s.passwordInput}
          editable={!submitting}
        />
        <TouchableOpacity
          style={s.eyeButton}
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
        >
          <Ionicons
            name={showConfirmPassword ? "eye-off" : "eye"}
            size={20}
            color="rgba(55, 65, 81, 0.7)"
          />
        </TouchableOpacity>
      </View>

      <View style={{ height: 12 }} />

      {submitting ? (
        <View style={s.loading}>
          <ActivityIndicator />
          <Text style={{ marginLeft: 8 }}>Creating your account…</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[s.primaryBtn, submitting && s.btnDisabled]}
          onPress={onSubmit}
          disabled={submitting}
          activeOpacity={0.9}
        >
          <Text style={s.primaryBtnText}>Register</Text>
        </TouchableOpacity>
      )}

      <View style={{ height: 16 }} />

      <Text style={s.small}>
        Already have an account? <Link href="/login">Login</Link>
      </Text>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1, minHeight: height, overflow: "hidden" },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.3)" },
  scroll: { flex: 1 },
  container: { paddingHorizontal: 20, paddingTop: topPad, paddingBottom: bottomPad },
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
    maxWidth: 520,
    alignSelf: "center",
    width: "100%",
  },
  logoRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8, paddingTop: 6, width: "100%" },
  brand: { fontSize: 18, lineHeight: 22, fontWeight: "800", color: "#065F46" },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 16, color: "#111827" },
  sectionLabel: { fontWeight: "800", color: "#111827", marginTop: 12 },
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
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  small: { color: "#6B7280", textAlign: "center" },
  helper: { color: "#6B7280", fontSize: 12, marginTop: 6 },
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
  divider: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  dividerText: {
    color: "#6B7280",
    fontSize: 14,
    paddingHorizontal: 16,
    fontWeight: "500",
  },
  
});
