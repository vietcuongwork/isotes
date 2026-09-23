import TextField from "@/components/formfield/TextField";
import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";

export default function DescriptionField() {
  const description = useExpenseSheetStore((s) => s.description);
  const setDescription = useExpenseSheetStore((s) => s.setDescription);

  return (
    <TextField
      label="Description"
      optionalLabel="optional"
      placeholder="What was it for?"
      value={description}
      textInputProps={{ onChangeText: setDescription }}
    />
  );
}
