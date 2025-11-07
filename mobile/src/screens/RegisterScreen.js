// src/screens/RegisterScreen.js
import { useRouter } from "expo-router";
import { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  TouchableOpacity,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
  Platform,
  StatusBar,
  Modal,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { AppCtx } from "../context/AppContext";
import psgc from "../services/psgcService";
import GoAgriLogo from "../../components/GoAgriLogo";
import Toast from "../../components/Toast";

const { height } = Dimensions.get('window');
const placeholderColor = 'rgba(55, 65, 81, 0.5)';
// Dynamic top padding to avoid content hidden under status bar/notch
const topPad = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 24 : 56;
// Bottom padding to ensure last element is reachable across devices
const bottomPad = Platform.OS === 'ios' ? 72 : 40;

export default function RegisterScreen() {
  const router = useRouter();
  const { doRegisterInitiate, verifyRegisterOtp } = useContext(AppCtx);

  // Name fields
  const [firstName, setFirstName] = useState("");
  const [middleInitial, setMiddleInitial] = useState("");
  const [lastName, setLastName] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // PSGC address state
  const [province, setProvince] = useState(null);
  const [cityMun, setCityMun] = useState(null);
  const [barangay, setBarangay] = useState(null);
  const [street, setStreet] = useState("");
  const [provinces, setProvinces] = useState([]);
  const [citiesMunicipalities, setCitiesMunicipalities] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [loadingAddr, setLoadingAddr] = useState(false);
  const [showProvinceModal, setShowProvinceModal] = useState(false);
  const [showCityMunModal, setShowCityMunModal] = useState(false);
  const [showBarangayModal, setShowBarangayModal] = useState(false);
  // OTP state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSubmitting, setOtpSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoadingAddr(true);
        const list = await psgc.getProvinces();
        setProvinces(list);
      } catch (e) {
        console.warn("PSGC provinces load failed:", e?.message);
      } finally {
        setLoadingAddr(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const code = province?.code;
      if (!code) { setCitiesMunicipalities([]); setCityMun(null); setBarangays([]); setBarangay(null); return; }
      try {
        setLoadingAddr(true);
        const list = await psgc.getCitiesAndMunicipalities(code);
        setCitiesMunicipalities(list);
        setCityMun(null);
        setBarangays([]);
        setBarangay(null);
      } catch (e) {
        console.warn("PSGC cities/municipalities load failed:", e?.message);
      } finally {
        setLoadingAddr(false);
      }
    })();
  }, [province?.code]);

  useEffect(() => {
    (async () => {
      const code = cityMun?.code;
      if (!code) { setBarangays([]); setBarangay(null); return; }
      try {
        setLoadingAddr(true);
        const list = await psgc.getBarangaysByParent(code);
        setBarangays(list);
        setBarangay(null);
      } catch (e) {
        console.warn("PSGC barangays load failed:", e?.message);
      } finally {
        setLoadingAddr(false);
      }
    })();
  }, [cityMun?.code]);

  const validate = () => {
    if (!firstName.trim()) return "Please enter your first name.";
    if (/\d/.test(firstName.trim())) return "First name should not contain numbers.";
    if (!lastName.trim()) return "Please enter your last name.";
    if (/\d/.test(lastName.trim())) return "Last name should not contain numbers.";
    if (!email.trim()) return "Please enter your email.";
    // very light email check
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return "Please enter a valid email.";
    // Phone number is not required in email-only registration.
    if (password.length < 6) return "Password must be at least 6 characters.";
    if (password !== confirm) return "Passwords do not match.";
    if (!province?.code) return "Please select your province.";
    if (!cityMun?.code) return "Please select your city/municipality.";
    if (!barangay?.code) return "Please select your barangay.";
    if (!street.trim()) return "Please enter your street or house number.";
    return null;
  };

  const onSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setSubmitting(true);
    setError("");
    try {
      const name = `${firstName.trim()}${middleInitial.trim() ? " " + middleInitial.trim() + "." : ""} ${lastName.trim()}`.trim();

      const address = [
        street.trim(),
        barangay?.name,
        cityMun?.name,
        province?.name,
      ].filter(Boolean).join(", ");

      const payload = {
        name,
        email: email.trim().toLowerCase(),
        password,
        address,
      };
      const data = await doRegisterInitiate(payload);
      if (data?.otpRequired) {
        const e = payload.email;
        // Pass full payload so OTP screen can support "Resend code"
        // Also pass debugOtp if backend provided it (for dev/testing)
        router.push({ pathname: "/otp", params: { email: e, name: payload.name, password: payload.password, address: payload.address, debugOtp: String(data?.debugOtp || "") } });
      }
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

  const submitOtp = async () => {
    if (!otpCode || otpCode.length !== 6) { setError("Please enter the 6-digit code."); return; }
    setOtpSubmitting(true);
    try {
      await verifyRegisterOtp({ email: otpEmail, otp: otpCode });
      setShowOtpModal(false);
    } catch (e) {
      const status = e?.response?.status;
      const msg = status === 410 ? "Code expired. Please re-register." : status === 401 ? "Invalid code." : e?.response?.data?.message || "Unable to verify code.";
      setError(msg);
    } finally {
      setOtpSubmitting(false);
    }
  };

  return (
    <View style={s.bg}>
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

      {/* Phone number removed: email-only registration */}

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

      {/* Address Group (PSGC) */}
      <Text style={s.sectionLabel}>Address</Text>
      <Text style={s.label}>Province</Text>
      <TouchableOpacity
        style={s.select}
        disabled={loadingAddr || submitting}
        onPress={() => setShowProvinceModal(true)}
        activeOpacity={0.8}
      >
        <Text style={s.selectText}>{province?.name || "Select province"}</Text>
        <Ionicons name="chevron-down" size={18} color="#374151" />
      </TouchableOpacity>

      <Text style={s.label}>City / Municipality</Text>
      <TouchableOpacity
        style={s.select}
        disabled={!province?.code || loadingAddr || submitting}
        onPress={() => setShowCityMunModal(true)}
        activeOpacity={0.8}
      >
        <Text style={s.selectText}>{cityMun?.name || "Select city or municipality"}</Text>
        <Ionicons name="chevron-down" size={18} color="#374151" />
      </TouchableOpacity>

      <Text style={s.label}>District</Text>
      <TouchableOpacity
        style={s.select}
        disabled={!cityMun?.code || loadingAddr || submitting}
        onPress={() => setShowBarangayModal(true)}
        activeOpacity={0.8}
      >
        <Text style={s.selectText}>{barangay?.name || "Select district"}</Text>
        <Ionicons name="chevron-down" size={18} color="#374151" />
      </TouchableOpacity>

      <Text style={s.label}>Street</Text>
      <TextInput
        value={street}
        onChangeText={setStreet}
        placeholder="123 Rizal St. / House No."
        placeholderTextColor={placeholderColor}
        style={s.input}
        editable={!submitting}
      />

      {/* Selection Modals */}
      <SelectorModal
        visible={showProvinceModal}
        title="Select Province"
        data={provinces}
        keyExtractor={(item) => item.code}
        onClose={() => setShowProvinceModal(false)}
        onSelect={(item) => { setProvince(item); setShowProvinceModal(false); }}
      />

      <SelectorModal
        visible={showCityMunModal}
        title="Select City / Municipality"
        data={citiesMunicipalities}
        keyExtractor={(item) => item.code}
        onClose={() => setShowCityMunModal(false)}
        onSelect={(item) => { setCityMun(item); setShowCityMunModal(false); }}
      />

      <SelectorModal
        visible={showBarangayModal}
        title="Select District"
        data={barangays}
        keyExtractor={(item) => item.code}
        onClose={() => setShowBarangayModal(false)}
        onSelect={(item) => { setBarangay(item); setShowBarangayModal(false); }}
      />

      {/* OTP Modal */}
      <Modal visible={showOtpModal} transparent animationType="fade" onRequestClose={() => setShowOtpModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Enter Verification Code</Text>
              <TouchableOpacity onPress={() => setShowOtpModal(false)} style={s.modalClose}>
                <Ionicons name="close" size={22} color="#374151" />
              </TouchableOpacity>
            </View>
            <Text style={{ color: '#6B7280', marginBottom: 8 }}>We sent a 6-digit code to {otpEmail}.</Text>
            <TextInput
              value={otpCode}
              onChangeText={setOtpCode}
              keyboardType="numeric"
              maxLength={6}
              placeholder="123456"
              placeholderTextColor={placeholderColor}
              style={s.input}
            />
            <View style={{ height: 8 }} />
            <TouchableOpacity style={[s.primaryBtn, otpSubmitting && s.btnDisabled]} onPress={submitOtp} disabled={otpSubmitting}>
              {otpSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Verify</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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

      <View style={{ alignItems: "center" }}>
        <Text style={s.small}>Already have an account?</Text>
        <TouchableOpacity onPress={() => router.push("/login")} activeOpacity={0.7}>
          <Text style={[s.small, { color: "#065F46", textDecorationLine: "underline" }]}>Login</Text>
        </TouchableOpacity>
      </View>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1, minHeight: height, overflow: "hidden", backgroundColor: "#F0FDF4" },
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
  select: {
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
    marginBottom: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: { color: "#1F2937" },
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
    color: "#111827",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  modalContent: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  modalTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  modalClose: { padding: 6 },
  modalSearch: {
    backgroundColor: "#F9FAFB",
    borderColor: "#E5E7EB",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#1F2937",
    marginBottom: 10,
  },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomColor: "#E5E7EB",
    borderBottomWidth: 1,
  },
  optionText: { color: "#111827" },
  
});

// Helper component: selector modal
function SelectorModal({ visible, title, data, keyExtractor, onClose, onSelect }) {
  const [search, setSearch] = useState("");
  const list = Array.isArray(data) ? data : [];
  const filtered = list.filter((d) => String(d.name || "").toLowerCase().includes(search.toLowerCase()));
  return (
    <Modal visible={!!visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.modalOverlay}>
        <View style={s.modalContent}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={s.modalClose}>
              <Ionicons name="close" size={22} color="#374151" />
            </TouchableOpacity>
          </View>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search…"
            placeholderTextColor={placeholderColor}
            style={s.modalSearch}
          />
          <ScrollView style={{ maxHeight: 360 }}>
            {filtered.map((item) => (
              <TouchableOpacity key={keyExtractor(item)} style={s.option} onPress={() => onSelect(item)}>
                <Text style={s.optionText}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
