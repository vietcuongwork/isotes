import Raven from "@/components/Raven";
import { Modal, Pressable, Text, View } from "react-native";

interface StartOverDialogProps {
  onCancel: () => void;
  onConfirm: () => void;
}

export default function StartOverDialog(props: StartOverDialogProps) {
  const { onCancel, onConfirm } = props;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center bg-scrim px-space-5">
        {/* RN has no alertdialog role; alert is the nearest */}
        <View
          role="alert"
          className="w-full gap-space-2 rounded-xl bg-card p-space-6 shadow-lifted"
        >
          {/* Raven: Confused, hidden from VoiceOver (no label) */}
          <View className="mb-space-2 items-start">
            <Raven pose="confused" height={64} />
          </View>
          <Text className="text-ink-900 text-heading">Start over?</Text>
          <Text className="text-ink-700 text-body">
            This clears the amount, description, activity, date, payer and
            split, back to a blank expense. People you added stay on the trip,
            since they aren&apos;t part of this form.
          </Text>

          {/* Actions */}
          <View className="mt-space-4 flex-row gap-space-3">
            {/* NOTE - no token for the 52pt pill height, falling back to h-[52px] (button-primary's own size) */}
            <Pressable
              onPress={onCancel}
              accessibilityRole="button"
              className="h-[52px] flex-1 items-center justify-center rounded-pill bg-ink-100"
            >
              <Text className="text-ink-900 text-body">Keep editing</Text>
            </Pressable>
            {/* NOTE - no token for the 52pt pill height, falling back to h-[52px] (as above) */}
            <Pressable
              onPress={onConfirm}
              accessibilityRole="button"
              className="h-[52px] flex-1 items-center justify-center rounded-pill bg-owe-100"
            >
              <Text className="text-owe-600 text-body">Start over</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
