import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useContext, useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { AppCtx } from "../context/AppContext";

export default function PaymentSuccessScreen() {
  const { orderId } = useLocalSearchParams();
  const { refreshAuthedData, user } = useContext(AppCtx);

  useEffect(() => {
    // Refresh order data
    if (user) {
      refreshAuthedData(user);
    }

    // Auto redirect to orders after 3 seconds
    const timer = setTimeout(() => {
      router.replace('/tabs/profile');
    }, 3000);

    return () => clearTimeout(timer);
  }, [orderId, user]);

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="checkmark-circle" size={100} color="#10B981" />
      </View>
      
      <Text style={styles.title}>Payment Successful!</Text>
      <Text style={styles.message}>
        Your order has been placed successfully.
      </Text>
      
      {orderId && (
        <Text style={styles.orderId}>Order ID: {orderId}</Text>
      )}

      <ActivityIndicator size="large" color="#10B981" style={styles.loader} />
      <Text style={styles.redirectText}>Redirecting to your orders...</Text>
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
    marginBottom: 16,
  },
  orderId: {
    fontSize: 14,
    color: "#10B981",
    fontWeight: "600",
    marginBottom: 24,
  },
  loader: {
    marginTop: 20,
  },
  redirectText: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 12,
  },
});