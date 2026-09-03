import Button from "@/components/Button";
import { useCreateProjectScreen } from "@/features/createProject/hooks/useCreateProjectScreen";
import { colors } from "@/themes/color";
import { MoveLeft, UserPlus } from "lucide-react-native";
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
            <View className="px-5 pt-8">
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
            <View className="px-5 pt-7">
              <View className="rounded-card bg-grey-950 border-grey-850 flex-row items-center gap-3 border p-4">
                <UserPlus color={colors.grey[400]} size={20} />
                <Text className="text-meta text-grey-200 max-w-[90%] font-outfit-regular">
                  No need to add people now — you'll add them as you log the
                  first expense.
                </Text>
              </View>
            </View>

            {/* Button group */}
            <View className="gap-cta px-5 pt-28">
              <Text className="text-grey-400 text-meta text-center font-outfit-regular">
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
