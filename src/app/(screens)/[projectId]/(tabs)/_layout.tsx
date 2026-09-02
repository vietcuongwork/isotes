import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs initialRouteName="expense" screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="expense" options={{ title: "Expenses" }} />
    </Tabs>
  );
}
