// mobile/app/payment/cancel.js
import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function PaymentCancelScreen() {
  const { orderId } = useLocalSearchParams();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>❌</Text>
      <Text style={styles.title}>Payment Cancelled</Text>
      <Text style={styles.message}>Your payment was not completed</Text>
      
      <TouchableOpacity style={styles.button} onPress={() => router.push('/checkout')}>
        <Text style={styles.buttonText}>Try Again</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/tabs/home')}>
        <Text style={styles.secondaryButtonText}>Go Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC", padding: 20 },
  icon: { fontSize: 80, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: "800", color: "#EF4444", marginBottom: 8 },
  message: { fontSize: 16, color: "#6B7280", marginBottom: 32 },
  button: { backgroundColor: "#10B981", paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12, marginBottom: 12, width: "100%" },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700", textAlign: "center" },
  secondaryButton: { backgroundColor: "#FFFFFF", paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12, borderWidth: 2, borderColor: "#E5E7EB", width: "100%" },
  secondaryButtonText: { color: "#374151", fontSize: 16, fontWeight: "600", textAlign: "center" },
});