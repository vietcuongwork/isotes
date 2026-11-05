import PrimaryButton from "@/components/PrimaryButton";
import {
  BottomSheet,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@/components/sheet-keyboard";
import { insertMember } from "@/db/members";
import { firstUnusedColor } from "@/features/addExpense/addPerson/helpers/addPersonHelpers";
import { useAddPersonStore } from "@/stores/useAddPersonStore";
import { useExpenseSheetStore } from "@/stores/useExpenseSheetStore";
import { colors } from "@/themes/color";
import { textStyle } from "@/themes/typography";
import { MemberColor } from "@/types/TExpense";
import { cn } from "@/utils/cn";
import { getInitial, sanitizeNameInput } from "@/utils/utils";
import { User } from "lucide-react-native";
import { ReactElement, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ColorField from "./ColorField";

interface AddPersonBottomSheetProps {
  visible: boolean;
  onClose: () => void;
}

interface PersonPreviewProps {
  name: string;
  color: MemberColor;
}

interface NameFieldProps {
  value: string;
  onChangeText: (text: string) => void;
}

// font and size only: iOS draws single-line TextInput text low when lineHeight is
// set ([[Learn_react-native_textinput-lineheight-ios]])
const body = textStyle("body");
const nameInputStyle = {
  fontFamily: body.fontFamily,
  fontSize: body.fontSize,
};

// NOTE - no token for the preview's initial (no type role matches), falling back to Outfit semibold 24/32 (the AddPerson board's value)
const initialStyle = StyleSheet.create({
  text: { fontFamily: "outfit-semibold", fontSize: 24, lineHeight: 32 },
}).text;

// The avatar preview: a person icon while the name is blank, else the color and initial
function PersonPreview(props: PersonPreviewProps): ReactElement {
  const { name, color } = props;
  const trimmed = name.trim();

  return (
    // NOTE - no token for the 64pt disc, falling back to h-[64px] w-[64px] (one component's own size; Avatar always draws a color and the dark ring)
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className={cn(
        "h-[64px] w-[64px] items-center justify-center self-center rounded-pill",
        trimmed === "" && "bg-ink-100",
      )}
      style={
        trimmed === "" ? undefined : { backgroundColor: colors.member[color] }
      }
    >
      {trimmed === "" ? (
        <User size={24} strokeWidth={1.75} color={colors.ink[400]} />
      ) : (
        <Text style={[initialStyle, { color: colors.memberInk[color] }]}>
          {getInitial(trimmed)}
        </Text>
      )}
    </View>
  );
}

// Mounts on each open, because the sheet renders nothing while closed
function NameField(props: NameFieldProps): ReactElement {
  const { value, onChangeText } = props;
  const [focused, setFocused] = useState(false);

  return (
    // NOTE - no token for the 1.5pt border width, falling back to border-[1.5px]; transparent until focus so focusing shifts nothing
    <View
      className={cn(
        "h-space-12 flex-row items-center rounded-md border-[1.5px] bg-ink-100 px-space-4",
        focused ? "border-ink-900" : "border-transparent",
      )}
    >
      <BottomSheetTextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Their name"
        placeholderTextColor={colors.ink[500]}
        accessibilityLabel="Name"
        returnKeyType="done"
        // A light sheet, whatever the system appearance (the input defaults to dark)
        keyboardAppearance="light"
        cursorColor={colors.ink[900]}
        selectionColor={colors.ink[900]}
        className="h-full flex-1 text-ink-900"
        style={nameInputStyle}
      />
    </View>
  );
}

export default function AddPersonBottomSheet(
  props: AddPersonBottomSheetProps,
): ReactElement {
  const { visible, onClose } = props;

  const name = useAddPersonStore((s) => s.name);
  const setName = useAddPersonStore((s) => s.setName);
  const pickedColor = useAddPersonStore((s) => s.selectedColor);
  const setSelectedColor = useAddPersonStore((s) => s.setSelectedColor);
  const resetAddPerson = useAddPersonStore((s) => s.reset);
  const selectedMemberIds = useExpenseSheetStore((s) => s.selectedMemberIds);
  const splitShares = useExpenseSheetStore((s) => s.splitShares);
  const setSelectedMemberIds = useExpenseSheetStore(
    (s) => s.setSelectedMemberIds,
  );
  const setSplitShares = useExpenseSheetStore((s) => s.setSplitShares);

  const members = useExpenseSheetStore((s) => s.members);
  const tripId = members[0]?.tripId;

  const safeAreaInsets = useSafeAreaInsets();

  const color = pickedColor ?? firstUnusedColor(members);
  const trimmedName = name.trim();

  const handleAddPerson = async () => {
    if (!trimmedName || !tripId) return;
    const newMemberId = await insertMember({
      tripId,
      name: trimmedName,
      memberColor: color,
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
      titleSize="title"
      appearance="light"
      showCloseButton
      safeAreaInsets={safeAreaInsets}
    >
      {/* revealMargin 50 = keyboard-controller's old bottomOffset */}
      <BottomSheetScrollView revealMargin={50}>
        <View className="gap-space-4 px-space-5">
          <PersonPreview name={name} color={color} />

          <NameField
            value={name}
            onChangeText={(text) => setName(sanitizeNameInput(text))}
          />

          <ColorField selectedColor={color} onSelectColor={setSelectedColor} />

          {/* Helper line */}
          <Text className="text-ink-500 text-caption">
            {trimmedName
              ? `${trimmedName} joins the trip and this expense’s split.`
              : "They join the trip and this expense’s split."}
          </Text>

          <PrimaryButton
            label="Add to trip"
            onPress={handleAddPerson}
            disabled={!trimmedName}
          />
        </View>
      </BottomSheetScrollView>
    </BottomSheet>
  );
}
