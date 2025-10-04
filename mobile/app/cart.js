import { Stack, useRouter } from "expo-router";
import CartScreen from "../src/screens/CartScreen";

export default function CartRoute() {
  const router = useRouter();
  const navigation = {
    navigate: (dest, p) => {
      const to = String(dest || "").toLowerCase();
      if (to === "orders") router.push({ pathname: "/orders", params: p });
      else if (to === "login") router.push("/login");
      else router.push("/");
    },
  };

  return (
    <>
      <Stack.Screen options={{ title: "Cart" }} />
      <CartScreen navigation={navigation} />
    </>
  );
}



