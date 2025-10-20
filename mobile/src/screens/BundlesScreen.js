import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppCtx } from '../context/AppContext';
import { Colors } from '../../constants/theme';

const BundlesScreen = () => {
  const router = useRouter();
  const { bundles, fetchBundles, toAbsoluteUrl } = useContext(AppCtx);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    console.log("🔍 BundlesScreen: Component mounted, bundles from context:", bundles);
    console.log("🔍 BundlesScreen: Bundles length:", bundles?.length);
    loadBundles();
  }, []);

  useEffect(() => {
    console.log("🔍 BundlesScreen: Bundles updated:", bundles);
    console.log("🔍 BundlesScreen: Bundles length:", bundles?.length);
  }, [bundles]);

  const loadBundles = async () => {
    setLoading(true);
    try {
      await fetchBundles();
    } catch (error) {
      console.error('Error loading bundles:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBundles();
    setRefreshing(false);
  };

  const BundleCard = ({ bundle }) => {
    const bundlePrice = Number(bundle?.bundlePrice || bundle?.price || 0);
    const originalPrice = Number(bundle?.originalPrice || 0);
    const discount = Number(bundle?.discount || 0);
    const savings = originalPrice > bundlePrice ? originalPrice - bundlePrice : 0;
    
    const imageUrl = bundle?.imageUrl || bundle?.coverImage || '';
    const uri = imageUrl ? (toAbsoluteUrl?.(imageUrl) || imageUrl) : null;

    return (
      <TouchableOpacity
        style={styles.bundleCard}
        activeOpacity={0.85}
        onPress={() => router.push(`/bundle-detail?id=${bundle._id}`)}
      >
        <View style={styles.bundleImageContainer}>
          {uri ? (
            <Image source={{ uri }} style={styles.bundleImage} resizeMode="cover" />
          ) : (
            <View style={styles.bundleImagePlaceholder}>
              <Ionicons name="gift-outline" size={40} color={Colors.light.muted} />
            </View>
          )}
          {discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discount}% OFF</Text>
            </View>
          )}
        </View>
        
        <View style={styles.bundleInfo}>
          <Text style={styles.bundleName} numberOfLines={2}>{bundle.name}</Text>
          <Text style={styles.bundleDescription} numberOfLines={2}>
            {bundle.description}
          </Text>
          
          <View style={styles.bundleItems}>
            <Text style={styles.itemsCount}>
              {bundle.items?.length || 0} items included
            </Text>
          </View>
          
          <View style={styles.priceContainer}>
            <Text style={styles.currentPrice}>₱{bundlePrice.toFixed(2)}</Text>
            {originalPrice > bundlePrice && (
              <Text style={styles.originalPrice}>₱{originalPrice.toFixed(2)}</Text>
            )}
          </View>
          
          {savings > 0 && (
            <Text style={styles.savingsText}>Save ₱{savings.toFixed(2)}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && bundles.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#10B981" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Special Bundles</Text>
        </View>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={Colors.light.accent} />
          <Text style={styles.loadingText}>Loading bundles...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#10B981" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Special Bundles</Text>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {bundles.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="gift-outline" size={80} color={Colors.light.muted} />
            <Text style={styles.emptyTitle}>No Bundles Available</Text>
            <Text style={styles.emptySubtitle}>
              Check back later for special bundle offers!
            </Text>
          </View>
        ) : (
          <View style={styles.bundlesGrid}>
            {bundles.map((bundle) => (
              <BundleCard key={bundle._id} bundle={bundle} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#10B981',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  content: {
    flex: 1,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.light.muted,
  },
  bundlesGrid: {
    padding: 15,
  },
  bundleCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bundleImageContainer: {
    position: 'relative',
    height: 180,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  bundleImage: {
    width: '100%',
    height: '100%',
  },
  bundleImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bundleInfo: {
    padding: 15,
  },
  bundleName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 5,
  },
  bundleDescription: {
    fontSize: 14,
    color: Colors.light.muted,
    marginBottom: 10,
    lineHeight: 20,
  },
  bundleItems: {
    marginBottom: 10,
  },
  itemsCount: {
    fontSize: 12,
    color: Colors.light.accent,
    fontWeight: '600',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  currentPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.accent,
    marginRight: 10,
  },
  originalPrice: {
    fontSize: 16,
    color: Colors.light.muted,
    textDecorationLine: 'line-through',
  },
  savingsText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.light.muted,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
};

export default BundlesScreen;