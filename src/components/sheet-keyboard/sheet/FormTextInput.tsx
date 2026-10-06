import React, { ComponentRef, Ref } from "react";
import { TextInput, TextInputProps } from "react-native";
import { useOptionalKeyboardHost } from "../keyboard/KeyboardHost";

export interface FormTextInputProps extends TextInputProps {
  ref?: Ref<ComponentRef<typeof TextInput>>;
}

/**
 * A system-keyboard TextInput. Any plain TextInput already works with
 * KeyboardAwareScrollView when the keyboard moves. This one also:
 *  - tells the host about focus, so it is revealed when focus moves between
 *    fields of the same keyboard height (no keyboard event fires then);
 *  - when tapped while the number pad is up, waits for the pad to leave before
 *    raising the system keyboard. It focuses (caret where tapped) with
 *    `showSoftInputOnFocus={false}`; once the pad is gone the prop flips back
 *    and RN reloads the input views of the focused field, which raises the
 *    system keyboard (RCTTextInputComponentView _setShowSoftInputOnFocus,
 *    verified in RN 0.86.3; re-check on upgrades).
 */
export function FormTextInput({
  onFocus,
  onBlur,
  showSoftInputOnFocus = true,
  // isotes is dark-only, but app.json's userInterfaceStyle is "automatic"
  keyboardAppearance = "dark",
  ...rest
}: FormTextInputProps) {
  const host = useOptionalKeyboardHost();
  const deferKeyboard = !!host?.padUp;
  return (
    <TextInput
      {...rest}
      keyboardAppearance={keyboardAppearance}
      showSoftInputOnFocus={showSoftInputOnFocus && !deferKeyboard}
      onFocus={(e) => {
        host?.notifyFocus({ deferredKeyboard: deferKeyboard });
        onFocus?.(e);
      }}
      onBlur={(e) => {
        // Focus changed: with no keyboard event to follow (e.g. a hardware keyboard), this is how
        // the host learns the field is gone (a sheet then drops a raise it held for a hand-off).
        host?.notifyFocus();
        onBlur?.(e);
      }}
    />
  );
}
