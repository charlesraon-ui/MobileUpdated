import { useLocalSearchParams } from 'expo-router';
import ProductDetailScreen from "../src/screens/ProductDetailScreen";

export default function ProductDetail() {
  const params = useLocalSearchParams();
  const productId = params['product-detail'];
  
  const route = { params: { id: productId } };
  
  return <ProductDetailScreen route={route} />;
}