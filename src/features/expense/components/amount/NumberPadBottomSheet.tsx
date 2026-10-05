import BottomSheet, {
  BottomSheetMethods,
} from "@/components/bottomsheet/BottomSheet";
import NumberPad from "@/components/numberpad/NumberPad";
import { forwardRef, ReactElement } from "react";
import { View } from "react-native";
import useNumberPadBottomSheet, {
  NumberPadTarget,
} from "../../hooks/useNumberPadBottomSheet";

export interface NumberPadBottomSheetProps {
  target: NumberPadTarget;
  onClose: () => void;
  onDismissStart?: () => void;
  onHeightChange?: (height: number) => void;
}

const NumberPadBottomSheet = forwardRef<
  BottomSheetMethods,
  NumberPadBottomSheetProps
>(function NumberPadBottomSheet(props, ref): ReactElement {
  const { target, onClose, onDismissStart, onHeightChange } = props;

  const { handleKeyPress, safeBottomStyle } = useNumberPadBottomSheet({
    target,
  });

  return (
    <BottomSheet
      ref={ref}
      onClose={onClose}
      onDismissStart={onDismissStart}
      onContentHeightChange={onHeightChange}
      showHandle={false}
      showBackdrop={false}
      // Closed by the stack's tap-outside (passThrough), not its own backdrop,
      // so the content behind stays scrollable
      dismissOnBackdropPress={false}
      dragToDismissEnabled={false}
    >
      <View style={safeBottomStyle}>
        <NumberPad onKeyPress={handleKeyPress} />
      </View>
    </BottomSheet>
  );
});

export default NumberPadBottomSheet;
