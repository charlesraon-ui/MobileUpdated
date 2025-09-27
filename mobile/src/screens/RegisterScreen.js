// src/screens/RegisterScreen.js
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

export default function RegisterScreen() {
  const { doRegister } = useContext(AppCtx);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    if (!name.trim()) return "Please enter your name.";
    if (!email.trim()) return "Please enter your email.";
    // very light email check
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return "Please enter a valid email.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    if (password !== confirm) return "Passwords do not match.";
    return null;
  };

  const onSubmit = async () => {
    const err = validate();
    if (err) {
      Alert.alert("Invalid input", err);
      return;
    }
    setSubmitting(true);
    try {
      await doRegister({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      // success → AppContext redirects to /tabs/home
    } catch (e) {
      const status = e?.response?.status;
      const apiMsg = e?.response?.data?.message;
      const msg =
        status === 409
          ? "Email is already registered."
          : status === 400
          ? apiMsg || "Please check the information you entered."
          : "Unable to register right now. Please try again.";
      Alert.alert("Registration failed", msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>Create Account</Text>

      <Text style={s.label}>Full Name</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Juan Dela Cruz"
        autoCapitalize="words"
        style={s.input}
        editable={!submitting}
      />

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

      <Text style={s.label}>Confirm Password</Text>
      <TextInput
        value={confirm}
        onChangeText={setConfirm}
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
          <Text style={{ marginLeft: 8 }}>Creating your account…</Text>
        </View>
      ) : (
        <Button
          title="Register"
          onPress={onSubmit}
          disabled={!name.trim() || !email.trim() || !password || !confirm}
        />
      )}

      <View style={{ height: 16 }} />

      <Text style={s.small}>
        Already have an account? <Link href="/login">Login</Link>
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
