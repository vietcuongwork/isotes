import TextField from "@/components/formfield/TextField";
import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import { TextInput } from "react-native"; // TEMP T23

// TEMP T23 — native tag of the input RN's JS side thinks is focused (560 amount, 576 description)
const jsFocusedTag = () =>
  // any: __nativeTag is an internal field of Fabric host instances, absent from the public type
  (TextInput.State.currentlyFocusedInput() as any)?.__nativeTag ?? "-";

export default function DescriptionField() {
  const description = useExpenseSheetStore((s) => s.description);
  const setDescription = useExpenseSheetStore((s) => s.setDescription);

  return (
    <TextField
      label="Description"
      optionalLabel="optional"
      placeholder="What was it for?"
      value={description}
      textInputProps={{
        onChangeText: setDescription,
        onPress: () =>
          console.log(`[T23] ${performance.now().toFixed(1)} description press jsFocused:`, jsFocusedTag()), // TEMP T23
        onFocus: () =>
          console.log(`[T22] ${performance.now().toFixed(1)} description focus jsFocused:`, jsFocusedTag()), // TEMP T22/T23
        onBlur: () =>
          console.log(`[T22] ${performance.now().toFixed(1)} description blur jsFocused:`, jsFocusedTag()), // TEMP T22/T23
      }}
      shellClassName="flex-1"
    />
  );
}
