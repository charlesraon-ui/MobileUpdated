import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useContext, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { AppCtx } from "../context/AppContext";

export default function EditProfileScreen() {
  const { user, setUserState, persistUser } = useContext(AppCtx);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Name is required");
      return;
    }

    if (!email.trim()) {
      Alert.alert("Error", "Email is required");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      // Here you would typically make an API call to update the profile
      // For now, we'll just update the local state
      const updatedUser = { ...user, name: name.trim(), email: email.trim() };
      
      // Update context state
      if (setUserState) {
        setUserState(updatedUser);
      }
      
      // Persist to storage
      if (persistUser) {
        await persistUser(updatedUser);
      }

      Alert.alert(
        "Success", 
        "Profile updated successfully!",
        [
          {
            text: "OK",
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = name !== (user?.name || "") || email !== (user?.email || "");

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#10B981" />
      
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={s.backButton}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Edit Profile</Text>
        <View style={s.headerSpacer} />
      </View>

      <KeyboardAvoidingView 
        style={s.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView 
          style={s.scrollView}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Avatar Section */}
          <View style={s.avatarSection}>
            <View style={s.avatarContainer}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>
                  {(name || user?.name || "U").charAt(0).toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={s.avatarLabel}>Profile Picture</Text>
            <Text style={s.avatarSubtext}>Upload or change your profile picture</Text>
          </View>

          {/* Form Section */}
          <View style={s.formSection}>
            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>Full Name</Text>
              <View style={s.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#6B7280" style={s.inputIcon} />
                <TextInput
                  value={name}
                  onChangeText={setName}
                  style={s.input}
                  placeholder="Enter your full name"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>Email Address</Text>
              <View style={s.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#6B7280" style={s.inputIcon} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  style={s.input}
                  placeholder="Enter your email address"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
          </View>

          {/* Info Card */}
          <View style={s.infoCard}>
            <View style={s.infoIconContainer}>
              <Ionicons name="information-circle" size={24} color="#10B981" />
            </View>
            <View style={s.infoContent}>
              <Text style={s.infoTitle}>Profile Information</Text>
              <Text style={s.infoText}>
                Your profile information helps us personalize your experience and communicate with you about your orders.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={s.actionContainer}>
          <TouchableOpacity
            style={s.cancelButton}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={s.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              s.saveButton,
              (!hasChanges || loading) && s.saveButtonDisabled
            ]}
            onPress={save}
            disabled={!hasChanges || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={s.loadingContainer}>
                <Text style={s.saveButtonText}>Saving...</Text>
              </View>
            ) : (
              <Text style={s.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  // Header
  header: {
    backgroundColor: "#10B981",
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    flex: 1,
  },

  headerSpacer: {
    width: 40,
  },

  // Content
  keyboardView: {
    flex: 1,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 20,
  },

  // Avatar Section
  avatarSection: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  avatarContainer: {
    marginBottom: 16,
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  avatarText: {
    fontSize: 40,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  avatarLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },

  avatarSubtext: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },

  // Form Section
  formSection: {
    paddingHorizontal: 20,
    gap: 20,
    marginBottom: 20,
  },

  inputGroup: {
    gap: 8,
  },

  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  inputIcon: {
    marginRight: 12,
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    fontWeight: "500",
  },

  // Info Card
  infoCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  infoIconContainer: {
    marginRight: 12,
    marginTop: 2,
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },

  infoText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },

  // Action Buttons
  actionContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    gap: 12,
  },

  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },

  saveButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#10B981",
    alignItems: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  saveButtonDisabled: {
    backgroundColor: "#D1D5DB",
    shadowOpacity: 0,
    elevation: 0,
  },

  saveButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
});