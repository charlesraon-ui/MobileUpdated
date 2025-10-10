import { Stack } from "expo-router";
import LoginScreen from "../src/screens/LoginScreen";

export default function LoginRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LoginScreen />
    </>
  );
}
