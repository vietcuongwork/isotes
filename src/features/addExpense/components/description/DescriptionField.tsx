import { BottomSheetTextInput } from "@/components/sheet-keyboard";
import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import { colors } from "@/themes/color";
import { textStyle } from "@/themes/typography";
import { View } from "react-native";

// font and size only: iOS draws single-line TextInput text low when lineHeight is
// set ([[Learn_react-native_textinput-lineheight-ios]])
const body = textStyle("body");
const inputTextStyle = {
  fontFamily: body.fontFamily,
  fontSize: body.fontSize,
};

export default function DescriptionField() {
  const description = useExpenseSheetStore((s) => s.description);
  const setDescription = useExpenseSheetStore((s) => s.setDescription);

  return (
    <View className="h-space-12 justify-center rounded-md bg-ink-100 px-space-4">
      {/* BottomSheetTextInput: waits for the number pad to leave before raising the
        system keyboard */}
      <BottomSheetTextInput
        value={description}
        onChangeText={setDescription}
        placeholder="What was it for?"
        placeholderTextColor={colors.ink[500]}
        accessibilityLabel="Description"
        cursorColor={colors.ink[900]}
        selectionColor={colors.ink[900]}
        className="h-full text-ink-900"
        style={inputTextStyle}
      />
    </View>
  );
}
