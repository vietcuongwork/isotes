import Avatar from "@/components/Avatar";
import { useBottomSheetStack } from "@/components/bottomsheet/BottomSheetStack";
import BottomSheet, {
  BottomSheetMethods,
} from "@/components/bottomsheet/BottomSheet";
import Button from "@/components/Button";
import TextField from "@/components/formfield/TextField";
import { insertMember } from "@/db/members";
import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import { colors } from "@/themes/color";
import { MemberColor } from "@/types/TExpense";
import { getInitial } from "@/utils/utils";
import { X } from "lucide-react-native";
import { forwardRef, ReactElement, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ColorField from "./ColorField";

const MEMBER_COLORS = Object.keys(colors.member) as MemberColor[];

interface AddPersonBottomSheetProps {
  onClose?: () => void;
}

const AddPersonBottomSheet = forwardRef<
  BottomSheetMethods,
  AddPersonBottomSheetProps
>(function AddPersonBottomSheet(props, ref): ReactElement {
  const { onClose } = props;

  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState<MemberColor>(
    MEMBER_COLORS[0],
  );

  const { popSheet } = useBottomSheetStack();
  const tripId = useExpenseSheetStore((s) => s.members[0]?.tripId);

  const { bottom } = useSafeAreaInsets();

  const safeBottomStyle = useMemo(() => ({ paddingBottom: bottom }), [bottom]);

  const handleAddPerson = async () => {
    const trimmedName = name.trim();
    if (!trimmedName || !tripId) return;
    await insertMember({
      tripId,
      name: trimmedName,
      memberColor: selectedColor,
    });
    popSheet();
  };

  return (
    <BottomSheet ref={ref} onClose={onClose} snapPoints={["60%"]}>
      <KeyboardAwareScrollView
        contentContainerStyle={safeBottomStyle}
        bottomOffset={50}
        keyboardShouldPersistTaps="handled"
      >
        <View>
          {/* Header */}
          <View className="flex-row justify-between px-5 pb-4">
            <Text className="text-grey-50 text-label">Add person</Text>
            <X size={24} color={colors.grey[200]} />
          </View>

          <View className="items-center gap-3.5 px-5 pb-6 pt-4">
            <Avatar
              label={getInitial(name)}
              color={selectedColor}
              innerViewClassName="h-16 w-16"
              textClassName="text-title-semibold"
            />

            {/* Name Field */}
            <TextField
              label="Name"
              placeholder="Enter name"
              className="w-full"
              value={name}
              textInputProps={{ onChangeText: setName }}
              inBottomSheet
            />

            {/* Color Field */}
            <ColorField
              selectedColor={selectedColor}
              onSelectColor={setSelectedColor}
            />
          </View>

          <View className="px-5">
            <Button
              onPress={handleAddPerson}
              buttonText="Add to trip"
              touchableOpacityProps={{ disabled: !name.trim() }}
            />
          </View>
        </View>
      </KeyboardAwareScrollView>
    </BottomSheet>
  );
});

export default AddPersonBottomSheet;
