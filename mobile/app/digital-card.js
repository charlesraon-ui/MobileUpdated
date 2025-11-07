import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppCtx } from '../src/context/AppContext';
import { safeGoBackToProfile } from '../src/utils/navigationUtils';

const { width } = Dimensions.get('window');

export default function DigitalCardScreen() {
  const {
    user,
    loyalty,
    availableRewards,
    redemptionHistory,
    rewardsLoading,
    loadAvailableRewards,
    loadUsableRewards,
    loadRedemptionHistory,
    handleRedeemReward,
    applyRewardDiscount,
    isLoggedIn,
    getLoyaltyStatus,
  } = useContext(AppCtx);

  const params = useLocalSearchParams();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      loadData();
    }
  }, [isLoggedIn]);

  const loadData = async () => {
    try {
      await Promise.all([
        loadAvailableRewards(),
        loadUsableRewards(),
        loadRedemptionHistory(),
        getLoyaltyStatus(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleBackNavigation = () => {
    const returnTo = params?.returnTo;
    if (returnTo === 'checkout') {
      router.push('/checkout');
    } else {
      safeGoBackToProfile();
    }
  };

  const handleRedeem = async (reward) => {
    Alert.alert(
      'Redeem Reward',
      `Are you sure you want to redeem "${reward.description}" for ${reward.cost} points?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          onPress: async () => {
            const success = await handleRedeemReward(reward.name);
            if (success) {
              // Show success message and guide to product selection
              Alert.alert(
                'Reward Redeemed!',
                `Your ${reward.description} has been redeemed successfully! Let's find products to apply your discount.`,
                [
                  {
                    text: 'Shop Now',
                    onPress: () => {
                      // Apply the reward discount and navigate to products
                       applyRewardDiscount({
                         name: reward.name,
                         description: reward.description,
                         type: reward.type,
                         value: reward.value
                       });
                      router.push('/product');
                    }
                  },
                  {
                    text: 'Later',
                    style: 'cancel'
                  }
                ]
              );
            }
          },
        },
      ]
    );
  };

  const canAfford = (cost) => {
    return loyalty?.points >= cost;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getCardTheme = (tier) => {
    switch (String(tier || 'sprout').toLowerCase()) {
      case 'sprout':
        return { 
          colors: ['#10B981', '#059669'], 
          textColor: '#FFFFFF',
          accentColor: '#D1FAE5' 
        };
      case 'seedling':
        return { 
          colors: ['#22C55E', '#16A34A'], 
          textColor: '#FFFFFF',
          accentColor: '#BBF7D0' 
        };
      case 'cultivator':
        return { 
          colors: ['#84CC16', '#65A30D'], 
          textColor: '#1F2937',
          accentColor: '#D9F99D' 
        };
      case 'bloom':
        return { 
          colors: ['#8B5CF6', '#7C3AED'], 
          textColor: '#FFFFFF',
          accentColor: '#DDD6FE' 
        };
      case 'harvester':
        return { 
          colors: ['#F59E0B', '#D97706'], 
          textColor: '#1F2937',
          accentColor: '#FDE68A' 
        };
      default:
        return { 
          colors: ['#10B981', '#059669'], 
          textColor: '#FFFFFF',
          accentColor: '#D1FAE5' 
        };
    }
  };

  const renderDigitalCard = () => {
    const theme = getCardTheme(loyalty?.tier?.name);
    
    return (
      <View style={styles.cardContainer}>
        <LinearGradient
          colors={theme.colors}
          style={styles.digitalCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.textColor }]}>
              GoAgri Loyalty Card
            </Text>
            <Ionicons 
              name="card" 
              size={24} 
              color={theme.textColor} 
            />
          </View>

          {/* Member Info */}
          <View style={styles.memberInfo}>
            <Text style={[styles.memberName, { color: theme.textColor }]}>
              {user?.name || 'Member'}
            </Text>
            <Text style={[styles.memberEmail, { color: theme.accentColor }]}>
              {user?.email || ''}
            </Text>
          </View>

          {/* Points Display */}
          <View style={styles.pointsDisplay}>
            <Text style={[styles.pointsLabel, { color: theme.accentColor }]}>
              Available Points
            </Text>
            <Text style={[styles.pointsValue, { color: theme.textColor }]}>
              {loyalty?.points || 0}
            </Text>
          </View>

          {/* Tier Info */}
          <View style={styles.tierInfo}>
            <View style={styles.tierBadge}>
              <Text style={[styles.tierText, { color: theme.textColor }]}>
                {loyalty?.tier?.name?.toUpperCase() || 'SPROUT'}
              </Text>
            </View>
            <Text style={[styles.tierDescription, { color: theme.accentColor }]}>
              {loyalty?.tier?.description || 'Welcome to GoAgri!'}
            </Text>
          </View>


        </LinearGradient>
      </View>
    );
  };

  const renderSectionHeader = (title, icon) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderContent}>
        <Ionicons name={icon} size={20} color="#10B981" />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
    </View>
  );

  const renderRewards = () => (
    <View style={styles.sectionContainer}>
      {renderSectionHeader('Available Rewards', 'gift')}
      <View style={styles.rewardsContainer}>
        {rewardsLoading ? (
          <ActivityIndicator size="large" color="#10B981" />
        ) : availableRewards.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="gift-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>No Rewards Available</Text>
            <Text style={styles.emptyStateText}>
              Keep shopping to unlock amazing rewards!
            </Text>
          </View>
        ) : (
          <View style={styles.rewardsGrid}>
            {availableRewards.map((reward, index) => (
              <View key={index} style={styles.rewardCard}>
                <View style={styles.rewardIcon}>
                  <Ionicons name="gift" size={24} color="#10B981" />
                </View>
                <Text style={styles.rewardName}>{reward.name}</Text>
                <Text style={styles.rewardDescription}>{reward.description}</Text>
                <Text style={styles.rewardCost}>{reward.cost} points</Text>
                <TouchableOpacity
                  style={[
                    styles.redeemButton,
                    !canAfford(reward.cost) && styles.redeemButtonDisabled
                  ]}
                  onPress={() => handleRedeem(reward)}
                  disabled={!canAfford(reward.cost)}
                >
                  <Text style={[
                    styles.redeemButtonText,
                    !canAfford(reward.cost) && styles.redeemButtonTextDisabled
                  ]}>
                    {canAfford(reward.cost) ? 'Redeem' : 'Insufficient Points'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  const renderHistory = () => (
    <View style={styles.sectionContainer}>
      {renderSectionHeader('Redemption History', 'time')}
      <View style={styles.historyContainer}>
        {redemptionHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>No Redemption History</Text>
            <Text style={styles.emptyStateText}>
              Your redeemed rewards will appear here.
            </Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {redemptionHistory.map((item, index) => (
              <View key={index} style={styles.historyItem}>
                <View style={styles.historyIcon}>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                </View>
                <View style={styles.historyDetails}>
                  <Text style={styles.historyReward}>{item.rewardName}</Text>
                  <Text style={styles.historyDate}>{formatDate(item.redeemedAt)}</Text>
                </View>
                <Text style={styles.historyCost}>-{item.pointsUsed} pts</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackNavigation}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loyalty Rewards</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loginPrompt}>
          <Text style={styles.loginMessage}>Please login to view your loyalty rewards</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackNavigation}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Loyalty Rewards</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Digital Card at Top */}
        {renderDigitalCard()}
        
        {/* Rewards Section */}
        {renderRewards()}
        
        {/* History Section */}
        {renderHistory()}
        
        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#10B981',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#10B981',
  },
  content: {
    flex: 1,
  },
  cardContainer: {
    padding: 20,
  },
  digitalCard: {
    borderRadius: 16,
    padding: 24,
    minHeight: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  memberInfo: {
    marginBottom: 20,
  },
  memberName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  memberEmail: {
    fontSize: 14,
    opacity: 0.8,
  },
  pointsDisplay: {
    marginBottom: 20,
  },
  pointsLabel: {
    fontSize: 12,
    marginBottom: 4,
    opacity: 0.8,
  },
  pointsValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  tierInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  tierBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  tierText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tierDescription: {
    fontSize: 12,
    opacity: 0.8,
    flex: 1,
  },
  cardNumber: {
    alignItems: 'flex-end',
  },
  cardNumberText: {
    fontSize: 14,
    fontFamily: 'monospace',
    opacity: 0.8,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  rewardsContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  rewardsGrid: {
    gap: 16,
  },
  rewardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  rewardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  rewardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  rewardDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  rewardCost: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 12,
  },
  redeemButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  redeemButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  redeemButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  redeemButtonTextDisabled: {
    color: '#9CA3AF',
  },
  historyContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  historyIcon: {
    marginRight: 12,
  },
  historyDetails: {
    flex: 1,
  },
  historyReward: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  historyCost: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  loginPrompt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  loginMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  bottomPadding: {
    height: 40,
  },
});