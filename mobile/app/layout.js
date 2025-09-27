// app/_layout.js
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import AppProvider from "../src/context/AppContext"; // <-- import provider

export default function RootLayout() {
  return (
    <AppProvider>
      <View style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerShown: true,
            headerTitleAlign: "center",
          }}
        />
        <StatusBar style="auto" />
      </View>
    </AppProvider>
  );
}
