// mobile/app/payment/success.js
import { useLocalSearchParams, useRouter } from "expo-router";
import { useContext, useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { AppCtx } from "../../src/context/AppContext";

export default function PaymentSuccessRoute() {
  const { orderId } = useLocalSearchParams();
  const router = useRouter();
  const { refreshAuthedData, user } = useContext(AppCtx);

  useEffect(() => {
    // Refresh order data
    if (user) {
      refreshAuthedData(user);
    }

    // Auto redirect to orders after 2 seconds
    const timer = setTimeout(() => {
      router.replace('/tabs/orders');
    }, 2000);

    return () => clearTimeout(timer);
  }, [orderId, user]);

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>✅</Text>
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
  icon: {
    fontSize: 100,
    textAlign: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#10B981",
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
  loader: {
    marginBottom: 16,
  },
  redirectText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
});