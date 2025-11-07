// app/_layout.js
import { Stack } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import AppProvider from "../src/context/AppContext"; // <-- path from /app to /src/context
import { useFonts } from "expo-font";
// Preload Ionicons font to avoid FontFaceObserver timeouts on web
// (Icon fonts are heavily used across screens; we gate render until loaded.)
// We also handle load errors gracefully without crashing the app.

// Ensure OAuth popup completes and closes on any route load
WebBrowser.maybeCompleteAuthSession();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Ionicons: require("@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf"),
  });

  if (fontError) {
    console.warn("Ionicons font failed to load:", fontError);
  }

  // Render a minimal placeholder while fonts load to prevent web timeouts
  if (!fontsLoaded) {
    return null;
  }

  return (
    <AppProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AppProvider>
  );
}
