/** @jsxImportSource react */
// Plain React JSX, not NativeWind's: css-interop's Pressable wrapper drops a
// function `style` (the keys' pressed state), and nothing here uses className
import { colors as tokens } from "@/themes/color";
import { textStyle } from "@/themes/typography";
import { Delete } from "lucide-react-native";
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
      style={[
        styles.pad,
        { backgroundColor: colors.pad, paddingBottom: GAP + bottomInset },
      ]}
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
                tone={key === "." ? "faint" : "plain"}
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
          onPress={onDone}
          tone="accent"
          tall
        />
      </View>
    </View>
  );
});

// isotes is dark-only: fixed tokens, no light branch.
// Pressed = one step lighter (color.js convention).
const colors = {
  pad: tokens.grey[975],
  key: tokens.grey[850],
  keyPressed: tokens.grey[825],
  muted: tokens.grey[900],
  mutedPressed: tokens.grey[850],
  text: tokens.grey[50],
  faintText: tokens.grey[400],
  accent: tokens.orange[400],
  //NOTE - no token for a pressed orange-400, falling back to orange-300
  accentPressed: tokens.orange[300],
  accentText: tokens.orange[900],
};

interface KeyButtonProps {
  label: string;
  a11yLabel: string;
  /** Rendered instead of the label text (the label stays as the a11y fallback). */
  icon?: ReactNode;
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  disabled?: boolean;
  /** `faint` is a plain key with a dimmed label (the "." key, as on the old isotes pad). */
  tone?: "plain" | "faint" | "muted" | "accent";
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
  tone = "plain",
  tall,
}: KeyButtonProps) {
  const [idle, active] =
    tone === "accent"
      ? [colors.accent, colors.accentPressed]
      : tone === "muted"
        ? [colors.muted, colors.mutedPressed]
        : [colors.key, colors.keyPressed];
  const textColor =
    tone === "accent"
      ? colors.accentText
      : tone === "faint"
        ? colors.faintText
        : colors.text;
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
          opacity: disabled ? 0.35 : 1,
        },
      ]}
    >
      {icon ?? (
        <Text
          style={[
            tone === "accent" ? styles.accentLabel : styles.label,
            { color: textColor },
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
      icon={<Delete size={22} color={colors.text} />}
      onPressIn={start}
      onPressOut={stop}
      tone="muted"
    />
  );
}

const styles = StyleSheet.create({
  pad: {
    flexDirection: "row",
    gap: GAP,
    paddingTop: GAP,
    paddingHorizontal: GAP,
    backgroundColor: colors.pad,
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
  label: textStyle("amount"),
  accentLabel: textStyle("body-semibold"),
});
