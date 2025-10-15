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
  const imagePct = height < 680 ? 0.62 : height < 820 ? 0.68 : 0.72;
  // Responsive logo size (even bigger across devices)
  const logoSize = width < 380 ? 120 : width < 768 ? 140 : 176;
  // Offset to move the title down in the dark section
  const titleOffset = height < 680 ? 40 : height < 820 ? 48 : 56;

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
                { width: logoSize + 24, height: logoSize + 24, borderRadius: (logoSize + 24) / 2 },
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
              Go Agri Trading is a company that sells fertilizers, chemicals,
              seeds and other farm tools.
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
              <TouchableOpacity style={s.cta} activeOpacity={0.9}>
                <Text style={s.ctaText}>Get Started</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F3F4F6" },
  scroll: { flexGrow: 1, backgroundColor: "#F3F4F6", minHeight: height },
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
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: { elevation: 6 },
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
    backgroundColor: "rgba(236, 253, 245, 0.85)",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
    }),
  },
  cardBody: {
    backgroundColor: "#064E3B",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -16,
    justifyContent: "flex-start",
  },
  textBlock: {
    gap: 8,
    paddingTop: 12,
    alignItems: "center",
  },
  ctaBottom: {
    marginTop: "auto",
    alignItems: "stretch",
  },
  title: { color: "#ECFDF5", fontSize: 28, fontWeight: "900", letterSpacing: -0.6, textAlign: "center" },
  subtitle: { color: "#D1FAE5", marginTop: 8, fontSize: 16, lineHeight: 22, textAlign: "center" },
  subtitleUnderTitle: { marginTop: 12 },
  verseContainer: {
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#10B981",
  },
  verseReference: {
    color: "#10B981",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },
  verseText: {
    color: "#D1FAE5",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    fontStyle: "italic",
  },
  cta: {
    marginTop: 18,
    backgroundColor: "#10B981",
    paddingVertical: 14,
    borderRadius: 26,
    alignItems: "center",
    alignSelf: "stretch",
    width: "100%",
  },
  ctaText: { color: "#062C22", fontSize: 15, fontWeight: "800" },
});


