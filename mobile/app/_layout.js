// app/_layout.js
import { Stack } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import AppProvider from "../src/context/AppContext"; // <-- path from /app to /src/context

// Ensure OAuth popup completes and closes on any route load
WebBrowser.maybeCompleteAuthSession();

export default function RootLayout() {
  return (
    <AppProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AppProvider>
  );
}
