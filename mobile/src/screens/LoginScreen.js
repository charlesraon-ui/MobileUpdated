import { Link, useRouter } from "expo-router";
import { useContext, useState } from "react";
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
  View
} from "react-native";
import GoAgriLogo from "../../components/GoAgriLogo";
import Toast from "../../components/Toast";
import { ResponsiveUtils } from "../../constants/theme";
import { AppCtx } from "../context/AppContext";

const { height } = Dimensions.get('window');
const placeholderColor = 'rgba(55, 65, 81, 0.5)';
// Dynamic top padding to avoid content hidden under status bar/notch
const topPad = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 24 : 56;

export default function LoginScreen() {
  const { doLogin } = useContext(AppCtx);
  const router = useRouter();
  const { width } = Dimensions.get('window');

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

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

  const s = StyleSheet.create({
    bg: { flex: 1, minHeight: height, overflow: "hidden", backgroundColor: "#A7F3D0" },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)" },
    container: { 
      flex: 1, 
      minHeight: height, 
      padding: 20, 
      paddingTop: topPad, 
      justifyContent: "center" 
    },
    card: {
      backgroundColor: "rgba(255,255,255,0.98)",
      borderRadius: 20,
      padding: 24,
      paddingTop: 28,
      ...Platform.select({
        default: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.2,
          shadowRadius: 20,
        },
        android: { elevation: 10 },
      }),
      maxWidth: 420,
      alignSelf: "center",
      width: "100%",
    },
    logoRow: { 
      flexDirection: "row", 
      alignItems: "center", 
      justifyContent: "center", 
      gap: 12, 
      marginBottom: 12, 
      paddingTop: 8, 
      width: "100%" 
    },
    brand: { 
      fontSize: ResponsiveUtils.isTablet(width) ? 24 : 20, 
      lineHeight: ResponsiveUtils.isTablet(width) ? 28 : 24, 
      fontWeight: "800", 
      color: "#065F46",
      letterSpacing: 0.5,
    },
    title: { 
      fontSize: ResponsiveUtils.isTablet(width) ? 32 : 28, 
      fontWeight: "900", 
      marginBottom: 8, 
      color: "#111827",
      textAlign: "center",
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: ResponsiveUtils.isTablet(width) ? 18 : 16,
      color: "#6B7280",
      textAlign: "center",
      marginBottom: 32,
      lineHeight: 22,
    },
    formContainer: {
      gap: 20,
    },
    inputGroup: {
      gap: 8,
    },
    label: { 
      fontWeight: "600", 
      color: "#374151", 
      fontSize: ResponsiveUtils.isTablet(width) ? 17 : 15,
      marginLeft: 4,
    },
    input: {
      borderWidth: 2,
      borderColor: "#E5E7EB",
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: "#FFFFFF",
      fontSize: ResponsiveUtils.isTablet(width) ? 18 : 16,
      ...Platform.select({
        default: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
        android: { elevation: 2 },
      }),
    },
    inputFocused: {
      borderColor: "#10B981",
      shadowColor: "#10B981",
      shadowOpacity: 0.15,
    },
    small: { 
      color: "#6B7280", 
      textAlign: "center",
      fontSize: ResponsiveUtils.isTablet(width) ? 16 : 14,
      lineHeight: 20,
    },
    link: {
      color: "#10B981",
      fontWeight: "600",
    },
    loading: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 16,
      gap: 12,
    },
    loadingText: {
      color: "#6B7280",
      fontSize: ResponsiveUtils.isTablet(width) ? 18 : 16,
      fontWeight: "500",
    },
    primaryBtn: {
      backgroundColor: "#10B981",
      paddingVertical: 16,
      borderRadius: 14,
      alignItems: "center",
      ...Platform.select({
        default: {
          shadowColor: "#10B981",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        android: { elevation: 4 },
      }),
    },
    primaryBtnText: { 
      color: "#FFFFFF", 
      fontSize: ResponsiveUtils.isTablet(width) ? 19 : 17, 
      fontWeight: "700",
      letterSpacing: 0.5,
    },
    btnDisabled: { opacity: 0.6 },
    guestBtn: {
      backgroundColor: "#F9FAFB",
      borderWidth: 2,
      borderColor: "#E5E7EB",
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: "center",
      ...Platform.select({
        default: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
        },
        android: { elevation: 2 },
      }),
    },
    guestBtnText: { 
      color: "#6B7280", 
      fontSize: ResponsiveUtils.isTablet(width) ? 18 : 16, 
      fontWeight: "600" 
    },
    linksContainer: {
      marginTop: 24,
      gap: 12,
      alignItems: "center",
    },
  });

  return (
    <View style={s.bg}>
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
            <GoAgriLogo width={52} height={52} />
            <Text style={s.brand}>Go Agri Trading</Text>
          </View>
          
          <Text style={s.title}>Welcome back</Text>
          <Text style={s.subtitle}>Sign in to your account to continue</Text>

          <View style={s.formContainer}>
            <View style={s.inputGroup}>
              <Text style={s.label}>Email Address</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor={placeholderColor}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={[s.input, emailFocused && s.inputFocused]}
                editable={!submitting}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>

            <View style={s.inputGroup}>
              <Text style={s.label}>Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor={placeholderColor}
                secureTextEntry
                autoCapitalize="none"
                style={[s.input, passwordFocused && s.inputFocused]}
                editable={!submitting}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
            </View>

            {submitting ? (
              <View style={s.loading}>
                <ActivityIndicator size="small" color="#10B981" />
                <Text style={s.loadingText}>Signing you in…</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[s.primaryBtn, submitting && s.btnDisabled]}
                onPress={onSubmit}
                disabled={submitting}
                activeOpacity={0.8}
              >
                <Text style={s.primaryBtnText}>Sign In</Text>
              </TouchableOpacity>
            )}

            {/* Guest Option */}
            <TouchableOpacity
              style={s.guestBtn}
              onPress={() => router.replace("/tabs/home")}
              activeOpacity={0.8}
            >
              <Text style={s.guestBtnText}>Continue as Guest</Text>
            </TouchableOpacity>
          </View>

          <View style={s.linksContainer}>
            <View style={{ alignItems: "center" }}>
              <Text style={s.small}>Don't have an account?</Text>
              <Link href="/register" asChild>
                <Text style={StyleSheet.flatten([s.small, s.link])}>Sign up</Text>
              </Link>
            </View>

            <View style={{ alignItems: "center", marginTop: 6 }}>
              <Link href="/forgot-password" asChild>
                <Text style={StyleSheet.flatten([s.small, s.link])}>Forgot password?</Text>
              </Link>
            </View>

            <View style={{ alignItems: "center", marginTop: 6 }}>
              <Link href="/landing" asChild>
                <Text style={StyleSheet.flatten([s.small, s.link])}>← Back to landing</Text>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}