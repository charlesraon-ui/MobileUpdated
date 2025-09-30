import { Link } from "expo-router";
import { Image, StyleSheet, Text, View } from "react-native";

// Use a local asset so it always works offline and on all platforms
// If you don't have the file yet, add it to /assets/go-agri-logo.png
const logo = require("../assets/go-agri-logo.png");

// If you prefer a remote fallback, this domain is reliable:
// const REMOTE_LOGO = "https://placehold.co/160x160/png?text=Go+Agri";

export default function Landing() {
  return (
    <View style={s.container}>
      <View style={s.logoWrap}>
        <Image source={logo} style={s.logo} resizeMode="cover" />
      </View>

      <Text style={s.title}>Go Agri Trading</Text>
      <Text style={s.tagline}>
        Fresh produce and local farm goods at your fingertips.
      </Text>

      <View style={s.ctaRow}>
        <Link href="/login" style={[s.btn, s.primary]}>Login</Link>
        <Link href="/register" style={[s.btn, s.ghost]}>Register</Link>
      </View>

      <Text style={s.small}>or</Text>
      <Link href="/tabs/home" style={s.link}>Continue as guest</Link>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0FDF4",
  },
  logoWrap: {
    width: 140,
    height: 140,
    borderRadius: 28,
    backgroundColor: "#fff",
    marginBottom: 16,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  logo: { width: 120, height: 120 },
  title: { fontSize: 28, fontWeight: "800", color: "#065F46" },
  tagline: { marginTop: 8, color: "#374151", textAlign: "center" },
  ctaRow: { flexDirection: "row", gap: 12, marginTop: 20 },
  btn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    fontWeight: "700",
    overflow: "hidden",
    textAlign: "center",
  },
  primary: { backgroundColor: "#10B981", color: "white" },
  ghost: { backgroundColor: "white", color: "#065F46", borderWidth: 1, borderColor: "#10B981" },
  small: { marginTop: 16, color: "#6B7280" },
  link: { marginTop: 4, color: "#10B981", fontWeight: "700" },
});
