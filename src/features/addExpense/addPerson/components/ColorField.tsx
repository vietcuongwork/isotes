import PickerField from "@/components/formfield/PickerField";
import { colors } from "@/themes/color";
import { MemberColor } from "@/types/TExpense";
import { capitalize } from "@/utils/utils";
import { View } from "react-native";
import ColorItem from "./ColorItem";

const MEMBER_COLORS = Object.keys(colors.member) as MemberColor[];

interface ColorFieldProps {
  selectedColor: MemberColor;
  onSelectColor: (color: MemberColor) => void;
}

export default function ColorField(props: ColorFieldProps) {
  // const [selectedColor, setSelectedColor] = useState<MemberColor>(
  //   MEMBER_COLORS[0],
  // );

  const { selectedColor, onSelectColor } = props;

  return (
    <PickerField
      label="Color"
      onPress={() => {}}
      className="w-full"
      optionalLabel={capitalize(selectedColor)}
    >
      <View className="flex-row flex-wrap justify-center gap-5">
        {MEMBER_COLORS.map((color) => (
          <ColorItem
            key={color}
            color={color}
            selected={color === selectedColor}
            onPress={() => onSelectColor(color)}
          />
        ))}
      </View>
    </PickerField>
  );
}
