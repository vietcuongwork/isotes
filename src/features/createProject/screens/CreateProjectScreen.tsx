import Button from "@/components/Button";
import { useCreateProjectScreen } from "@/features/createProject/hooks/useCreateProjectScreen";
import { Text, View } from "react-native";
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
  } = useCreateProjectScreen();

  const { control, handleSubmit, formState } = form;

  return (
    <SafeAreaView className="flex-1 bg-[#0a0a0a]">
      <View>
        {/* Header */}
        <View className="border border-b-[#f5a623]/25 p-2">
          <Text className="font-fraunces text-xl text-[#f0f0f0]">Isotes</Text>
        </View>

        <KeyboardAwareScrollView
          keyboardShouldPersistTaps="handled"
          ref={scrollViewRef}
        >
          {/* Content */}
          <View className="gap-16 px-4 py-6">
            <View className="gap-4">
              <Text className="font-fraunces text-4xl text-[#f0f0f0]">
                Create a new split
              </Text>
              <Text className="font-outfit-regular text-base text-[#555555]">
                Don't worry, you can edit details later.
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
