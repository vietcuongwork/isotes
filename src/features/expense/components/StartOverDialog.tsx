import { Modal, Pressable, Text, View } from "react-native";

interface StartOverDialogProps {
  onCancel: () => void;
  onConfirm: () => void;
}

export default function StartOverDialog(props: StartOverDialogProps) {
  const { onCancel, onConfirm } = props;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center bg-grey-scrim px-8">
        <View className="w-full rounded-card border border-grey-800 bg-grey-900 p-5">
          <Text className="text-grey-50 text-body-lg-medium">Start over?</Text>
          <Text className="pt-2 text-grey-200 text-caption">
            This clears the amount, description, activity and date back to a
            blank expense. People you added stay in the trip — they aren't part
            of this form.
          </Text>
          <View className="flex-row gap-3 pt-4">
            <Pressable
              onPress={onCancel}
              className="flex-1 items-center rounded-btn bg-grey-810 py-3.5"
            >
              <Text className="text-grey-100 text-body-medium-flat">
                Keep editing
              </Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              className="flex-1 items-center rounded-btn bg-red-900 py-3.5"
            >
              <Text className="text-red-400 text-body-medium-flat">
                Start over
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
