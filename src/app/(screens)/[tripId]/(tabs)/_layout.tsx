import FloatingTabBar from "@/components/tabbar/FloatingTabBar";
import TripDrawer from "@/features/trips/components/TripDrawer";
import { useTripDrawerStore } from "@/stores/useTripDrawerStore";
import { Tabs } from "expo-router";
import { ChartNoAxesColumn, ReceiptText, Scale } from "lucide-react-native";
import { useEffect } from "react";

export default function TabLayout() {
  const closeDrawer = useTripDrawerStore((state) => state.close);

  // The store is global, so a drawer left open would reopen on the next trip
  useEffect(() => {
    return () => closeDrawer();
  }, [closeDrawer]);

  return (
    <>
      <Tabs
        initialRouteName="expense"
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen
          name="expense"
          options={{
            title: "Expenses",
            tabBarIcon: ({ color, size }) => (
              <ReceiptText color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="balance"
          options={{
            title: "Balance",
            tabBarIcon: ({ color, size }) => (
              <Scale color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="insights"
          options={{
            title: "Insights",
            tabBarIcon: ({ color, size }) => (
              <ChartNoAxesColumn color={color} size={size} />
            ),
          }}
        />
      </Tabs>
      {/* After Tabs, so it covers the tab bar */}
      <TripDrawer />
    </>
  );
}
