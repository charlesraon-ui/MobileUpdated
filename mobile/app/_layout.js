// app/_layout.js
import { Stack } from "expo-router";
import AppProvider from "../src/context/AppContext"; // <-- path from /app to /src/context

export default function RootLayout() {
  return (
    <AppProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AppProvider>
  );
}
