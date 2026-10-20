import { colors } from "@/themes/color";
import { cn } from "@/utils/cn";
import type {
  BottomTabBarProps,
  BottomTabNavigationOptions,
} from "expo-router/js-tabs";
import { Pressable, Text, View } from "react-native";

interface TabButtonProps {
  label: string;
  accessibilityLabel: string;
  focused: boolean;
  renderIcon: BottomTabNavigationOptions["tabBarIcon"];
  onPress: () => void;
}

// ExpenseScreen draws the docked FAB in the space this route leaves free
const FAB_ROUTE = "expense";

function TabButton(props: TabButtonProps) {
  const { label, accessibilityLabel, focused, renderIcon, onPress } = props;

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      className={cn(
        "h-space-12 items-center justify-center rounded-pill",
        focused ? "flex-row gap-space-2 bg-ink-900 px-space-4" : "w-space-12",
      )}
    >
      {renderIcon?.({
        focused,
        color: focused ? colors.card : colors.ink[500],
        size: focused ? 20 : 24,
      })}
      {focused && <Text className="text-card text-label">{label}</Text>}
    </Pressable>
  );
}

export default function FloatingTabBar(props: BottomTabBarProps) {
  const { state, descriptors, navigation } = props;
  const isFabRoute = state.routes[state.index]?.name === FAB_ROUTE;

  return (
    // NOTE - no token for 96 (20 gutter + 64 fab-docked + 12 gap), falling back to right-[96px]
    <View
      className={cn(
        "absolute bottom-space-8 left-space-5 h-space-16 flex-row items-center justify-around rounded-pill bg-card px-space-2 shadow-lifted",
        isFabRoute ? "right-[96px]" : "right-space-5",
      )}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.title ?? route.name;
        const focused = index === state.index;

        // Same event and label as the default bar, so listeners and the flows' selectors keep working
        const handlePress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <TabButton
            key={route.key}
            label={label}
            accessibilityLabel={`${label}, tab, ${index + 1} of ${state.routes.length}`}
            focused={focused}
            renderIcon={options.tabBarIcon}
            onPress={handlePress}
          />
        );
      })}
    </View>
  );
}
