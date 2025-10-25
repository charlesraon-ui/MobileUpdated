import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppCtx } from '../src/context/AppContext';

const LoyaltyRewards = () => {
  const {
    loyalty,
    availableRewards,
    redemptionHistory,
    rewardsLoading,
    loadAvailableRewards,
    loadRedemptionHistory,
    handleRedeemReward,
    refreshLoyalty,
    isLoggedIn,
  } = useContext(AppCtx);

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('rewards'); // 'rewards' or 'history'

  useEffect(() => {
    if (isLoggedIn) {
      loadAvailableRewards();
      loadRedemptionHistory();
    }
  }, [isLoggedIn]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refreshLoyalty(),
      loadAvailableRewards(),
      loadRedemptionHistory(),
    ]);
    setRefreshing(false);
  };

  const handleRedeem = (reward) => {
    Alert.alert(
      'Redeem Reward',
      `Are you sure you want to redeem "${reward.description}" for ${reward.cost} points?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          onPress: () => handleRedeemReward(reward.name),
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

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <Text style={styles.loginMessage}>Please login to view loyalty rewards</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Loyalty Rewards</Text>
          <TouchableOpacity
            style={styles.digitalCardButton}
            onPress={() => router.push('/digital-card')}
            activeOpacity={0.8}
          >
            <Ionicons name="card-outline" size={20} color="#10B981" />
            <Text style={styles.digitalCardText}>Digital Card</Text>
          </TouchableOpacity>
        </View>
        {loyalty && (
          <View style={styles.pointsContainer}>
            <Text style={styles.pointsLabel}>Available Points:</Text>
            <Text style={styles.pointsValue}>{loyalty.points || 0}</Text>
          </View>
        )}
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'rewards' && styles.activeTab]}
          onPress={() => setActiveTab('rewards')}
        >
          <Text style={[styles.tabText, activeTab === 'rewards' && styles.activeTabText]}>
            Available Rewards
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            Redemption History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'rewards' ? (
          <View style={styles.rewardsContainer}>
            {rewardsLoading ? (
              <ActivityIndicator size="large" color="#4CAF50" style={styles.loader} />
            ) : availableRewards.length > 0 ? (
              availableRewards.map((reward, index) => (
                <View key={index} style={styles.rewardCard}>
                  <View style={styles.rewardHeader}>
                    <Text style={styles.rewardIcon}>{reward.icon}</Text>
                    <View style={styles.rewardInfo}>
                      <Text style={styles.rewardTitle}>{reward.description}</Text>
                      <Text style={styles.rewardCost}>{reward.cost} points</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.redeemButton,
                      !canAfford(reward.cost) && styles.redeemButtonDisabled,
                    ]}
                    onPress={() => handleRedeem(reward)}
                    disabled={!canAfford(reward.cost) || rewardsLoading}
                  >
                    <Text
                      style={[
                        styles.redeemButtonText,
                        !canAfford(reward.cost) && styles.redeemButtonTextDisabled,
                      ]}
                    >
                      {canAfford(reward.cost) ? 'Redeem' : 'Insufficient Points'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.emptyMessage}>No rewards available</Text>
            )}
          </View>
        ) : (
          <View style={styles.historyContainer}>
            {redemptionHistory.length > 0 ? (
              redemptionHistory.map((redemption, index) => (
                <View key={index} style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyTitle}>{redemption.rewardDescription}</Text>
                    <Text style={styles.historyDate}>{formatDate(redemption.redeemedAt)}</Text>
                  </View>
                  <View style={styles.historyDetails}>
                    <Text style={styles.historyCost}>-{redemption.pointsCost} points</Text>
                    <Text style={[styles.historyStatus, styles[redemption.status]]}>
                      {redemption.status}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyMessage}>No redemption history</Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  digitalCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  digitalCardText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsLabel: {
    fontSize: 16,
    color: '#666',
    marginRight: 10,
  },
  pointsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  loader: {
    marginTop: 50,
  },
  rewardsContainer: {
    padding: 15,
  },
  rewardCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rewardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  rewardIcon: {
    fontSize: 30,
    marginRight: 15,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  rewardCost: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  redeemButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  redeemButtonDisabled: {
    backgroundColor: '#ccc',
  },
  redeemButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  redeemButtonTextDisabled: {
    color: '#999',
  },
  historyContainer: {
    padding: 15,
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  historyDate: {
    fontSize: 12,
    color: '#666',
  },
  historyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyCost: {
    fontSize: 14,
    color: '#f44336',
    fontWeight: '600',
  },
  historyStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    textTransform: 'uppercase',
  },
  redeemed: {
    backgroundColor: '#e8f5e8',
    color: '#4CAF50',
  },
  pending: {
    backgroundColor: '#fff3e0',
    color: '#ff9800',
  },
  expired: {
    backgroundColor: '#ffebee',
    color: '#f44336',
  },
  emptyMessage: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 50,
  },
  loginMessage: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 50,
  },
});

export default LoyaltyRewards;