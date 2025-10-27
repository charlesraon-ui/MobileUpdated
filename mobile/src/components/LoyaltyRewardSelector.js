import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppCtx } from '../context/AppContext';

const GREEN = "#10B981";
const GREEN_BG = "#ECFDF5";
const GREEN_BORDER = "#A7F3D0";
const GRAY = "#6B7280";
const BORDER = "#E5E7EB";

export default function LoyaltyRewardSelector({ 
  onRewardSelected, 
  selectedReward, 
  rewardDiscount 
}) {
  const {
    selectableRewards,
    loadSelectableRewards,
    isLoggedIn,
  } = useContext(AppCtx);

  const [dropdownVisible, setDropdownVisible] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      loadSelectableRewards();
    }
  }, [isLoggedIn, loadSelectableRewards]);

  const showToast = (message) => {
    Alert.alert("Loyalty Reward", message);
  };

  const handleSelectReward = (reward) => {
    onRewardSelected(reward);
    setDropdownVisible(false);
    showToast(`${reward.displayName} applied!`);
  };

  const handleRemoveReward = () => {
    onRewardSelected(null);
    showToast("Loyalty reward removed");
  };

  const renderSelectorButton = () => (
    <TouchableOpacity
      style={styles.selectorButton}
      onPress={() => setDropdownVisible(true)}
      disabled={!isLoggedIn || selectableRewards.length === 0}
    >
      <View style={styles.buttonContent}>
        <Ionicons name="gift" size={20} color={GREEN} />
        <Text style={styles.buttonText}>
          {!isLoggedIn 
            ? "Login to use loyalty rewards"
            : selectableRewards.length === 0 
              ? "No loyalty rewards available"
              : "Select Loyalty Reward"
          }
        </Text>
        {isLoggedIn && selectableRewards.length > 0 && (
          <Ionicons name="chevron-down" size={16} color={GRAY} />
        )}
      </View>
    </TouchableOpacity>
  );

  const renderSelectedReward = () => (
    <View style={styles.selectedRewardContainer}>
      <View style={styles.selectedRewardInfo}>
        <Ionicons name="gift" size={16} color={GREEN} />
        <Text style={styles.selectedRewardText}>
          {selectedReward.displayName} - ₱{rewardDiscount.toFixed(2)} off
        </Text>
      </View>
      <TouchableOpacity
        onPress={handleRemoveReward}
        style={styles.removeButton}
      >
        <Ionicons name="close" size={16} color={GRAY} />
      </TouchableOpacity>
    </View>
  );

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
            <Text style={styles.modalTitle}>Select Loyalty Reward</Text>
            <TouchableOpacity
              onPress={() => setDropdownVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={GRAY} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {selectableRewards.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="gift-outline" size={48} color={GRAY} />
                <Text style={styles.emptyStateText}>No loyalty rewards available</Text>
                <Text style={styles.emptyStateSubtext}>
                  Redeem rewards from your loyalty points to use them here
                </Text>
              </View>
            ) : (
              <View style={styles.rewardsGrid}>
                {selectableRewards.map((reward, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.rewardCard,
                      selectedReward?.id === reward.id && styles.rewardCardSelected
                    ]}
                    onPress={() => handleSelectReward(reward)}
                    disabled={selectedReward?.id === reward.id}
                  >
                    <View style={styles.rewardIcon}>
                      <Text style={styles.rewardEmoji}>{reward.icon}</Text>
                    </View>
                    <Text style={styles.rewardName}>{reward.displayName}</Text>
                    <Text style={styles.rewardDiscount}>
                      {reward.type === 'discount' 
                        ? `₱${reward.value} off`
                        : reward.type === 'shipping'
                          ? 'Free shipping'
                          : 'Reward'
                      }
                    </Text>
                    {selectedReward?.id === reward.id && (
                      <View style={styles.selectedBadge}>
                        <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {selectedReward ? renderSelectedReward() : renderSelectorButton()}
      {renderDropdownModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  selectorButton: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buttonText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: GRAY,
  },
  selectedRewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: GREEN_BG,
    borderColor: GREEN_BORDER,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  selectedRewardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedRewardText: {
    marginLeft: 8,
    fontSize: 14,
    color: GREEN,
    fontWeight: '500',
  },
  removeButton: {
    padding: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '90%',
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: GRAY,
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: GRAY,
    textAlign: 'center',
    marginTop: 4,
  },
  rewardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  rewardCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    position: 'relative',
  },
  rewardCardSelected: {
    borderColor: GREEN,
    backgroundColor: GREEN_BG,
  },
  rewardIcon: {
    marginBottom: 8,
  },
  rewardEmoji: {
    fontSize: 24,
  },
  rewardName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  rewardDiscount: {
    fontSize: 11,
    color: GREEN,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: GREEN,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});