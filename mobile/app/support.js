import { Stack } from "expo-router";
import CustomerSupportScreen from "../src/screens/CustomerSupportScreen";

export default function SupportRoute() {
  return (
    <>
      <Stack.Screen options={{ title: "Customer Support" }} />
      <CustomerSupportScreen />
    </>
  );
}