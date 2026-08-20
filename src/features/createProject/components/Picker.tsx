import { Picker as RNPicker } from "@react-native-picker/picker";
import { ItemValue } from "@react-native-picker/picker/typings/Picker";
import { useState } from "react";
import { TextStyle } from "react-native";

interface PickerOption<T extends ItemValue> {
  label: string;
  value: T;
}

interface PickerProps<T extends ItemValue> {
  intialValue: T;
  onSelectionChange: (option: PickerOption<T>) => void;
  options: PickerOption<T>[];
  itemStyle?: TextStyle;
}

export default function Picker<T extends ItemValue>(props: PickerProps<T>) {
  const { intialValue, onSelectionChange, options, itemStyle } = props;
  const [localValue, setLocalValue] = useState<T>(intialValue);

  const handleValueChange = (value: string) => {
    const selectedOption = options.find((option) => option.value === value);
    if (!selectedOption) return;
    setLocalValue(selectedOption.value);
    onSelectionChange(selectedOption);
  };

  return (
    //NOTE - RNPicker's generic defaults to string
    // and JSX can't infer T here, so we cast at this boundary only.
    <RNPicker
      selectedValue={localValue as unknown as string}
      onValueChange={handleValueChange}
      itemStyle={itemStyle}
    >
      {options.map((option, index) => (
        <RNPicker.Item
          key={index}
          label={option.label}
          value={option.value as unknown as string}
        />
      ))}
    </RNPicker>
  );
}
