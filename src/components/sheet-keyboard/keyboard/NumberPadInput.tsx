import React, {
  ComponentRef,
  Ref,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { TextInput, TextInputProps } from "react-native";
import { useKeyboardHost } from "./KeyboardHost";
import {
  applyNumberPadKey,
  NumberPadKey,
  NumberPadOptions,
  sanitizeNumericText,
  Selection,
} from "./numberPadLogic";

type Instance = ComponentRef<typeof TextInput>;

export interface NumberPadInputProps
  extends
    Omit<
      TextInputProps,
      | "value"
      | "onChangeText"
      | "selection"
      | "showSoftInputOnFocus"
      | "keyboardType"
      | "inputMode"
      | "maxLength"
      | "multiline"
    >,
    NumberPadOptions {
  value: string;
  onChangeText: (text: string) => void;
  ref?: Ref<Instance>;
}

/**
 * A real TextInput (native caret, selection, paste, VoiceOver, focus) with the
 * system keyboard suppressed. Keys come from the number pad rendered by the
 * nearest KeyboardHost and are applied at the caret.
 */
export function NumberPadInput({
  value,
  onChangeText,
  maxDecimals,
  maxLength,
  maxIntegerDigits,
  grouping,
  onFocus,
  onBlur,
  onSelectionChange,
  ref,
  // Same dark default as FormTextInput (app.json userInterfaceStyle is "automatic")
  keyboardAppearance = "dark",
  ...rest
}: NumberPadInputProps) {
  const options = { maxDecimals, maxLength, maxIntegerDigits, grouping };
  const id = useId();
  const host = useKeyboardHost();
  const inputRef = useRef<Instance | null>(null);
  // An input that unmounts while focused never sends blur: release the pad so it can't get stuck.
  const { releasePad } = host;
  useEffect(() => () => releasePad(id), [releasePad, id]);
  const [selection, setSelection] = useState<Selection>({
    start: value.length,
    end: value.length,
  });

  // Keys arrive long after focus registered this input, and can arrive before
  // the parent has committed the previous key. `latest` is the text and caret
  // keys apply to; it runs ahead of props while our own edits are in flight.
  const latest = useRef({
    value,
    selection,
    onChangeText,
    options,
  });
  /** Values emitted but not yet seen back in props, oldest first. */
  const inFlight = useRef<string[]>([]);
  const lastProp = useRef(value);
  useLayoutEffect(() => {
    const l = latest.current;
    l.onChangeText = onChangeText;
    l.options = options;
    // Re-renders of our own (e.g. the caret moved) carry an unchanged prop: nothing to reconcile.
    if (value === lastProp.current) return;
    lastProp.current = value;
    const echo = inFlight.current.indexOf(value);
    if (echo !== -1) {
      // A (possibly stale) commit of our own edit: `latest` is already at or past it.
      inFlight.current.splice(0, echo + 1);
    } else if (value !== l.value) {
      // The parent changed the text itself (reset, formatting): adopt it.
      inFlight.current = [];
      l.value = value;
      l.selection = { start: value.length, end: value.length };
    }
  });

  const emit = (text: string) => {
    inFlight.current.push(text);
    latest.current.value = text;
    latest.current.onChangeText(text);
  };

  const applyKey = (key: NumberPadKey) => {
    const l = latest.current;
    const prev = {
      text: l.value,
      selection: clampSelection(l.selection, l.value.length),
    };
    const next = applyNumberPadKey(prev, key, l.options);
    if (next === prev) return;
    l.selection = next.selection;
    setSelection(next.selection);
    if (next.text !== prev.text) emit(next.text);
  };

  const setRefs = (instance: Instance | null) => {
    inputRef.current = instance;
    if (typeof ref === "function") ref(instance);
    else if (ref) (ref as { current: Instance | null }).current = instance;
  };

  return (
    <TextInput
      {...rest}
      keyboardAppearance={keyboardAppearance}
      ref={setRefs}
      value={value}
      selection={clampSelection(selection, value.length)}
      showSoftInputOnFocus={false}
      autoCorrect={false}
      spellCheck={false}
      onSelectionChange={(e) => {
        latest.current.selection = e.nativeEvent.selection;
        setSelection(e.nativeEvent.selection);
        onSelectionChange?.(e);
      }}
      // Paste, dictation and hardware keyboards bypass the pad: same rules apply.
      onChangeText={(text) => {
        const clean = sanitizeNumericText(text, options);
        if (clean !== latest.current.value) emit(clean);
      }}
      onFocus={(e) => {
        host.claimPad({
          id,
          onKey: applyKey,
          blur: () => inputRef.current?.blur(),
          decimalEnabled: maxDecimals !== 0,
        });
        onFocus?.(e);
      }}
      onBlur={(e) => {
        host.releasePad(id);
        onBlur?.(e);
      }}
    />
  );
}

function clampSelection({ start, end }: Selection, length: number): Selection {
  return { start: Math.min(start, length), end: Math.min(end, length) };
}
