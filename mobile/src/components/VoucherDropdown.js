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
    availableRewards,
    appliedReward,
    rewardDiscount,
    rewardFreeShipping,
    applyRewardDiscount,
    removeRewardDiscount,
    handleRedeemReward,
    loadAvailableRewards,
    isLoggedIn,
    showToast,
  } = useContext(AppCtx);

  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [showAvailableRewards, setShowAvailableRewards] = useState(false);
  const [redeemingRewardId, setRedeemingRewardId] = useState(null);

  // Calculate total applied discounts
  const totalDiscount = (promoDiscount || 0) + (rewardDiscount || 0);
  const hasAppliedVouchers = appliedPromo || appliedReward;
  const hasFreeShipping = freeShipping || rewardFreeShipping;



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

  const handleViewAllVouchers = async () => {
    if (!showAvailableRewards) {
      // Load available rewards when showing them for the first time
      await loadAvailableRewards();
    }
    setShowAvailableRewards(!showAvailableRewards);
  };

  const handleRedeemRewardFromModal = async (reward) => {
    try {
      setRedeemingRewardId(reward._id);
      const success = await handleRedeemReward(reward.name);
      if (success) {
        showToast(`${reward.name} redeemed successfully!`);
        // Refresh available and usable rewards
        await loadAvailableRewards();
      }
    } catch (error) {
      showToast("Failed to redeem reward. Please try again.");
    } finally {
      setRedeemingRewardId(null);
    }
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
                <Text style={styles.sectionSubtitle}>Select a discount to apply to your order</Text>
                <View style={styles.rewardsGrid}>
                  {usableRewards.map((reward, index) => {
                    const isSelected = appliedReward?.name === reward.name;
                    const discountAmount = reward.type === 'discount' && reward.value 
                      ? reward.value
                      : reward.discountAmount || 0;
                    
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.rewardCardNew,
                          isSelected && styles.rewardCardSelected
                        ]}
                        onPress={() => handleApplyReward(reward)}
                        disabled={isSelected}
                      >
                        <View style={styles.rewardCardHeader}>
                          <View style={styles.rewardIconContainer}>
                            <Text style={styles.rewardIcon}>{reward.icon || "🎁"}</Text>
                          </View>
                          {isSelected && (
                            <View style={styles.selectedBadge}>
                              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                            </View>
                          )}
                        </View>
                        
                        <View style={styles.rewardCardContent}>
                          <Text style={styles.rewardName}>{reward.name}</Text>
                          <Text style={styles.rewardDescription}>
                            {reward.type === 'discount' && discountAmount > 0
                              ? `₱${discountAmount} discount voucher`
                              : reward.type === 'shipping'
                                ? 'Free shipping'
                                : reward.description
                            }
                          </Text>
                          
                          {reward.type === 'discount' && discountAmount > 0 && (
                            <View style={styles.discountAmountContainer}>
                              <Text style={styles.discountAmount}>₱{discountAmount}</Text>
                              <Text style={styles.discountLabel}>OFF</Text>
                            </View>
                          )}
                          
                          {reward.type === 'shipping' && (
                            <View style={styles.freeShippingContainer}>
                              <Text style={styles.freeShippingText}>FREE</Text>
                              <Text style={styles.shippingLabel}>SHIPPING</Text>
                            </View>
                          )}
                          
                          {discountAmount === 0 && reward.type !== 'shipping' && (
                            <View style={styles.bonusContainer}>
                              <Text style={styles.bonusText}>BONUS</Text>
                              <Text style={styles.bonusLabel}>POINTS</Text>
                            </View>
                          )}
                        </View>
                        
                        {!isSelected && (
                          <TouchableOpacity 
                            style={styles.selectButton}
                            onPress={() => handleApplyReward(reward)}
                          >
                            <Text style={styles.selectButtonText}>Select</Text>
                          </TouchableOpacity>
                        )}
                        
                        {isSelected && (
                          <TouchableOpacity 
                            style={styles.removeButton}
                            onPress={handleRemoveReward}
                          >
                            <Text style={styles.removeButtonText}>Remove</Text>
                          </TouchableOpacity>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
                
                {usableRewards.length === 0 && (
                  <View style={styles.noRewardsContainer}>
                    <Ionicons name="gift-outline" size={48} color={GRAY} />
                    <Text style={styles.noRewardsText}>No rewards available</Text>
                    <Text style={styles.noRewardsSubtext}>Redeem rewards from your digital card to use them here</Text>
                  </View>
                )}
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

            {/* Available Rewards Section */}
            {showAvailableRewards && isLoggedIn && (
              <View style={styles.voucherSection}>
                <Text style={styles.sectionTitle}>Available Rewards to Redeem</Text>
                <Text style={styles.sectionSubtitle}>Redeem rewards to use them in checkout</Text>
                
                {availableRewards && availableRewards.length > 0 ? (
                  <View style={styles.rewardsGrid}>
                    {availableRewards.map((reward, index) => {
                      const isRedeeming = redeemingRewardId === reward._id;
                      
                      return (
                        <TouchableOpacity
                          key={index}
                          style={[styles.rewardCardNew, styles.availableRewardCard]}
                          onPress={() => !isRedeeming && handleRedeemRewardFromModal(reward)}
                          disabled={isRedeeming}
                        >
                          <View style={styles.rewardCardHeader}>
                            <View style={styles.rewardIconContainer}>
                              <Ionicons name={reward.icon || "gift"} size={24} color={GREEN} />
                            </View>
                          </View>
                          
                          <View style={styles.rewardCardContent}>
                            <Text style={styles.rewardName}>{reward.name}</Text>
                            <Text style={styles.rewardDescription}>{reward.description}</Text>
                            
                            {reward.type === 'discount' && (
                              <View style={styles.discountAmountContainer}>
                                <Text style={styles.discountAmount}>₱{reward.value}</Text>
                                <Text style={styles.discountLabel}>OFF</Text>
                              </View>
                            )}
                            
                            {reward.type === 'shipping' && (
                              <View style={styles.freeShippingContainer}>
                                <Text style={styles.freeShippingText}>FREE</Text>
                                <Text style={styles.shippingLabel}>SHIPPING</Text>
                              </View>
                            )}
                            
                            {reward.type === 'bonus' && (
                              <View style={styles.bonusContainer}>
                                <Text style={styles.bonusText}>+{reward.value}</Text>
                                <Text style={styles.bonusLabel}>POINTS</Text>
                              </View>
                            )}
                            
                            <View style={styles.costContainer}>
                              <Text style={styles.costText}>Cost: {reward.cost} points</Text>
                            </View>
                            
                            <TouchableOpacity 
                              style={[styles.redeemButton, isRedeeming && styles.btnDisabled]}
                              onPress={() => !isRedeeming && handleRedeemRewardFromModal(reward)}
                              disabled={isRedeeming}
                            >
                              {isRedeeming ? (
                                <ActivityIndicator color="#fff" size="small" />
                              ) : (
                                <Text style={styles.redeemButtonText}>Redeem</Text>
                              )}
                            </TouchableOpacity>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.noRewardsContainer}>
                    <Ionicons name="gift-outline" size={48} color={GRAY} />
                    <Text style={styles.noRewardsText}>No rewards available to redeem</Text>
                    <Text style={styles.noRewardsSubtext}>Earn more points to unlock rewards</Text>
                  </View>
                )}
              </View>
            )}

            {/* Toggle Available Rewards */}
            {isLoggedIn && (
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={handleViewAllVouchers}
              >
                <Ionicons name="card-outline" size={20} color={GREEN} />
                <Text style={styles.viewAllButtonText}>
                  {showAvailableRewards ? 'Hide Available Rewards' : 'View Available Rewards'}
                </Text>
                <Ionicons 
                  name={showAvailableRewards ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color={GRAY} 
                />
              </TouchableOpacity>
            )}
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

  // New styles for enhanced reward cards
  sectionSubtitle: {
    fontSize: 14,
    color: GRAY,
    marginBottom: 16,
    textAlign: "center",
  },
  
  rewardCardNew: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    width: "48%",
    borderWidth: 2,
    borderColor: BORDER,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: "relative",
  },
  
  rewardCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  
  rewardIconContainer: {
    backgroundColor: GREEN_BG,
    borderRadius: 12,
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  
  rewardIcon: {
    fontSize: 20,
  },
  
  rewardCardContent: {
    alignItems: "center",
    marginBottom: 16,
  },
  
  rewardDescription: {
    fontSize: 12,
    color: GRAY,
    textAlign: "center",
    marginBottom: 12,
  },
  
  discountAmountContainer: {
    backgroundColor: "#FEF3C7",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    marginTop: 8,
  },
  
  discountAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#D97706",
  },
  
  discountLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#D97706",
    marginTop: 2,
  },
  
  freeShippingContainer: {
    backgroundColor: "#DBEAFE",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    marginTop: 8,
  },
  
  freeShippingText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2563EB",
  },
  
  shippingLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#2563EB",
    marginTop: 2,
  },
  
  bonusContainer: {
    backgroundColor: "#F3E8FF",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    marginTop: 8,
  },
  
  bonusText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#7C3AED",
  },
  
  bonusLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#7C3AED",
    marginTop: 2,
  },
  
  selectButton: {
    backgroundColor: GREEN,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
    position: "absolute",
    bottom: 12,
    left: 20,
    right: 20,
  },
  
  selectButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  
  removeButton: {
    backgroundColor: "#EF4444",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
    position: "absolute",
    bottom: 12,
    left: 20,
    right: 20,
  },
  
  removeButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  
  noRewardsContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  
  noRewardsText: {
    fontSize: 16,
    fontWeight: "600",
    color: GRAY,
    marginTop: 12,
    textAlign: "center",
  },
  
  noRewardsSubtext: {
    fontSize: 14,
    color: GRAY,
    marginTop: 4,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  
  availableRewardCard: {
    borderColor: "#D1D5DB",
    borderWidth: 1,
    opacity: 1,
  },
  
  costContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  
  costText: {
    fontSize: 12,
    color: GRAY,
    fontWeight: "500",
  },
  
  redeemButton: {
    backgroundColor: GREEN,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    marginTop: 8,
  },
  
  redeemButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  
  rewardName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
});