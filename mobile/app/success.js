// mobile/app/payment/success.js
import { useLocalSearchParams, useRouter } from "expo-router";
import { useContext, useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { AppCtx } from "../src/context/AppContext";

export default function PaymentSuccessScreen() {
  const { orderId } = useLocalSearchParams();
  const { refreshAuthedData, user, setCart } = useContext(AppCtx);
  const router = useRouter();

  useEffect(() => {
    // Clear cart and refresh data
    setCart([]);
    if (user) {
      refreshAuthedData(user);
    }

    // Redirect to orders after 2 seconds
    const timer = setTimeout(() => {
      router.replace('/tabs/orders');
    }, 2000);

    return () => clearTimeout(timer);
  }, [orderId]);

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>✅</Text>
      <Text style={styles.title}>Payment Successful!</Text>
      <Text style={styles.message}>Your order has been placed</Text>
      {orderId && <Text style={styles.orderId}>Order: #{String(orderId).slice(-8).toUpperCase()}</Text>}
      <ActivityIndicator size="large" color="#10B981" style={styles.loader} />
      <Text style={styles.redirect}>Redirecting to orders...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC", padding: 20 },
  icon: { fontSize: 80, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: "800", color: "#111827", marginBottom: 8 },
  message: { fontSize: 16, color: "#6B7280", marginBottom: 16 },
  orderId: { fontSize: 14, color: "#10B981", fontWeight: "600", marginBottom: 24 },
  loader: { marginTop: 20 },
  redirect: { fontSize: 14, color: "#9CA3AF", marginTop: 12 },
});