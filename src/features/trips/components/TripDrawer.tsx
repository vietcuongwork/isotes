import TripSwitcherItem from "@/features/trips/components/TripSwitcherItem";
import { useTripSwitcher } from "@/features/trips/hooks/useTripSwitcher";
import { EXPO_ROUTER } from "@/navigation/route";
import { useTripDrawerStore } from "@/stores/useTripDrawerStore";
import { colors } from "@/themes/color";
import {
  useLocalSearchParams,
  useNavigation,
  useRoute,
  useRouter,
} from "expo-router";
import { StackActions } from "expo-router/react-navigation";
import { List, LucideIcon, Plus, X } from "lucide-react-native";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInLeft,
  SlideOutLeft,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface DrawerActionProps {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
}

const DURATION_MS = 250;

function DrawerAction(props: DrawerActionProps) {
  const { icon: Icon, label, onPress } = props;

  return (
    // NOTE - no token for the 44pt touch target, falling back to min-h-[44px]
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="min-h-[44px] flex-row items-center gap-space-3"
    >
      <View className="h-space-8 w-space-8 items-center justify-center rounded-pill bg-ink-100">
        <Icon size={20} color={colors.ink[900]} />
      </View>
      <Text className="text-ink-900 text-label">{label}</Text>
    </Pressable>
  );
}

export default function TripDrawer() {
  const isOpen = useTripDrawerStore((state) => state.isOpen);
  const close = useTripDrawerStore((state) => state.close);
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const trips = useTripSwitcher(isOpen, tripId);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // The root Stack's trip route, only while this renders in the tabs layout
  const route = useRoute();
  const rootNavigation = useNavigation("/");
  const router = useRouter();
  // NOTE - no token in a style sum, falling back to 64 (space-16) peek, 360 max (DESIGN.md Sizing)
  const panelWidth = Math.min(width - 64, 360);

  // router.replace becomes a tab jump on this route, so the root Stack's route
  // is replaced directly; the old trip unmounts for ADR 0004's draft reset.
  // why: [[Investigate_drawer-switch-replace]]
  const handleSelect = (selectedTripId: string) => {
    close();
    if (selectedTripId === tripId) return;
    // The Expenses tab reads tripId from its own params, as expo-router nests them
    rootNavigation.dispatch(
      StackActions.replace(route.name, {
        tripId: selectedTripId,
        screen: "expense",
        params: { tripId: selectedTripId },
      }),
    );
  };

  const handleNewTrip = () => {
    close();
    router.push(EXPO_ROUTER.CREATE_TRIP);
  };

  // Replaces this screen with Trips when Trips isn't under it (a deep link)
  const handleAllTrips = () => {
    close();
    router.dismissTo(EXPO_ROUTER.TRIPS);
  };

  if (!isOpen) return null;

  return (
    // Without collapsable={false}, removing this view cuts the children's exit animations short
    <View
      collapsable={false}
      accessibilityViewIsModal
      onAccessibilityEscape={close}
      style={StyleSheet.absoluteFill}
    >
      <Animated.View
        entering={FadeIn.duration(DURATION_MS)}
        exiting={FadeOut.duration(DURATION_MS)}
        style={StyleSheet.absoluteFill}
      >
        <View className="flex-1 bg-scrim">
          {/* Only the strip beside the panel takes taps, so its bounds match what's tappable */}
          <Pressable
            testID="drawer-scrim"
            accessibilityRole="button"
            accessibilityLabel="Close menu"
            onPress={close}
            style={[styles.scrimTarget, { left: panelWidth }]}
          />
        </View>
      </Animated.View>

      <Animated.View
        entering={SlideInLeft.duration(DURATION_MS)}
        exiting={SlideOutLeft.duration(DURATION_MS)}
        style={[styles.panel, { width: panelWidth }]}
      >
        <View
          style={{ paddingTop: insets.top }}
          className="flex-1 rounded-r-xl bg-card px-space-5 pb-space-8 shadow-lifted"
        >
          {/* //NOTE - no token for the 44pt touch target, falling back to h-[44px] w-[44px] */}
          {/* //NOTE - no token for 10, falling back to -ml-[10px]: (44 target − 24 icon) / 2 lines the icon up with the gutter */}
          <Pressable
            testID="drawer-close"
            accessibilityRole="button"
            accessibilityLabel="Close menu"
            onPress={close}
            className="-ml-[10px] h-[44px] w-[44px] items-center justify-center"
          >
            <X size={24} color={colors.ink[900]} />
          </Pressable>

          <Text
            accessibilityRole="header"
            className="mt-space-8 pb-space-2 text-ink-500 text-micro"
          >
            Your trips
          </Text>
          {/* grow-0: the list takes its content's height, and scrolls once that's taller than the room left */}
          <FlatList
            data={trips}
            keyExtractor={(data) => data.trip.id}
            renderItem={({ item }) => (
              <TripSwitcherItem
                data={item}
                isCurrent={item.trip.id === tripId}
                onPress={() => handleSelect(item.trip.id)}
              />
            )}
            className="-mx-space-3 grow-0"
            contentContainerClassName="gap-space-1"
            showsVerticalScrollIndicator={false}
          />

          {/* Actions, pinned below the list */}
          <View className="mt-space-4 gap-space-1 border-t border-ink-100 pt-space-3">
            <DrawerAction
              icon={Plus}
              label="New trip"
              onPress={handleNewTrip}
            />
            <DrawerAction
              icon={List}
              label="All trips"
              onPress={handleAllTrips}
            />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { position: "absolute", top: 0, bottom: 0, left: 0 },
  scrimTarget: { position: "absolute", top: 0, bottom: 0, right: 0 },
});
