import { colors } from "@/themes/color";
import { UserPlus } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text } from "react-native";
import AddPersonBottomSheet from "./AddPersonBottomSheet";

interface AddPersonProps {}
export default function AddPerson(props: AddPersonProps) {
  const [isOpen, setOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className="flex-row items-center gap-3 rounded-row border border-dashed border-grey-750 px-3 py-3.5"
      >
        <UserPlus size={20} color={colors.orange[400]} />
        <Text className="font-outfit-medium text-orange-400 text-body-medium">
          Add a person
        </Text>
      </Pressable>
      {/* A sibling, not a child: touches inside a Modal still bubble through its
          React parents, so inside the Pressable they would re-press the button */}
      <AddPersonBottomSheet visible={isOpen} onClose={() => setOpen(false)} />
    </>
  );
}
