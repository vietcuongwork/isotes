import { colors } from "@/themes/color";
import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { X } from "lucide-react-native";
import { forwardRef, ReactElement, useCallback } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AddExpenseBottomSheet = forwardRef<BottomSheetModal>(
  function AddExpenseBottomSheet(props, ref): ReactElement {
    const { bottom } = useSafeAreaInsets();
    const safeBottomStyle = { paddingBottom: bottom };
    const renderBackDrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.6}
        />
      ),
      [],
    );
    const renderContent = () => {
      return (
        <View>
          {/* Header */}
          <View className="flex-row justify-between px-5 pb-4">
            <Text className="text-label text-grey-50">New expense</Text>
            <X size={24} color={colors.grey[200]} />
          </View>
        </View>
      );
    };
    return (
      <BottomSheetModal
        ref={ref}
        backdropComponent={renderBackDrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
        enableContentPanningGesture={false}
      >
        <BottomSheetView style={safeBottomStyle}>
          {renderContent()}
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);
export default AddExpenseBottomSheet;

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: colors.grey[900],
  },
  handleIndicator: {
    backgroundColor: colors.grey[700],
  },
});
