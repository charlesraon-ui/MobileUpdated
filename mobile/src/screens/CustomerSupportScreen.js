import { router } from "expo-router";
import { useState } from "react";
import {
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const GREEN = "#10B981";
const GREEN_BG = "#ECFDF5";
const GREEN_BORDER = "#A7F3D0";
const GREEN_DARK = "#065F46";
const GRAY = "#6B7280";
const LIGHT_GRAY = "#F3F4F6";
const BORDER = "#E5E7EB";
const BLUE = "#3B82F6";

export default function CustomerSupportScreen() {
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const supportCategories = [
    {
      id: "order",
      title: "Order Issues",
      description: "Problems with your orders",
      icon: "📦",
      color: GREEN,
    },
    {
      id: "payment",
      title: "Payment & Billing",
      description: "Payment problems or refunds",
      icon: "💳",
      color: BLUE,
    },
    {
      id: "technical",
      title: "Technical Support",
      description: "App issues or bugs",
      icon: "⚙️",
      color: "#F59E0B",
    },
    {
      id: "account",
      title: "Account Help",
      description: "Profile or login issues",
      icon: "👤",
      color: "#8B5CF6",
    },
    {
      id: "delivery",
      title: "Delivery Questions",
      description: "Shipping and delivery inquiries",
      icon: "🚚",
      color: "#EF4444",
    },
    {
      id: "product",
      title: "Product Information",
      description: "Questions about products",
      icon: "ℹ️",
      color: "#06B6D4",
    },
  ];

  const quickActions = [
    {
      title: "Call Support",
      description: "Speak directly with our team",
      icon: "📞",
      action: () => {
        Linking.openURL("tel:+639954730790");
      },
    },
    {
      title: "Email Us",
      description: "Send us an email",
      icon: "✉️",
      action: () => {
        Linking.openURL("mailto:info@goagritrading.com");
      },
    },
    {
      title: "Live Chat",
      description: "Chat with support team in real-time",
      icon: "💬",
      action: () => router.push("/support-chat"),
    },
    {
      title: "FAQ",
      description: "Find quick answers",
      icon: "❓",
      action: () => {
        Alert.alert(
          "FAQ",
          "Frequently asked questions section coming soon!",
          [{ text: "OK" }]
        );
      },
    },
  ];
  // Ticket submission form removed; chat is the primary support channel.

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backButton}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={s.headerContent}>
          <Text style={s.headerTitle}>Customer Support</Text>
          <Text style={s.headerSubtitle}>We're here to help you</Text>
        </View>
      </View>

      <ScrollView
        style={s.scrollContainer}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Quick Actions</Text>
          <View style={s.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={s.quickActionCard}
                onPress={action.action}
                activeOpacity={0.8}
              >
                <Text style={s.quickActionIcon}>{action.icon}</Text>
                <Text style={s.quickActionTitle}>{action.title}</Text>
                <Text style={s.quickActionDescription}>{action.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Categories removed per requirement */}

        {/* Message Support CTA removed; use Live Chat quick action */}

        {/* Contact Information */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Other Ways to Reach Us</Text>
          <View style={s.contactInfoContainer}>
            <View style={s.contactInfoItem}>
              <Text style={s.contactInfoIcon}>📱</Text>
              <View style={s.contactInfoContent}>
                <Text style={s.contactInfoLabel}>Phone Support</Text>
                <Text style={s.contactInfoValue}>+63 995 473 0790</Text>
                <Text style={s.contactInfoHours}>Mon-Fri: 8:00AM-5:00PM</Text>
              </View>
            </View>

            <View style={s.contactInfoItem}>
              <Text style={s.contactInfoIcon}>📧</Text>
              <View style={s.contactInfoContent}>
                <Text style={s.contactInfoLabel}>Email Support</Text>
                <Text style={s.contactInfoValue}>info@goagritrading.com</Text>
                <Text style={s.contactInfoHours}>Response within 24 hours</Text>
              </View>
            </View>

            <View style={s.contactInfoItem}>
              <Text style={s.contactInfoIcon}>📍</Text>
              <View style={s.contactInfoContent}>
                <Text style={s.contactInfoLabel}>Office Address</Text>
                <Text style={s.contactInfoValue}>Poblacion 1, Moncada</Text>
                <Text style={s.contactInfoHours}>Tarlac, Philippines</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Help Tips removed per request */}
      </ScrollView>
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
    backgroundColor: GREEN,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  backIcon: {
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },

  // Scroll container
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 24,
  },

  // Sections
  section: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },

  // Quick Actions Grid
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickActionCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
    textAlign: "center",
  },
  quickActionDescription: {
    fontSize: 12,
    color: GRAY,
    textAlign: "center",
    lineHeight: 16,
  },

  // Categories
  categoriesContainer: {
    gap: 12,
  },
  categoryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    position: "relative",
  },
  categoryCardSelected: {
    borderWidth: 2,
    shadowOpacity: 0.1,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  categoryIconText: {
    fontSize: 20,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: GRAY,
  },
  selectedIndicator: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedIndicatorText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  // Form
  formContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: LIGHT_GRAY,
    color: "#111827",
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  characterCount: {
    fontSize: 12,
    color: GRAY,
    textAlign: "right",
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: GREEN,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    backgroundColor: GRAY,
    shadowOpacity: 0.1,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // Contact Info
  contactInfoContainer: {
    gap: 16,
  },
  contactInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  contactInfoIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  contactInfoContent: {
    flex: 1,
  },
  contactInfoLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  contactInfoValue: {
    fontSize: 16,
    color: GREEN_DARK,
    fontWeight: "700",
    marginBottom: 2,
  },
  contactInfoHours: {
    fontSize: 12,
    color: GRAY,
  },

  // Tips
  tipsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  tipNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: GREEN,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 24,
    marginRight: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
});