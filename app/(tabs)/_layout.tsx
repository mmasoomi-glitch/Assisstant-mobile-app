import { Tabs } from "expo-router";
import { BRAND } from "../../constants/Brand";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: BRAND.bg,
          borderTopColor: BRAND.border,
        },
        tabBarActiveTintColor: BRAND.accent,
        tabBarInactiveTintColor: BRAND.muted,
        headerStyle: { backgroundColor: BRAND.bg },
        headerTintColor: BRAND.text,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="leads" options={{ title: "Leads" }} />
      <Tabs.Screen name="whatsapp" options={{ title: "WhatsApp" }} />
      <Tabs.Screen name="more" options={{ title: "More" }} />
    </Tabs>
  );
}
