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
import { AppCtx } from "../context/AppContext";
import { updateProfileApi } from "../api/apiClient";

export default function EditProfileScreen() {
  const { width, height } = Dimensions.get('window');

  // Responsive breakpoints
  const isTablet = width >= 768;
  const isLargeScreen = width >= 1024;
  const { user, setUserState, persistUser, toAbsoluteUrl } = useContext(AppCtx);
  
  // Parse existing name into separate fields
  const parseExistingName = (fullName) => {
    if (!fullName) return { firstName: "", middleInitial: "", lastName: "" };
    
    const nameParts = fullName.trim().split(/\s+/);
    if (nameParts.length === 1) {
      return { firstName: nameParts[0], middleInitial: "", lastName: "" };
    } else if (nameParts.length === 2) {
      return { firstName: nameParts[0], middleInitial: "", lastName: nameParts[1] };
    } else {
      // Assume first part is first name, last part is last name, middle parts are middle initial
      const firstName = nameParts[0];
      const lastName = nameParts[nameParts.length - 1];
      const middleParts = nameParts.slice(1, -1);
      const middleInitial = middleParts.length > 0 ? middleParts[0].charAt(0).toUpperCase() : "";
      return { firstName, middleInitial, lastName };
    }
  };

  const parsedName = parseExistingName(user?.name);
  const [firstName, setFirstName] = useState(parsedName.firstName);
  const [middleInitial, setMiddleInitial] = useState(parsedName.middleInitial);
  const [lastName, setLastName] = useState(parsedName.lastName);
  const [email, setEmail] = useState(user?.email || "");
  const [loading, setLoading] = useState(false);

  const save = async () => {
    // Validate required fields
    if (!firstName.trim()) {
      Alert.alert("Error", "First name is required");
      return;
    }

    if (!lastName.trim()) {
      Alert.alert("Error", "Last name is required");
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

    // Combine name fields
    const fullName = [
      firstName.trim(),
      middleInitial.trim(),
      lastName.trim()
    ].filter(part => part.length > 0).join(" ");

    setLoading(true);

    try {
      // Call the new profile update API endpoint
      const response = await updateProfileApi({
        name: fullName,
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

  // Combine current name fields to check for changes
  const currentFullName = [
    firstName.trim(),
    middleInitial.trim(),
    lastName.trim()
  ].filter(part => part.length > 0).join(" ");
  
  const hasChanges = currentFullName !== (user?.name || "") || email !== (user?.email || "");

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


            {/* Form Section */}
            <View style={[s.formSection, isTablet && s.formSectionTablet]}>
              <Text style={[s.sectionLabel, isTablet && s.sectionLabelTablet]}>Name</Text>
              
              <View style={s.inputGroup}>
                <Text style={[s.inputLabel, isTablet && s.inputLabelTablet]}>First Name</Text>
                <View style={[s.inputContainer, isTablet && s.inputContainerTablet]}>
                  <Ionicons name="person-outline" size={isTablet ? 24 : 20} color="#6B7280" style={s.inputIcon} />
                  <TextInput
                    value={firstName}
                    onChangeText={setFirstName}
                    style={[s.input, isTablet && s.inputTablet]}
                    placeholder="Juan"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={s.inputGroup}>
                <Text style={[s.inputLabel, isTablet && s.inputLabelTablet]}>Middle Initial (optional)</Text>
                <View style={[s.inputContainer, isTablet && s.inputContainerTablet]}>
                  <Ionicons name="person-outline" size={isTablet ? 24 : 20} color="#6B7280" style={s.inputIcon} />
                  <TextInput
                    value={middleInitial}
                    onChangeText={(v) => setMiddleInitial(v.slice(0, 1))}
                    style={[s.input, isTablet && s.inputTablet]}
                    placeholder="M"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={1}
                  />
                </View>
              </View>

              <View style={s.inputGroup}>
                <Text style={[s.inputLabel, isTablet && s.inputLabelTablet]}>Last Name</Text>
                <View style={[s.inputContainer, isTablet && s.inputContainerTablet]}>
                  <Ionicons name="person-outline" size={isTablet ? 24 : 20} color="#6B7280" style={s.inputIcon} />
                  <TextInput
                    value={lastName}
                    onChangeText={setLastName}
                    style={[s.input, isTablet && s.inputTablet]}
                    placeholder="Dela Cruz"
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

  sectionLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
    marginTop: 8,
  },

  sectionLabelTablet: {
    fontSize: 20,
    marginBottom: 20,
    marginTop: 12,
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