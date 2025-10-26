import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { AppCtx } from '../context/AppContext';
import PromoService from '../services/PromoService';

const GREEN = "#10B981";
const GREEN_BG = "#ECFDF5";
const GREEN_BORDER = "#A7F3D0";
const GRAY = "#6B7280";
const BORDER = "#E5E7EB";

export default function VoucherDropdown({ 
  cartTotal, 
  onPromoApplied, 
  onPromoRemoved, 
  appliedPromo, 
  promoDiscount, 
  freeShipping 
}) {
  const {
    usableRewards,
    appliedReward,
    rewardDiscount,
    rewardFreeShipping,
    applyRewardDiscount,
    removeRewardDiscount,
    isLoggedIn,
  } = useContext(AppCtx);

  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  // Calculate total applied discounts
  const totalDiscount = (promoDiscount || 0) + (rewardDiscount || 0);
  const hasAppliedVouchers = appliedPromo || appliedReward;
  const hasFreeShipping = freeShipping || rewardFreeShipping;

  const showToast = (message) => {
    Alert.alert("Voucher", message);
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      showToast("Please enter a promo code");
      return;
    }

    const validation = PromoService.validatePromoCode(promoCode);
    if (!validation.valid) {
      showToast(validation.error);
      return;
    }

    setIsApplyingPromo(true);
    
    try {
      const result = await PromoService.applyPromoCode(promoCode, cartTotal);
      
      if (result.success) {
        onPromoApplied(result.data.promo, result.data.discount || 0, result.data.freeShipping || false);
        setPromoCode("");
        setDropdownVisible(false);
        
        showToast(
          result.data.freeShipping 
            ? "Free shipping applied!" 
            : `Discount of ₱${result.data.discount} applied!`
        );
      } else {
        showToast(result.error || "Failed to apply promo code");
      }
    } catch (error) {
      showToast("Error applying promo code");
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    onPromoRemoved();
    showToast("Promo code removed");
  };

  const handleApplyReward = (reward) => {
    applyRewardDiscount(reward);
    setDropdownVisible(false);
    showToast(`${reward.name} applied!`);
  };

  const handleRemoveReward = () => {
    removeRewardDiscount();
    showToast("Reward removed");
  };

  const handleViewAllVouchers = () => {
    setDropdownVisible(false);
    // Navigate to profile with a flag to return to checkout
    router.push('/digital-card?returnTo=checkout');
  };

  const renderVoucherButton = () => (
    <TouchableOpacity
      style={styles.voucherButton}
      onPress={() => setDropdownVisible(true)}
      activeOpacity={0.8}
    >
      <View style={styles.voucherButtonContent}>
        <Ionicons name="pricetag" size={20} color={GREEN} />
        <Text style={styles.voucherButtonText}>Vouchers</Text>
        {hasAppliedVouchers && (
          <View style={styles.appliedBadge}>
            <Text style={styles.appliedBadgeText}>
              {(appliedPromo ? 1 : 0) + (appliedReward ? 1 : 0)}
            </Text>
          </View>
        )}
        <Ionicons name="chevron-down" size={16} color={GRAY} />
      </View>
    </TouchableOpacity>
  );

  const renderAppliedVouchers = () => {
    if (!hasAppliedVouchers) return null;

    return (
      <View style={styles.appliedVouchersContainer}>
        {appliedReward && (
          <View style={styles.appliedVoucherCard}>
            <View style={styles.appliedVoucherInfo}>
              <Ionicons name="gift" size={16} color={GREEN} />
              <View style={styles.appliedVoucherText}>
                <Text style={styles.appliedVoucherName}>{appliedReward.name}</Text>
                <Text style={styles.appliedVoucherDiscount}>
                  {appliedReward.type === 'shipping' 
                    ? 'Free shipping'
                    : `-₱${rewardDiscount.toFixed(2)}`
                  }
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.removeVoucherBtn}
              onPress={handleRemoveReward}
            >
              <Ionicons name="close" size={14} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}

        {appliedPromo && (
          <View style={styles.appliedVoucherCard}>
            <View style={styles.appliedVoucherInfo}>
              <Ionicons name="pricetag" size={16} color={GREEN} />
              <View style={styles.appliedVoucherText}>
                <Text style={styles.appliedVoucherName}>{appliedPromo.code}</Text>
                <Text style={styles.appliedVoucherDiscount}>
                  {freeShipping ? "Free shipping" : `-₱${promoDiscount.toFixed(2)}`}
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.removeVoucherBtn}
              onPress={handleRemovePromo}
            >
              <Ionicons name="close" size={14} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderDropdownModal = () => (
    <Modal
      visible={dropdownVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setDropdownVisible(false)}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Vouchers</Text>
            <TouchableOpacity
              onPress={() => setDropdownVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={GRAY} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Loyalty Rewards Section */}
            {isLoggedIn && usableRewards.length > 0 && (
              <View style={styles.voucherSection}>
                <Text style={styles.sectionTitle}>Loyalty Rewards</Text>
                <View style={styles.rewardsGrid}>
                  {usableRewards.map((reward, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.rewardCard,
                        appliedReward?.name === reward.name && styles.rewardCardSelected
                      ]}
                      onPress={() => handleApplyReward(reward)}
                      disabled={appliedReward?.name === reward.name}
                    >
                      <View style={styles.rewardIcon}>
                        <Ionicons name="gift" size={20} color={GREEN} />
                      </View>
                      <Text style={styles.rewardName}>{reward.name}</Text>
                      <Text style={styles.rewardDiscount}>
                        {reward.type === 'discount' && reward.value 
                          ? `₱${reward.value} off`
                          : reward.discountAmount 
                            ? `₱${reward.discountAmount} off`
                            : reward.type === 'shipping'
                              ? 'Free shipping'
                              : 'Reward'
                        }
                      </Text>
                      {appliedReward?.name === reward.name && (
                        <View style={styles.selectedBadge}>
                          <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Promo Code Section */}
            <View style={styles.voucherSection}>
              <Text style={styles.sectionTitle}>Promo Code</Text>
              <View style={styles.promoInputContainer}>
                <TextInput
                  value={promoCode}
                  onChangeText={setPromoCode}
                  placeholder="Enter promo code"
                  style={styles.promoInput}
                  placeholderTextColor={GRAY}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={[styles.applyPromoBtn, isApplyingPromo && styles.btnDisabled]}
                  onPress={handleApplyPromo}
                  disabled={isApplyingPromo}
                >
                  {isApplyingPromo ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.applyPromoBtnText}>Apply</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* View All Vouchers */}
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={handleViewAllVouchers}
            >
              <Ionicons name="card-outline" size={20} color={GREEN} />
              <Text style={styles.viewAllButtonText}>View All Vouchers</Text>
              <Ionicons name="chevron-forward" size={16} color={GRAY} />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {renderVoucherButton()}
      {renderAppliedVouchers()}
      {renderDropdownModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },

  voucherButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  voucherButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  voucherButtonText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },

  appliedBadge: {
    backgroundColor: GREEN,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  appliedBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },

  appliedVouchersContainer: {
    marginTop: 12,
  },

  appliedVoucherCard: {
    backgroundColor: GREEN_BG,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: GREEN_BORDER,
  },

  appliedVoucherInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  appliedVoucherText: {
    marginLeft: 8,
    flex: 1,
  },

  appliedVoucherName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },

  appliedVoucherDiscount: {
    fontSize: 12,
    color: GREEN,
    fontWeight: "500",
  },

  removeVoucherBtn: {
    padding: 4,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    width: "90%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },

  closeButton: {
    padding: 4,
  },

  modalContent: {
    padding: 20,
  },

  voucherSection: {
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },

  rewardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  rewardCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    minWidth: "45%",
    borderWidth: 1,
    borderColor: BORDER,
    position: "relative",
  },

  rewardCardSelected: {
    backgroundColor: GREEN_BG,
    borderColor: GREEN,
  },

  rewardIcon: {
    marginBottom: 8,
  },

  rewardName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 4,
  },

  rewardDiscount: {
    fontSize: 12,
    color: GREEN,
    fontWeight: "500",
    textAlign: "center",
  },

  selectedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: GREEN,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  promoInputContainer: {
    flexDirection: "row",
    gap: 12,
  },

  promoInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1F2937",
  },

  applyPromoBtn: {
    backgroundColor: GREEN,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  btnDisabled: {
    opacity: 0.6,
  },

  applyPromoBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },

  viewAllButtonText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "600",
    color: GREEN,
  },
});