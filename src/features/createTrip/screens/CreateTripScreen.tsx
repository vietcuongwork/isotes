import PrimaryButton from "@/components/PrimaryButton";
import { colors } from "@/themes/color";
import { useIsFocused } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import CreateTripForm from "../components/CreateTripForm";
import { useCreateTripScreen } from "../hooks/useCreateTripScreen";

// Create rests 40 above the bottom edge; with the keyboard up it moves by the
// keyboard's height, and 24 more back down leaves it 16 (space-4) above the keyboard
const CREATE_STICKY_OFFSET = { closed: 0, opened: 40 - 16 };
// A focused field stops above Create: 52 button + 16 under it + 16 over it
const FIELD_BOTTOM_OFFSET = 52 + 16 + 16;

export default function CreateTripScreen() {
  const {
    form,
    handleCurrencyChange,
    onFormSubmit,
    scrollViewRef,
    formRef,
    onInvalid,
    onBack,
  } = useCreateTripScreen();
  // StatusBar props merge in mount order and the pushed trip keeps this
  // screen mounted, so dark text is rendered only while Create trip is on top
  const isFocused = useIsFocused();

  const { control, handleSubmit, formState } = form;

  return (
    <SafeAreaView className="flex-1 bg-ink-50" edges={["top"]}>
      {isFocused && <StatusBar style="dark" />}

      <KeyboardAwareScrollView
        keyboardShouldPersistTaps="handled"
        bottomOffset={FIELD_BOTTOM_OFFSET}
        ref={scrollViewRef}
      >
        {/* //NOTE - no token for 108 (52 button + 40 bottom offset + 16 space-4), falling back to pb-[108px] */}
        <View className="px-space-5 pb-[108px] pt-space-2">
          {/* Back */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={onBack}
            // NOTE - no token for the 44pt touch target, falling back to h-[44px] w-[44px]
            className="h-[44px] w-[44px] items-center justify-center rounded-pill bg-ink-100"
          >
            <ChevronLeft size={24} strokeWidth={1.75} color={colors.ink[900]} />
          </Pressable>

          {/* Title */}
          <Text
            accessibilityRole="header"
            className="mt-space-6 text-ink-900 text-display"
          >
            New <Text className="text-ink-400">trip</Text>
          </Text>
          <Text className="mt-space-2 text-ink-500 text-body">
            You can change any of this later.
          </Text>

          <CreateTripForm
            ref={formRef}
            control={control}
            handleCurrencyChange={handleCurrencyChange}
            scrollViewRef={scrollViewRef}
          />
        </View>
      </KeyboardAwareScrollView>

      {/* Create, 40 above the screen's bottom edge as on the board, riding above the keyboard */}
      <View className="absolute bottom-space-10 left-space-5 right-space-5">
        <KeyboardStickyView offset={CREATE_STICKY_OFFSET}>
          <PrimaryButton
            label="Create trip"
            onPress={handleSubmit(onFormSubmit, onInvalid)}
            disabled={formState.isSubmitting}
          />
        </KeyboardStickyView>
      </View>
    </SafeAreaView>
  );
}
