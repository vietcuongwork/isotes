import { useBottomSheetStack } from "@/components/bottomsheet/BottomSheetStack";
import { colors } from "@/themes/color";
import { UserPlus } from "lucide-react-native";
import { Pressable, Text } from "react-native";
import AddPersonBottomSheet from "./AddPersonBottomSheet";

interface AddPersonProps {}
export default function AddPerson(props: AddPersonProps) {
  const { pushSheet, popSheet } = useBottomSheetStack();

  const handleOpenAddPersonSheet = () => {
    pushSheet({
      component: (
        <AddPersonBottomSheet onClose={popSheet}></AddPersonBottomSheet>
      ),
    });
  };
  return (
    <Pressable
      onPress={handleOpenAddPersonSheet}
      className="flex-row items-center gap-3 rounded-row border border-dashed border-grey-750 px-3 py-3.5"
    >
      <UserPlus size={20} color={colors.orange[400]} />
      <Text className="font-outfit-medium text-orange-400 text-body-medium">
        Add a person
      </Text>
    </Pressable>
  );
}
