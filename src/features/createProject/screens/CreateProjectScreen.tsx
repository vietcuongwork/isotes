import Button from "@/components/Button";
import { useCreateProjectScreen } from "@/features/createProject/hooks/useCreateProjectScreen";
import { colors } from "@/themes/color";
import { MoveLeft } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import CreateProjectForm from "../components/CreateProjectForm";

export default function CreateProjectScreen() {
  const {
    form,
    currencyPickerRef,
    handleCurrencyChange,
    onFormSubmit,
    scrollViewRef,
    formRef,
    onInvalid,
    onBack,
  } = useCreateProjectScreen();

  const { control, handleSubmit, formState } = form;

  return (
    <SafeAreaView className="flex-1 bg-[#0a0a0a]">
      <View>
        {/* Header */}
        <View className="border-grey-825 relative flex-row items-center border-b px-5 py-3.5">
          <TouchableOpacity onPress={onBack} className="z-10">
            <MoveLeft color={colors.grey[200]} size={24} />
          </TouchableOpacity>

          <Text className="text-button text-grey-50 font-outfit-medium absolute inset-x-0 text-center">
            New Trip
          </Text>
        </View>

        <KeyboardAwareScrollView
          keyboardShouldPersistTaps="handled"
          ref={scrollViewRef}
        >
          {/* Content */}
          <View>
            <View className="border border-red-500 px-5 pt-8">
              <Text className="font-outfit-light text-display text-grey-50">
                Create a new split
              </Text>
              <Text className="text-body text-grey-200 font-outfit-regular">
                You can change any of this later.
              </Text>
            </View>

            {/* Form */}
            <CreateProjectForm
              ref={formRef}
              form={form}
              control={control}
              currencyPickerRef={currencyPickerRef}
              handleCurrencyChange={handleCurrencyChange}
              scrollViewRef={scrollViewRef}
            />

            {/* Footer */}
            <View className="gap-10">
              <View className="flex-row gap-2 rounded-xl border border-[#1e1e1e] bg-[#111111] p-4">
                <Text>👥</Text>
                <Text className="max-w-[95%] font-outfit-regular text-base text-[#777777]">
                  Add people when you record your first expense — no pre-setup
                  needed.
                </Text>
              </View>
              <View className="gap-4">
                <Button
                  buttonText="Create"
                  onPress={handleSubmit(onFormSubmit, onInvalid)}
                  touchableOpacityProps={{
                    disabled: formState.isSubmitting,
                  }}
                />
                <Text className="text-center font-outfit-regular text-base text-[#333333]">
                  No account required · share via link
                </Text>
              </View>
            </View>
          </View>
        </KeyboardAwareScrollView>
      </View>
    </SafeAreaView>
  );
}
