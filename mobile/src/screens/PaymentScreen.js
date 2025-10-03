import { useContext, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { WebView } from "react-native-webview";
import { createPaymentSource } from "../api/apiClient";
import { AppCtx } from "../context/AppContext";

export default function PaymentScreen({ route, navigation }) {
  const { amount, orderId } = route.params;
  const { user } = useContext(AppCtx);
  const [checkoutUrl, setCheckoutUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGCashPayment = async () => {
    setLoading(true);
    try {
      const response = await createPaymentSource(
        amount,
        "gcash",
        user.id,
        orderId
      );
      
      if (response.data.success) {
        setCheckoutUrl(response.data.checkoutUrl);
      } else {
        Alert.alert("Error", response.data.message || "Payment failed");
      }
    } catch (error) {
      console.error("GCash payment error:", error);
      Alert.alert("Error", "Failed to initialize GCash payment");
    } finally {
      setLoading(false);
    }
  };

  const handlePayMayaPayment = async () => {
    setLoading(true);
    try {
      const response = await createPaymentSource(
        amount,
        "paymaya",
        user.id,
        orderId
      );
      
      if (response.data.success) {
        setCheckoutUrl(response.data.checkoutUrl);
      } else {
        Alert.alert("Error", response.data.message || "Payment failed");
      }
    } catch (error) {
      console.error("PayMaya payment error:", error);
      Alert.alert("Error", "Failed to initialize PayMaya payment");
    } finally {
      setLoading(false);
    }
  };

  const handleWebViewNavigationStateChange = (navState) => {
    const { url } = navState;
    
    // Check for success/failure redirect
    if (url.includes("goagritrading://payment/success")) {
      setCheckoutUrl(null);
      Alert.alert("Success", "Payment completed!", [
        { text: "OK", onPress: () => navigation.navigate("Orders") },
      ]);
    } else if (url.includes("goagritrading://payment/cancel")) {
      setCheckoutUrl(null);
      Alert.alert("Failed", "Payment was not completed. Please try again.");
    }
  };

  if (checkoutUrl) {
    return (
      <View style={styles.container}>
        <WebView
          source={{ uri: checkoutUrl }}
          onNavigationStateChange={handleWebViewNavigationStateChange}
          style={styles.webview}
        />
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => setCheckoutUrl(null)}
        >
          <Text style={styles.cancelButtonText}>Cancel Payment</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Payment Method</Text>
      <Text style={styles.amount}>Amount: ₱{amount.toFixed(2)}</Text>

      <TouchableOpacity
        style={styles.paymentButton}
        onPress={handleGCashPayment}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Pay with GCash</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.paymentButton}
        onPress={handlePayMayaPayment}
        disabled={loading}
      >
        <Text style={styles.buttonText}>Pay with PayMaya</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  amount: { fontSize: 18, color: "#666", marginBottom: 30 },
  paymentButton: {
    backgroundColor: "#10B981",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold", textAlign: "center" },
  webview: { flex: 1 },
  cancelButton: {
    backgroundColor: "#EF4444",
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
  },
  cancelButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold", textAlign: "center" },
});
