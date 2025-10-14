import { Redirect, Stack, useRouter } from "expo-router";
import ProfileScreen from "../src/screens/ProfileScreen";

export default function ProfileRoute() {
  const router = useRouter();
  const navigation = {
    navigate: (dest) => {
      const to = String(dest || "").toLowerCase();
      if (to === "login") router.push("/login");
      else if (to === "register") router.push("/register");
      else router.push("/home");
    },
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ProfileScreen navigation={navigation} />
      <Redirect href="/tabs/profile" />;
    </>
  );
}
