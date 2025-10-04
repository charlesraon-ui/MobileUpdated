import { Link } from "expo-router";
import { useEffect, useRef } from "react";
import { 
  Animated, 
  Dimensions, 
  Image, 
  StyleSheet, 
  Text, 
  View,
  StatusBar,
  Platform,
  TouchableOpacity
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import GoAgriLogo from '../components/GoAgriLogo';

const { width, height } = Dimensions.get('window');

export default function Landing() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const logoRotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Logo rotation animation
    Animated.loop(
      Animated.timing(logoRotateAnim, {
        toValue: 1,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const logoRotate = logoRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

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
        <Animated.View style={StyleSheet.flatten([s.floatingCircle, s.circle1, { opacity: fadeAnim }])} />
        <Animated.View style={StyleSheet.flatten([s.floatingCircle, s.circle2, { opacity: fadeAnim }])} />
        <Animated.View style={StyleSheet.flatten([s.floatingCircle, s.circle3, { opacity: fadeAnim }])} />
      </View>

      {/* Main Content */}
      <Animated.View 
        style={StyleSheet.flatten([
          s.content,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim }
            ]
          }
        ])}
      >
        {/* Logo Section */}
        <View style={s.logoContainer}>
          <View style={s.logoWrap}>
            <Animated.View style={{ transform: [{ rotate: logoRotate }] }}>
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
  },

  logoWrap: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
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
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
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
