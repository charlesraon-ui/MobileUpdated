import { Stack } from "expo-router";
import ForgotPasswordScreen from "../src/screens/ForgotPasswordScreen";

export default function ForgotPasswordRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ForgotPasswordScreen />
    </>
  );
}