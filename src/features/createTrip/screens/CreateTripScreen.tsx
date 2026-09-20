import Button from "@/components/Button";
import { colors } from "@/themes/color";
import { MoveLeft, UserPlus } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import CreateTripForm from "../components/CreateTripForm";
import { useCreateTripScreen } from "../hooks/useCreateTripScreen";

export default function CreateTripScreen() {
  const {
    form,
    currencyPickerRef,
    handleCurrencyChange,
    onFormSubmit,
    scrollViewRef,
    formRef,
    onInvalid,
    onBack,
  } = useCreateTripScreen();

  const { control, handleSubmit, formState } = form;

  return (
    <SafeAreaView className="flex-1 bg-grey-975">
      <View>
        {/* Header */}
        <View className="relative flex-row items-center border-b border-grey-825 px-5 py-3.5">
          <TouchableOpacity onPress={onBack} className="z-10">
            <MoveLeft color={colors.grey[200]} size={24} />
          </TouchableOpacity>

          <Text className="absolute inset-x-0 text-center text-grey-50 text-body-lg-medium">
            New Trip
          </Text>
        </View>

        <KeyboardAwareScrollView
          keyboardShouldPersistTaps="handled"
          ref={scrollViewRef}
        >
          {/* Content */}
          <View>
            <View className="px-5 pt-8">
              <Text className="text-grey-50 text-display">
                Create a new split
              </Text>
              <Text className="text-grey-200 text-body">
                You can change any of this later.
              </Text>
            </View>

            {/* Form */}
            <CreateTripForm
              ref={formRef}
              form={form}
              control={control}
              currencyPickerRef={currencyPickerRef}
              handleCurrencyChange={handleCurrencyChange}
              scrollViewRef={scrollViewRef}
            />

            {/* Footer */}
            <View className="px-5 pt-7">
              <View className="flex-row items-center gap-3 rounded-card border border-grey-850 bg-grey-950 p-4">
                <UserPlus color={colors.grey[400]} size={20} />
                <Text className="max-w-[90%] text-grey-200 text-meta">
                  No need to add people now — you'll add them as you log the
                  first expense.
                </Text>
              </View>
            </View>

            {/* Button group */}
            <View className="gap-cta px-5 pt-28">
              <Text className="text-center text-grey-400 text-meta">
                No account required · share via link
              </Text>
              <Button
                buttonText="Create trip"
                onPress={handleSubmit(onFormSubmit, onInvalid)}
                touchableOpacityProps={{
                  disabled: formState.isSubmitting,
                }}
              />
            </View>
          </View>
        </KeyboardAwareScrollView>
      </View>
    </SafeAreaView>
  );
}
