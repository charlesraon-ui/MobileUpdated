// mobile/app/payment/cancel.js
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function PaymentCancelRoute() {
  const { orderId } = useLocalSearchParams();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>❌</Text>
      </View>
      
      <Text style={styles.title}>Payment Cancelled</Text>
      <Text style={styles.message}>
        Your payment was cancelled. Your order has not been placed.
      </Text>

      {orderId && (
        <Text style={styles.orderId}>Order ID: {orderId}</Text>
      )}

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
  icon: {
    fontSize: 100,
    textAlign: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#EF4444",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 16,
    textAlign: "center",
  },
  orderId: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 32,
    fontWeight: "600",
    textAlign: "center",
  },
  actions: {
    width: "100%",
    gap: 12,
  },
  retryButton: {
    backgroundColor: "#10B981",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: "100%",
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  homeButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    width: "100%",
  },
  homeText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});