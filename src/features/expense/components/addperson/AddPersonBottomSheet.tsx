import Avatar from "@/components/Avatar";
import Button from "@/components/Button";
import TextField from "@/components/formfield/TextField";
import {
  BottomSheet,
  KeyboardAwareScrollView,
} from "@/components/sheet-keyboard";
import { insertMember } from "@/db/members";
import { useAddPersonStore } from "@/stores/useAddPersonStore";
import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import { getInitial, sanitizeNameInput } from "@/utils/utils";
import { ReactElement } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ColorField from "./ColorField";

interface AddPersonBottomSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function AddPersonBottomSheet(
  props: AddPersonBottomSheetProps,
): ReactElement {
  const { visible, onClose } = props;

  const name = useAddPersonStore((s) => s.name);
  const setName = useAddPersonStore((s) => s.setName);
  const selectedColor = useAddPersonStore((s) => s.selectedColor);
  const setSelectedColor = useAddPersonStore((s) => s.setSelectedColor);
  const resetAddPerson = useAddPersonStore((s) => s.reset);
  const selectedMemberIds = useExpenseSheetStore((s) => s.selectedMemberIds);
  const splitShares = useExpenseSheetStore((s) => s.splitShares);
  const setSelectedMemberIds = useExpenseSheetStore(
    (s) => s.setSelectedMemberIds,
  );
  const setSplitShares = useExpenseSheetStore((s) => s.setSplitShares);

  const tripId = useExpenseSheetStore((s) => s.members[0]?.tripId);

  const safeAreaInsets = useSafeAreaInsets();

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
    setSelectedMemberIds([...selectedMemberIds, newMemberId]);
    setSplitShares({ ...splitShares, [newMemberId]: 1 });

    resetAddPerson();
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Add person"
      showCloseButton
      snapPoints={["60%"]}
      safeAreaInsets={safeAreaInsets}
    >
      {/* revealMargin 50 = keyboard-controller's old bottomOffset */}
      <KeyboardAwareScrollView revealMargin={50}>
        <View>
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
              shellClassName="self-stretch"
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
}
