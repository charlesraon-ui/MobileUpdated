import { router } from "expo-router";
import { useEffect } from "react";
import {
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  View,
  StatusBar,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import GoAgriLogo from "../components/GoAgriLogo";

const { width, height } = Dimensions.get('window');
  // Responsive image height percentage by device height (picture always taller than green)
  const imagePct = height < 680 ? 0.58 : height < 820 ? 0.64 : 0.68;
  // Responsive logo size (even bigger across devices)
  const logoSize = width < 380 ? 130 : width < 768 ? 150 : 186;
  // Offset to move the title down in the dark section
  const titleOffset = height < 680 ? 32 : height < 820 ? 40 : 48;

export default function Landing() {
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(40);
  const scaleAnim = useSharedValue(0.98);

  useEffect(() => {
    fadeAnim.value = withTiming(1, { duration: 800 });
    slideAnim.value = withTiming(0, { duration: 700 });
    scaleAnim.value = withSpring(1, { damping: 12 });
  }, []);

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }, { scale: scaleAnim.value }],
  }));

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.scroll}>
      <StatusBar barStyle="light-content" />
      {/* Header removed as requested */}

      {/* Card */}
      <Animated.View style={[s.card, contentAnimatedStyle]}>
        {/* Top section with solid background color (no hero image) */}
        <View style={s.imageWrap}>
          {/* Logo centered over the background */}
          <View style={s.imageOverlay}>
            <View
              style={[
                s.logoBadge,
                { width: logoSize + 32, height: logoSize + 32, borderRadius: (logoSize + 32) / 2 },
              ]}
            >
              <GoAgriLogo width={logoSize} height={logoSize} />
            </View>
          </View>
        </View>

        {/* Dark body */}
        <View style={s.cardBody}>
          <View style={[s.textBlock, { paddingTop: titleOffset }] }>
            <Text style={s.title}>Welcome to Go Agri Trading</Text>
            <Text style={[s.subtitle, s.subtitleUnderTitle]}>
              Your trusted partner for premium fertilizers, chemicals, seeds and farm tools to help your crops thrive.
            </Text>
            
            {/* Bible Verse */}
            <View style={s.verseContainer}>
              <Text style={s.verseReference}>John 3:16</Text>
              <Text style={s.verseText}>
                "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life."
              </Text>
            </View>
          </View>

          <View style={s.ctaBottom}>
            <TouchableOpacity
              style={s.cta}
              activeOpacity={0.8}
              onPress={() => router.push("/login")}
            >
              <Text style={s.ctaText}>Get Started</Text>
            </TouchableOpacity>
            
            {/* Additional info */}
            <Text style={s.footerText}>
              Join thousands of farmers who trust us
            </Text>
          </View>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F1F5F9" },
  scroll: { flexGrow: 1, backgroundColor: "#F1F5F9", minHeight: height },
  
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 0,
    overflow: "hidden",
    flex: 1,
    width: "100%",
    alignSelf: "stretch",
    ...Platform.select({
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: { elevation: 8 },
    }),
  },
  imageWrap: { 
    height: Math.round(height * imagePct), 
    overflow: "hidden",
    backgroundColor: "#A7F3D0"
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  logoBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
    }),
  },
  cardBody: {
    backgroundColor: "#065F46",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 36,
    flex: 1,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -20,
    justifyContent: "flex-start",
  },
  textBlock: {
    gap: 14,
    paddingTop: 18,
    alignItems: "center",
  },
  ctaBottom: {
    marginTop: "auto",
    alignItems: "center",
    gap: 18,
  },
  title: { 
    color: "#FFFFFF", 
    fontSize: 33, 
    fontWeight: "900", 
    letterSpacing: -0.6, 
    textAlign: "center",
    lineHeight: 40,
  },
  subtitle: { 
    color: "#E7F9F2", 
    marginTop: 12, 
    fontSize: 17, 
    lineHeight: 27, 
    textAlign: "center",
    paddingHorizontal: 8,
  },
  subtitleUnderTitle: { marginTop: 16 },
  verseContainer: {
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "rgba(16, 185, 129, 0.14)",
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#10B981",
    marginHorizontal: 8,
  },
  verseReference: {
    color: "#10B981",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  verseText: {
    color: "#F0FFFB",
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
    fontStyle: "italic",
  },
  cta: {
    marginTop: 24,
    backgroundColor: "#10B981",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: "center",
    alignSelf: "stretch",
    width: "100%",
    ...Platform.select({
      default: {
        shadowColor: "#10B981",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  ctaText: { 
    color: "#064E3B", 
    fontSize: 17, 
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  footerText: {
    color: "#BFF7E4",
    fontSize: 14,
    textAlign: "center",
    fontWeight: "500",
  },
});


