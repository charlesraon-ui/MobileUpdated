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
  View,
  Image,
  Dimensions
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { AppCtx } from "../context/AppContext";
import { uploadProfileImageFromUri, updateProfileApi } from "../api/apiClient";

export default function EditProfileScreen() {
  const { width, height } = Dimensions.get('window');

  // Responsive breakpoints
  const isTablet = width >= 768;
  const isLargeScreen = width >= 1024;
  const { user, setUserState, persistUser, toAbsoluteUrl } = useContext(AppCtx);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

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
      // Call the new profile update API endpoint
      const response = await updateProfileApi({
        name: name.trim(),
        email: email.trim()
      });

      if (response.data.success) {
        const updatedUser = response.data.user;
        
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
      } else {
        throw new Error(response.data.message || "Update failed");
      }
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to update profile. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const hasChanges = name !== (user?.name || "") || email !== (user?.email || "");

  const pickAvatar = async () => {
    try {
      setAvatarUploading(true);
      // Request permission only on native; web does not require
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission required", "Please allow photo library access");
          setAvatarUploading(false);
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result?.canceled) {
        setAvatarUploading(false);
        return;
      }

      const asset = (result?.assets || [])[0];
      if (!asset?.uri) {
        setAvatarUploading(false);
        return;
      }

      const resp = await uploadProfileImageFromUri(asset);
      const url = resp?.url || resp?.user?.avatarUrl;
      if (!url) throw new Error("Upload failed");

      const updatedUser = { ...user, avatarUrl: url };
      setUserState?.(updatedUser);
      await persistUser?.(updatedUser);
      Alert.alert("Success", "Profile photo updated");
    } catch (e) {
      console.warn("avatar upload error:", e?.message || e);
      Alert.alert("Error", "Failed to upload photo. Please try again.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const removeAvatar = async () => {
    try {
      const updatedUser = { ...user };
      delete updatedUser.avatarUrl;
      setUserState?.(updatedUser);
      await persistUser?.(updatedUser);
      Alert.alert("Removed", "Profile photo removed");
    } catch (e) {
      Alert.alert("Error", "Unable to remove photo");
    }
  };

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
          contentContainerStyle={[s.scrollContent, isTablet && s.scrollContentTablet]}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Content Container for responsive layout */}
          <View style={[s.mainContent, isTablet && s.mainContentTablet]}>
            {/* Profile Avatar Section */}
            <View style={[s.avatarSection, isTablet && s.avatarSectionTablet]}>
              <View style={s.avatarContainer}>
                <View style={[s.avatar, isTablet && s.avatarTablet]}>
                  {user?.avatarUrl ? (
                    <Image
                      source={{ uri: (toAbsoluteUrl?.(user.avatarUrl) || user.avatarUrl) }}
                      style={[s.avatarImage, isTablet && s.avatarImageTablet]}
                    />
                  ) : (
                    <Text style={[s.avatarText, isTablet && s.avatarTextTablet]}>
                      {(name || user?.name || "U").charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
              </View>
              <Text style={[s.avatarLabel, isTablet && s.avatarLabelTablet]}>Profile Picture</Text>
              <View style={[s.avatarActions, isTablet && s.avatarActionsTablet]}>
                <TouchableOpacity
                  style={[s.avatarBtn, isTablet && s.avatarBtnTablet]}
                  onPress={pickAvatar}
                  disabled={avatarUploading}
                  activeOpacity={0.85}
                >
                  <Ionicons name="cloud-upload" size={isTablet ? 20 : 18} color="#FFFFFF" />
                  <Text style={[s.avatarBtnText, isTablet && s.avatarBtnTextTablet]}>
                    {avatarUploading ? "Uploading…" : "Upload Photo"}
                  </Text>
                </TouchableOpacity>
                {user?.avatarUrl ? (
                  <TouchableOpacity 
                    style={[s.removeBtn, isTablet && s.removeBtnTablet]} 
                    onPress={removeAvatar} 
                    activeOpacity={0.85}
                  >
                    <Ionicons name="trash-outline" size={isTablet ? 20 : 18} color="#EF4444" />
                    <Text style={[s.removeBtnText, isTablet && s.removeBtnTextTablet]}>Remove</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {/* Form Section */}
            <View style={[s.formSection, isTablet && s.formSectionTablet]}>
              <View style={s.inputGroup}>
                <Text style={[s.inputLabel, isTablet && s.inputLabelTablet]}>Full Name</Text>
                <View style={[s.inputContainer, isTablet && s.inputContainerTablet]}>
                  <Ionicons name="person-outline" size={isTablet ? 24 : 20} color="#6B7280" style={s.inputIcon} />
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    style={[s.input, isTablet && s.inputTablet]}
                    placeholder="Enter your full name"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={s.inputGroup}>
                <Text style={[s.inputLabel, isTablet && s.inputLabelTablet]}>Email Address</Text>
                <View style={[s.inputContainer, isTablet && s.inputContainerTablet]}>
                  <Ionicons name="mail-outline" size={isTablet ? 24 : 20} color="#6B7280" style={s.inputIcon} />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    style={[s.input, isTablet && s.inputTablet]}
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
            <View style={[s.infoCard, isTablet && s.infoCardTablet]}>
              <View style={s.infoIconContainer}>
                <Ionicons name="information-circle" size={isTablet ? 28 : 24} color="#10B981" />
              </View>
              <View style={s.infoContent}>
                <Text style={[s.infoTitle, isTablet && s.infoTitleTablet]}>Profile Information</Text>
                <Text style={[s.infoText, isTablet && s.infoTextTablet]}>
                  Your profile information helps us personalize your experience and communicate with you about your orders.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={[s.actionContainer, isTablet && s.actionContainerTablet]}>
          <TouchableOpacity
            style={[s.cancelButton, isTablet && s.cancelButtonTablet]}
            onPress={() => router.back()}
            activeOpacity={0.8}
          >
            <Text style={[s.cancelButtonText, isTablet && s.cancelButtonTextTablet]}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              s.saveButton,
              isTablet && s.saveButtonTablet,
              (!hasChanges || loading) && s.saveButtonDisabled
            ]}
            onPress={save}
            disabled={!hasChanges || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={s.loadingContainer}>
                <Text style={[s.saveButtonText, isTablet && s.saveButtonTextTablet]}>Saving...</Text>
              </View>
            ) : (
              <Text style={[s.saveButtonText, isTablet && s.saveButtonTextTablet]}>Save Changes</Text>
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

  scrollContentTablet: {
    paddingHorizontal: 40,
    paddingBottom: 40,
  },

  // Main content container for responsive layout
  mainContent: {
    flex: 1,
  },

  mainContentTablet: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
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

  avatarSectionTablet: {
    paddingVertical: 48,
    paddingHorizontal: 40,
    marginBottom: 32,
    borderRadius: 16,
  },

  avatarContainer: {
    marginBottom: 16,
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#10B981",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  avatarTablet: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },

  avatarText: {
    fontSize: 40,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  avatarTextTablet: {
    fontSize: 48,
  },

  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },

  avatarImageTablet: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },

  avatarActions: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  avatarActionsTablet: {
    marginTop: 16,
    gap: 16,
  },

  avatarBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#10B981",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },

  avatarBtnTablet: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
  },

  avatarBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  avatarBtnTextTablet: {
    fontSize: 16,
  },

  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FEE2E2",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },

  removeBtnTablet: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
  },

  removeBtnText: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "700",
  },

  removeBtnTextTablet: {
    fontSize: 16,
  },

  avatarLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },

  avatarLabelTablet: {
    fontSize: 20,
  },

  // Form Section
  formSection: {
    paddingHorizontal: 20,
    gap: 20,
    marginBottom: 20,
  },

  formSectionTablet: {
    paddingHorizontal: 0,
    gap: 24,
    marginBottom: 32,
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

  inputLabelTablet: {
    fontSize: 18,
    marginBottom: 6,
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

  inputContainerTablet: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 16,
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

  inputTablet: {
    fontSize: 18,
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

  infoCardTablet: {
    marginHorizontal: 0,
    borderRadius: 16,
    padding: 24,
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

  infoTitleTablet: {
    fontSize: 18,
    marginBottom: 6,
  },

  infoText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },

  infoTextTablet: {
    fontSize: 16,
    lineHeight: 24,
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

  actionContainerTablet: {
    paddingHorizontal: 40,
    paddingVertical: 24,
    gap: 16,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
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

  cancelButtonTablet: {
    paddingVertical: 18,
    borderRadius: 16,
  },

  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },

  cancelButtonTextTablet: {
    fontSize: 18,
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

  saveButtonTextTablet: {
    fontSize: 18,
  },

  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
});