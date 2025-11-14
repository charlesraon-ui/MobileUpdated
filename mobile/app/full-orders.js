import { Stack, useRouter } from "expo-router";
import OrdersScreen from "../src/screens/OrdersScreen";

export default function FullOrdersRoute() {
  const router = useRouter();

  // Provide a minimal `navigation` shim so your screen's `navigation.navigate("Login")`
  // keeps working with expo-router file routes:
  const navigation = {
    navigate: (dest, p) => {
      const to = String(dest || "").toLowerCase();
      if (to === "login") router.push("/login");
      else if (to === "register") router.push("/register");
      else if (to === "orders") router.push({ pathname: "/full-orders", params: p });
      else if (to === "home") router.push("/home");
      else if (to === "profile") router.replace("/tabs/profile");
      else router.push("/");
    },
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <OrdersScreen route={{ params: {} }} navigation={navigation} />
    </>
  );
}