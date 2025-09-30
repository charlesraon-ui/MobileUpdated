// src/screens/LoginScreen.js
import { Link } from "expo-router";
import { useContext, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AppCtx } from "../context/AppContext";

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
      // Optional: console.debug(e?.response?.data || e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>Login</Text>

      <Text style={s.label}>Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
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
        <Button
          title="Login"
          onPress={onSubmit}
          disabled={!email.trim() || !password}
        />
      )}

      <View style={{ height: 16 }} />

      <Text style={s.small}>
        Don’t have an account? <Link href="/register">Register</Link>
      </Text>

      <View style={{ height: 8 }} />
      <Text style={s.small}>
        <Link href="/landing">Back to landing</Link>
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  title: { fontSize: 24, fontWeight: "800", marginBottom: 16, textAlign: "center" },
  label: { fontWeight: "700", color: "#374151", marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "white",
  },
  small: { color: "#6B7280", textAlign: "center" },
  loading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
