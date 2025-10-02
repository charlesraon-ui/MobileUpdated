import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function PaymentCancelScreen() {
  const { orderId } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="close-circle" size={100} color="#EF4444" />
      </View>
      
      <Text style={styles.title}>Payment Cancelled</Text>
      <Text style={styles.message}>
        Your payment was cancelled. Your order has not been placed.
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => router.push('/cart')}
        >
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => router.push('/tabs/home')}
        >
          <Text style={styles.homeText}>Go to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 20,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 32,
  },
  actions: {
    width: "100%",
    gap: 12,
  },
  retryButton: {
    backgroundColor: "#10B981",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  homeButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  homeText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "700",
  },
});