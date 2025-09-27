import { Stack } from "expo-router";
import RegisterScreen from "../src/screens/RegisterScreen";

export default function RegisterRoute() {
  return (
    <>
      <Stack.Screen options={{ title: "Register" }} />
      <RegisterScreen />
    </>
  );
}
