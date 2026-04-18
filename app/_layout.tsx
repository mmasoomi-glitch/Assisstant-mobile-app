import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { BRAND } from "../constants/Brand";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: BRAND.bg },
          headerTintColor: BRAND.text,
          contentStyle: { backgroundColor: BRAND.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
