import Avatar from "@/components/Avatar";
import BottomSheet, {
  BottomSheetMethods,
} from "@/components/bottomsheet/BottomSheet";
import { useBottomSheetStack } from "@/components/bottomsheet/BottomSheetStack";
import Button from "@/components/Button";
import TextField from "@/components/formfield/TextField";
import { insertMember } from "@/db/members";
import { useAddPersonStore } from "@/stores/useAddPersonStore";
import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import { colors } from "@/themes/color";
import { getInitial, sanitizeNameInput } from "@/utils/utils";
import { X } from "lucide-react-native";
import { forwardRef, ReactElement, useMemo } from "react";
import { Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ColorField from "./ColorField";

interface AddPersonBottomSheetProps {
  onClose?: () => void;
}

const AddPersonBottomSheet = forwardRef<
  BottomSheetMethods,
  AddPersonBottomSheetProps
>(function AddPersonBottomSheet(props, ref): ReactElement {
  const { onClose } = props;

  const name = useAddPersonStore((s) => s.name);
  const setName = useAddPersonStore((s) => s.setName);
  const selectedColor = useAddPersonStore((s) => s.selectedColor);
  const setSelectedColor = useAddPersonStore((s) => s.setSelectedColor);
  const resetAddPerson = useAddPersonStore((s) => s.reset);
  const equallySelectedMemberIds = useExpenseSheetStore(
    (s) => s.equallySelectedMemberIds,
  );
  const splitShares = useExpenseSheetStore((s) => s.splitShares);
  const setEquallySelectedMemberIds = useExpenseSheetStore(
    (s) => s.setEquallySelectedMemberIds,
  );
  const setSplitShares = useExpenseSheetStore((s) => s.setSplitShares);

  const { popSheet } = useBottomSheetStack();
  const tripId = useExpenseSheetStore((s) => s.members[0]?.tripId);

  const { bottom } = useSafeAreaInsets();

  const safeBottomStyle = useMemo(() => ({ paddingBottom: bottom }), [bottom]);

  const handleAddPerson = async () => {
    const trimmedName = name.trim();
    if (!trimmedName || !tripId) return;
    const newMemberId = await insertMember({
      tripId,
      name: trimmedName,
      memberColor: selectedColor,
    });

    // The expense sheet's seed effect only fires once (paidByMemberId is
    // already set by now), so a member added mid-session must be resolved
    // into the split here — otherwise they're silently excluded from
    // equal split / shares until submit.
    setEquallySelectedMemberIds([...equallySelectedMemberIds, newMemberId]);
    setSplitShares({ ...splitShares, [newMemberId]: 1 });

    resetAddPerson();
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
              textInputProps={{
                onChangeText: (text) => setName(sanitizeNameInput(text)),
              }}
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
