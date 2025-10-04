import { Link } from "expo-router";
import { useEffect, useRef } from "react";
import { 
  Dimensions, 
  Image, 
  StyleSheet, 
  Text, 
  View,
  StatusBar,
  Platform,
  TouchableOpacity
} from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, withRepeat, interpolate } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import GoAgriLogo from '../components/GoAgriLogo';
import { platformShadow } from '../src/utils/shadow';
import { platformTextShadow } from '../src/utils/textShadow';

const { width, height } = Dimensions.get('window');

export default function Landing() {
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(50);
  const scaleAnim = useSharedValue(0.8);
  const logoRotateAnim = useSharedValue(0);

  useEffect(() => {
    // Entrance animations (Reanimated)
    fadeAnim.value = withTiming(1, { duration: 1000 });
    slideAnim.value = withTiming(0, { duration: 800 });
    scaleAnim.value = withSpring(1, { damping: 14 });

    // Logo rotation animation (infinite)
    logoRotateAnim.value = withRepeat(withTiming(1, { duration: 20000 }), -1);
  }, []);

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [
      { translateY: slideAnim.value },
      { scale: scaleAnim.value }
    ]
  }));

  const circleOpacityStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  const logoRotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(logoRotateAnim.value, [0, 1], [0, 360])}deg` }],
  }));

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#065F46" />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#065F46', '#10B981', '#34D399']}
        style={s.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Floating Background Elements */}
      <View style={s.floatingElements}>
        <Animated.View style={StyleSheet.flatten([s.floatingCircle, s.circle1, circleOpacityStyle])} />
        <Animated.View style={StyleSheet.flatten([s.floatingCircle, s.circle2, circleOpacityStyle])} />
        <Animated.View style={StyleSheet.flatten([s.floatingCircle, s.circle3, circleOpacityStyle])} />
      </View>

      {/* Main Content */}
      <Animated.View 
        style={StyleSheet.flatten([
          s.content,
          contentAnimatedStyle
        ])}
      >
        {/* Logo Section */}
        <View style={s.logoContainer}>
          <View style={s.logoWrap}>
            <Animated.View style={logoRotateStyle}>
              <GoAgriLogo width={120} height={120} />
            </Animated.View>
          </View>
        </View>

        {/* Title and Tagline */}
        <View style={s.textContainer}>
          <Text style={s.title}>Go Agri Trading</Text>
          <Text style={s.subtitle}>Agricultural Excellence</Text>
          <Text style={s.tagline}>
            Fresh produce and local farm goods at your fingertips.
            Experience the future of agricultural trading.
          </Text>
        </View>

        {/* Feature Highlights */}
        <View style={s.featuresContainer}>
          <View style={s.feature}>
            <Text style={s.featureIcon}>🌱</Text>
            <Text style={s.featureText}>Fresh Produce</Text>
          </View>
          <View style={s.feature}>
            <Text style={s.featureIcon}>🚚</Text>
            <Text style={s.featureText}>Fast Delivery</Text>
          </View>
          <View style={s.feature}>
            <Text style={s.featureIcon}>💰</Text>
            <Text style={s.featureText}>Best Prices</Text>
          </View>
        </View>

        {/* CTA Buttons */}
        <View style={s.ctaContainer}>
          <Link href="/login" asChild>
            <TouchableOpacity style={StyleSheet.flatten([s.btn, s.primary])} activeOpacity={0.85}>
              <Text style={s.primaryBtnText}>Get Started</Text>
            </TouchableOpacity>
          </Link>
          <Link href="/register" asChild>
            <TouchableOpacity style={StyleSheet.flatten([s.btn, s.secondary])} activeOpacity={0.85}>
              <Text style={s.secondaryBtnText}>Create Account</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Guest Option */}
        <View style={s.guestContainer}>
          <Text style={s.orText}>or</Text>
          <Link href="/tabs/home" asChild>
            <TouchableOpacity style={s.guestButton} activeOpacity={0.85}>
              <Text style={s.guestButtonText}>Continue as guest</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },

  floatingElements: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },

  floatingCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  circle1: {
    width: 120,
    height: 120,
    top: '10%',
    left: '10%',
  },

  circle2: {
    width: 80,
    height: 80,
    top: '20%',
    right: '15%',
  },

  circle3: {
    width: 60,
    height: 60,
    bottom: '25%',
    left: '20%',
  },

  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoContainer: {
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoWrap: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    ...platformShadow({ color: '#000', offsetX: 0, offsetY: 8, radius: 16, opacity: 0.3, elevation: 12 }),
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  logo: { 
    width: 140, 
    height: 140,
  },

  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },

  title: { 
    fontSize: 36, 
    fontWeight: '900', 
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    ...platformTextShadow({ color: 'rgba(0,0,0,0.3)', offsetX: 0, offsetY: 2, blur: 4 }),
    letterSpacing: -1,
  },

  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
  },

  tagline: { 
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)', 
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    fontWeight: '500',
  },

  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 40,
    paddingHorizontal: 20,
  },

  feature: {
    alignItems: 'center',
    flex: 1,
  },

  featureIcon: {
    fontSize: 32,
    marginBottom: 8,
  },

  featureText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },

  ctaContainer: {
    width: '100%',
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 32,
    alignItems: 'center',
  },

  btn: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    alignSelf: 'center',
    minWidth: 220,
    maxWidth: 360,
  },

  primary: { 
    backgroundColor: '#FFFFFF',
  },

  primaryBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#065F46',
  },

  secondary: { 
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },

  secondaryBtnText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  guestContainer: {
    alignItems: 'center',
  },

  orText: { 
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 12,
    fontWeight: '500',
  },

  guestButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },

  guestButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});


