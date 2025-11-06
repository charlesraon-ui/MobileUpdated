import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import OtpScreen from "../src/screens/OtpScreen";

export default function OtpRoute() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Minimal navigation shim (for screens expecting navigation.navigate)
  const navigation = {
    navigate: (dest, p) => {
      const to = String(dest || "").toLowerCase();
      if (to === "login") router.push("/login");
      else if (to === "register") router.push("/register");
      else router.push("/");
    },
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <OtpScreen route={{ params }} navigation={navigation} />
    </>
  );
}