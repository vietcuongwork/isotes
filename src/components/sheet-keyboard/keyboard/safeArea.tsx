import React, { useState } from "react";
import {
  LayoutChangeEvent,
  SafeAreaView,
  StyleSheet,
  View,
} from "react-native";

export interface EdgeInsets {
  top: number;
  bottom: number;
}

/**
 * Safe-area insets from React Native core alone.
 *
 * Core has no numeric inset API, so an invisible full-screen SafeAreaView is
 * laid out and the position of its padded child is read back.
 *
 * Trade-off: core SafeAreaView is deprecated (RN 0.81+) and warns once when
 * first accessed. Passing `safeAreaInsets` (e.g. from
 * react-native-safe-area-context) to KeyboardHost / BottomSheet skips the
 * probe entirely, so the module is never touched.
 */
export function useSafeAreaInsets(override: EdgeInsets | undefined) {
  const [frame, setFrame] = useState<{ top: number; height: number } | null>(
    null,
  );
  const [outer, setOuter] = useState(0);

  const onOuterLayout = (e: LayoutChangeEvent) =>
    setOuter(e.nativeEvent.layout.height);
  const onInnerLayout = (e: LayoutChangeEvent) => {
    const { y, height } = e.nativeEvent.layout;
    setFrame({ top: y, height });
  };

  if (override) return { insets: override, probe: null };

  const measured = frame && outer > 0;
  const insets: EdgeInsets = {
    top: measured ? Math.max(0, Math.round(frame.top)) : 0,
    bottom: measured
      ? Math.max(0, Math.round(outer - frame.top - frame.height))
      : 0,
  };
  const probe = (
    <SafeAreaView
      pointerEvents="none"
      style={styles.probe}
      onLayout={onOuterLayout}
    >
      <View style={styles.fill} onLayout={onInnerLayout} />
    </SafeAreaView>
  );
  return { insets, probe };
}

const styles = StyleSheet.create({
  probe: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: 0,
  },
  fill: { flex: 1 },
});
