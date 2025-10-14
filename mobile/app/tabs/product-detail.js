import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import ProductDetailScreen from '../../src/screens/ProductDetailScreen';

export default function ProductDetailRoute() {
  const { id } = useLocalSearchParams();
  const route = { params: { id } };
  return <ProductDetailScreen route={route} />;
}