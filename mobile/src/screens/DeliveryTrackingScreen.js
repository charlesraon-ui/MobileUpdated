import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors, Radii } from "../../constants/theme";
import { AppCtx } from "../context/AppContext";

const { width } = Dimensions.get("window");

export default function DeliveryTrackingScreen() {
  const { deliveryId } = useLocalSearchParams();
  const { user, apiClient } = useContext(AppCtx);
  
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trackingData, setTrackingData] = useState(null);

  const fetchDeliveryDetails = async () => {
    try {
      const response = await apiClient.get(`/api/delivery/${deliveryId}`, {
        params: { userId: user?.id }
      });
      
      if (response.data.success) {
        setDelivery(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching delivery:", error);
      Alert.alert("Error", "Failed to load delivery details");
    }
  };

  const fetchTrackingStatus = async () => {
    try {
      const response = await apiClient.get(`/api/delivery/${deliveryId}/track`, {
        params: { userId: user?.id }
      });
      
      if (response.data.success) {
        setTrackingData(response.data);
      }
    } catch (error) {
      console.error("Error fetching tracking:", error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchDeliveryDetails(), fetchTrackingStatus()]);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTrackingStatus();
    setRefreshing(false);
  };

  useEffect(() => {
    if (deliveryId && user?.id) {
      loadData();
    }
  }, [deliveryId, user?.id]);

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "#F59E0B";
      case "assigned": return "#3B82F6";
      case "in-transit": return "#8B5CF6";
      case "completed": return "#10B981";
      case "cancelled": return "#EF4444";
      default: return "#6B7280";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending": return "time-outline";
      case "assigned": return "person-outline";
      case "in-transit": return "car-outline";
      case "completed": return "checkmark-circle-outline";
      case "cancelled": return "close-circle-outline";
      default: return "help-circle-outline";
    }
  };

  const formatStatus = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ");
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.accent} />
        <Text style={styles.loadingText}>Loading delivery details...</Text>
      </View>
    );
  }

  if (!delivery) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={Colors.light.textSecondary} />
        <Text style={styles.errorText}>Delivery not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track Delivery</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={24} color={Colors.light.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusIcon, { backgroundColor: getStatusColor(trackingData?.status || delivery.status) }]}>
              <Ionicons 
                name={getStatusIcon(trackingData?.status || delivery.status)} 
                size={24} 
                color="#FFFFFF" 
              />
            </View>
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>
                {formatStatus(trackingData?.status || delivery.status)}
              </Text>
              <Text style={styles.statusSubtitle}>
                {delivery.type === "third-party" ? `${delivery.thirdPartyProvider} Delivery` : 
                 delivery.type === "pickup" ? "Pickup Order" : "In-house Delivery"}
              </Text>
            </View>
          </View>

          {trackingData?.estimatedTime && (
            <View style={styles.estimatedTime}>
              <Ionicons name="time-outline" size={16} color={Colors.light.textSecondary} />
              <Text style={styles.estimatedTimeText}>
                Estimated: {trackingData.estimatedTime}
              </Text>
            </View>
          )}
        </View>

        {/* Delivery Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Delivery Information</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Delivery Address:</Text>
            <Text style={styles.detailValue}>{delivery.deliveryAddress}</Text>
          </View>

          {delivery.pickupLocation && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Pickup Location:</Text>
              <Text style={styles.detailValue}>{delivery.pickupLocation}</Text>
            </View>
          )}

          {delivery.scheduledDate && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Scheduled Date:</Text>
              <Text style={styles.detailValue}>
                {new Date(delivery.scheduledDate).toLocaleDateString()}
              </Text>
            </View>
          )}

          {delivery.deliveryFee && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Delivery Fee:</Text>
              <Text style={styles.detailValue}>₱{delivery.deliveryFee}</Text>
            </View>
          )}
        </View>

        {/* Driver Information */}
        {trackingData?.driver && (
          <View style={styles.detailsCard}>
            <Text style={styles.cardTitle}>Driver Information</Text>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Name:</Text>
              <Text style={styles.detailValue}>{trackingData.driver.name}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Phone:</Text>
              <Text style={styles.detailValue}>{trackingData.driver.phone}</Text>
            </View>

            {trackingData.driver.plateNumber && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Vehicle:</Text>
                <Text style={styles.detailValue}>{trackingData.driver.plateNumber}</Text>
              </View>
            )}
          </View>
        )}

        {/* Lalamove Specific Info */}
        {delivery.type === "third-party" && delivery.thirdPartyProvider === "Lalamove" && (
          <View style={styles.detailsCard}>
            <Text style={styles.cardTitle}>Lalamove Details</Text>
            
            {trackingData?.lalamoveStatus && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Lalamove Status:</Text>
                <Text style={styles.detailValue}>{trackingData.lalamoveStatus}</Text>
              </View>
            )}

            {trackingData?.trackingUrl && (
              <TouchableOpacity 
                style={styles.trackingButton}
                onPress={() => {
                  // Open external tracking URL
                  Alert.alert(
                    "External Tracking",
                    "This will open Lalamove's tracking page in your browser.",
                    [
                      { text: "Cancel", style: "cancel" },
                      { text: "Open", onPress: () => console.log("Open:", trackingData.trackingUrl) }
                    ]
                  );
                }}
              >
                <Ionicons name="open-outline" size={20} color="#FFFFFF" />
                <Text style={styles.trackingButtonText}>View on Lalamove</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Notes */}
        {delivery.notes && (
          <View style={styles.detailsCard}>
            <Text style={styles.cardTitle}>Special Instructions</Text>
            <Text style={styles.notesText}>{delivery.notes}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.light.background,
  },
  
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.light.background,
    paddingHorizontal: 32,
  },
  
  errorText: {
    marginTop: 16,
    fontSize: 18,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  
  backButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.light.accent,
    borderRadius: Radii.md,
  },
  
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  
  backBtn: {
    padding: 8,
  },
  
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.text,
  },
  
  refreshBtn: {
    padding: 8,
  },
  
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  statusCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: Radii.lg,
    padding: 20,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  
  statusInfo: {
    flex: 1,
  },
  
  statusTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.light.text,
  },
  
  statusSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  
  estimatedTime: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  
  estimatedTimeText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  
  detailsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: Radii.lg,
    padding: 20,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 16,
  },
  
  detailRow: {
    marginBottom: 12,
  },
  
  detailLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  
  detailValue: {
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: "500",
  },
  
  trackingButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.accent,
    borderRadius: Radii.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  
  trackingButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  
  notesText: {
    fontSize: 16,
    color: Colors.light.text,
    lineHeight: 24,
  },
});