import TextField from "@/components/formfield/TextField";
import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";

interface DescriptionFieldProps {
  error: string;
}
export default function DescriptionField(props: DescriptionFieldProps) {
  const { error } = props;

  const description = useExpenseSheetStore((s) => s.description);
  const setDescription = useExpenseSheetStore((s) => s.setDescription);

  return (
    <TextField
      label="Description"
      optionalLabel="optional"
      placeholder="What was it for?"
      inBottomSheet={false}
      value={description}
      textInputProps={{ onChangeText: setDescription }}
      error={error}
    />
  );
}
