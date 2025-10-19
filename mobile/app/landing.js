import { Link } from "expo-router";
import { useEffect } from "react";
import {
  Dimensions,
  Image,
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
      <StatusBar barStyle="dark-content" />
      {/* Header removed to center logo on card seam */}

      {/* Card */}
      <Animated.View style={[s.card, contentAnimatedStyle]}>
        {/* Top image */}
        <View style={s.imageWrap}>
          <Image
            source={require("../../assets/images/farm-landing-background.png")}
            style={s.cardImage}
          />
          {/* Logo centered in the middle of the image */}
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
            <Link href="/login" asChild>
              <TouchableOpacity style={s.cta} activeOpacity={0.8}>
                <Text style={s.ctaText}>Get Started</Text>
              </TouchableOpacity>
            </Link>
            
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
  screen: { flex: 1, backgroundColor: "#F8FAFC" },
  scroll: { flexGrow: 1, backgroundColor: "#F8FAFC", minHeight: height },
  header: { paddingTop: 24, paddingHorizontal: 20, marginBottom: 8 },
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
  imageWrap: { height: Math.round(height * imagePct), overflow: "hidden" },
  cardImage: { width: "100%", height: "100%", resizeMode: "cover" },
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
    backgroundColor: "rgba(255, 255, 255, 0.95)",
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
    backgroundColor: "#064E3B",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    flex: 1,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -20,
    justifyContent: "flex-start",
  },
  textBlock: {
    gap: 12,
    paddingTop: 16,
    alignItems: "center",
  },
  ctaBottom: {
    marginTop: "auto",
    alignItems: "center",
    gap: 16,
  },
  title: { 
    color: "#FFFFFF", 
    fontSize: 32, 
    fontWeight: "900", 
    letterSpacing: -0.8, 
    textAlign: "center",
    lineHeight: 38,
  },
  subtitle: { 
    color: "#D1FAE5", 
    marginTop: 12, 
    fontSize: 17, 
    lineHeight: 26, 
    textAlign: "center",
    paddingHorizontal: 8,
  },
  subtitleUnderTitle: { marginTop: 16 },
  verseContainer: {
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "rgba(16, 185, 129, 0.12)",
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
    color: "#E6FFFA",
    fontSize: 15,
    lineHeight: 22,
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
    color: "#A7F3D0",
    fontSize: 14,
    textAlign: "center",
    fontWeight: "500",
  },
});


