import { colors } from "@/themes/color";
import { Tabs } from "expo-router";
import { ChartPie, ReceiptText, Scale } from "lucide-react-native";

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="expense"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.orange[400],
        tabBarInactiveTintColor: colors.grey[200],
        tabBarStyle: {
          backgroundColor: colors.grey[950],
          borderTopColor: colors.grey[825],
          borderTopWidth: 1,
          paddingTop: 12,
        },
      }}
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
          tabBarIcon: ({ color, size }) => <Scale color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: "Insights",
          tabBarIcon: ({ color, size }) => (
            <ChartPie color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
