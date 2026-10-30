/** @jsxImportSource react */
// Plain React JSX, not NativeWind's: css-interop's Pressable wrapper drops a
// function `style` (the keys' pressed state), and nothing here uses className
import { colors as tokens } from "@/themes/color";
import { CornerDownLeft, Delete } from "lucide-react-native";
import React, { memo, ReactNode, useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { NumberPadKey } from "./numberPadLogic";

export interface NumberPadKeyboardProps {
  onKey: (key: NumberPadKey) => void;
  onDone: () => void;
  /** `false` greys out "." (integer-only field). */
  decimalEnabled?: boolean;
  /** Bottom padding under the keys (home indicator), like the system keyboard. */
  bottomInset?: number;
}

const ROWS: NumberPadKey[][] = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", "000"],
];
const A11Y_LABEL: Partial<Record<NumberPadKey, string>> = {
  ".": "Decimal point",
  "000": "Triple zero",
  backspace: "Delete",
};

const DIGIT_KEYS = new Set<NumberPadKey>([
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "0",
]);

const KEY_HEIGHT = 48;
const GAP = 6;
const REPEAT_DELAY_MS = 450;
const REPEAT_EVERY_MS = 75;

/**
 * The pad UI only: 1–9, ".", "0", "000", delete (repeats while held) and Done.
 * It has no idea which input it edits; the host wires `onKey` / `onDone`.
 */
export const NumberPadKeyboard = memo(function NumberPadKeyboard({
  onKey,
  onDone,
  decimalEnabled = true,
  bottomInset = 0,
}: NumberPadKeyboardProps) {
  return (
    <View
      testID="number-pad"
      style={[styles.pad, { paddingBottom: GAP + bottomInset }]}
    >
      <View style={styles.grid}>
        {ROWS.map((row) => (
          <View key={row.join("")} style={styles.row}>
            {row.map((key) => (
              <KeyButton
                key={key}
                label={key}
                a11yLabel={A11Y_LABEL[key] ?? key}
                disabled={key === "." && !decimalEnabled}
                onPress={() => onKey(key)}
                tone={DIGIT_KEYS.has(key) ? "digit" : "function"}
              />
            ))}
          </View>
        ))}
      </View>
      <View style={styles.side}>
        <DeleteKey onKey={onKey} />
        <KeyButton
          label="Done"
          a11yLabel="Done"
          icon={
            <CornerDownLeft size={24} strokeWidth={1.75} color={colors.text} />
          }
          onPress={onDone}
          tone="function"
          tall
        />
      </View>
    </View>
  );
});

const colors = tokens.numberPad;

interface KeyButtonProps {
  label: string;
  a11yLabel: string;
  /** Rendered instead of the label text (the label stays as the a11y fallback). */
  icon?: ReactNode;
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  disabled?: boolean;
  /** `digit` is the white key; `function` is the grey one (".", "000", delete, Done). */
  tone?: "digit" | "function";
  tall?: boolean;
}

function KeyButton({
  label,
  a11yLabel,
  icon,
  onPress,
  onPressIn,
  onPressOut,
  disabled,
  tone = "digit",
  tall,
}: KeyButtonProps) {
  const [idle, active] =
    tone === "function"
      ? [colors.fnKey, colors.fnKeyPressed]
      : [colors.key, colors.keyPressed];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={({ pressed }) => [
        styles.key,
        tall && styles.tallKey,
        {
          backgroundColor: pressed ? active : idle,
          //NOTE - no token for a disabled key, falling back to opacity 0.35
          opacity: disabled ? 0.35 : 1,
        },
      ]}
    >
      {icon ?? (
        <Text
          style={[
            label === "000" ? styles.tripleZeroLabel : styles.label,
            { color: colors.text },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

/** Deletes on touch-down, then repeats while held, like the system keyboard. */
function DeleteKey({ onKey }: { onKey: (key: NumberPadKey) => void }) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  const start = () => {
    stop();
    onKey("backspace");
    const repeat = () => {
      onKey("backspace");
      timer.current = setTimeout(repeat, REPEAT_EVERY_MS);
    };
    timer.current = setTimeout(repeat, REPEAT_DELAY_MS);
  };

  useEffect(() => stop, []);

  return (
    <KeyButton
      label="⌫"
      a11yLabel="Delete"
      icon={<Delete size={24} strokeWidth={1.75} color={colors.text} />}
      onPressIn={start}
      onPressOut={stop}
      tone="function"
    />
  );
}

const styles = StyleSheet.create({
  pad: {
    flexDirection: "row",
    gap: GAP,
    paddingTop: GAP,
    paddingHorizontal: GAP,
    backgroundColor: colors.bg,
  },
  grid: { flex: 3, gap: GAP },
  row: { flexDirection: "row", gap: GAP },
  side: { flex: 1, gap: GAP },
  key: {
    flex: 1,
    height: KEY_HEIGHT,
    borderRadius: 12, // = rounded-xl on the old isotes pad
    alignItems: "center",
    justifyContent: "center",
  },
  tallKey: { flex: 0, height: KEY_HEIGHT * 3 + GAP * 2 },
  // System font (no fontFamily) to match the iOS decimal pad, not Outfit
  label: { fontSize: 22, fontWeight: "400" },
  //NOTE - no token, 20 is the system pad's "000" size
  tripleZeroLabel: { fontSize: 20, fontWeight: "400" },
});
