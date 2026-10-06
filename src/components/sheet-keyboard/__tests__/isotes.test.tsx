// isotes additions to the ported sheet (kept apart from integration.test.tsx,
// which stays diffable against the reference repo)
import { formatAmountInput } from "@/utils/currency";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import React, { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { KeyboardHost } from "../keyboard/KeyboardHost";
import { NumberPadInput } from "../keyboard/NumberPadInput";
import { BottomSheet } from "../sheet/BottomSheet";
import { FormTextInput } from "../sheet/FormTextInput";

const INSETS = { top: 47, bottom: 34 };

const ev = (y: number, t: number) => ({
  nativeEvent: { pageX: 0, pageY: y, timestamp: t },
});
async function dragHandle(dy: number, ms: number) {
  const handle = screen.getByTestId("sheet-handle");
  await fireEvent(handle, "responderGrant", ev(500, 0));
  await fireEvent(handle, "responderMove", ev(500 + dy / 2, ms / 2));
  await fireEvent(handle, "responderMove", ev(500 + dy, ms));
  await fireEvent(handle, "responderRelease", ev(500 + dy, ms));
}

describe("showCloseButton", () => {
  it("renders an X beside the title that closes the sheet", async () => {
    const onClose = jest.fn();
    await render(
      <BottomSheet
        visible
        onClose={onClose}
        title="New expense"
        showCloseButton
        safeAreaInsets={INSETS}
      >
        <Text>Body</Text>
      </BottomSheet>,
    );
    await fireEvent.press(screen.getByLabelText("Close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("lays the X over the header instead of inside it, so it never meets the header's responder claim", async () => {
    await render(
      <BottomSheet
        visible
        onClose={() => {}}
        title="New expense"
        showCloseButton
        safeAreaInsets={INSETS}
      >
        <Text>Body</Text>
      </BottomSheet>,
    );
    const handle = screen.getByTestId("sheet-handle");
    const close = screen.getByTestId("sheet-close");
    let node = close.parent;
    while (node) {
      expect(node).not.toBe(handle);
      node = node.parent;
    }
  });

  it("is hidden without the flag, and without a title", async () => {
    const { rerender } = await render(
      <BottomSheet
        visible
        onClose={() => {}}
        title="Pick"
        safeAreaInsets={INSETS}
      >
        <Text>Body</Text>
      </BottomSheet>,
    );
    expect(screen.queryByTestId("sheet-close")).toBeNull();
    await rerender(
      <BottomSheet
        visible
        onClose={() => {}}
        showCloseButton
        safeAreaInsets={INSETS}
      >
        <Text>Body</Text>
      </BottomSheet>,
    );
    expect(screen.queryByTestId("sheet-close")).toBeNull();
  });

  it("leaves the header drag working: a long drag below the lowest point closes", async () => {
    const onClose = jest.fn();
    await render(
      <BottomSheet
        visible
        onClose={onClose}
        title="New expense"
        showCloseButton
        snapPoints={[300]}
        safeAreaInsets={INSETS}
      >
        <Text>Body</Text>
      </BottomSheet>,
    );
    await dragHandle(400, 3000);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("keyboardAppearance", () => {
  it("defaults to dark on both inputs, and a caller can override it", async () => {
    await render(
      <KeyboardHost safeAreaInsets={INSETS}>
        <FormTextInput testID="text" />
        <FormTextInput testID="text-light" keyboardAppearance="light" />
        <NumberPadInput testID="pad" value="" onChangeText={() => {}} />
      </KeyboardHost>,
    );
    expect(screen.getByTestId("text").props.keyboardAppearance).toBe("dark");
    expect(screen.getByTestId("text-light").props.keyboardAppearance).toBe(
      "light",
    );
    expect(screen.getByTestId("pad").props.keyboardAppearance).toBe("dark");
  });
});

// ── grouped NumberPadInput (helpers mirror integration.test.tsx) ────────────
async function until(check: () => void, timeoutMs = 3000) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    await act(() => new Promise<void>((resolve) => setTimeout(resolve, 25)));
    try {
      check();
      return;
    } catch (error) {
      if (Date.now() > deadline) throw error;
    }
  }
}
const padUp = () =>
  until(() => {
    const dock = screen.getByTestId("number-pad-dock", {
      includeHiddenElements: true,
    });
    expect(dock.props.pointerEvents).toBe("auto");
    expect(StyleSheet.flatten(dock.props.style).bottom).toBe(0);
  });
const press = (label: string) => fireEvent.press(screen.getByLabelText(label));

/** Stores what the app stores: the parent re-formats every change, like AmountField. */
function Amount() {
  const [amount, setAmount] = useState("");
  return (
    <KeyboardHost safeAreaInsets={INSETS}>
      <NumberPadInput
        testID="amount"
        value={amount}
        onChangeText={(text) => setAmount(formatAmountInput(text, 2))}
        grouping
        maxDecimals={2}
        maxIntegerDigits={15}
      />
    </KeyboardHost>
  );
}
const amount = () => screen.getByTestId("amount");

describe("grouped NumberPadInput", () => {
  it("typing 1 2 3 4 shows 1,234 with the caret at the end", async () => {
    await render(<Amount />);
    await fireEvent(amount(), "focus");
    await padUp();
    for (const key of ["1", "2", "3", "4"]) await press(key);
    expect(amount().props.value).toBe("1,234");
    expect(amount().props.selection).toEqual({ start: 5, end: 5 });
  });

  it("inserts at a caret moved into the middle, and the parent's echo doesn't reset it", async () => {
    await render(<Amount />);
    await fireEvent(amount(), "focus");
    await padUp();
    for (const key of ["1", "2", "3", "4"]) await press(key);
    // "1,2|34": the user taps between 2 and 3
    await fireEvent(amount(), "selectionChange", {
      nativeEvent: { selection: { start: 3, end: 3 } },
    });
    await press("5");
    expect(amount().props.value).toBe("12,534");
    // caret right after the 5, not jumped to the end by the echoed value
    expect(amount().props.selection).toEqual({ start: 4, end: 4 });
    await press("Decimal point"); // "125.|34": still valid, 2 decimals
    expect(amount().props.value).toBe("125.34");
    // Delete acts on press-in (hold-to-repeat), so send what a touch sends
    await fireEvent(screen.getByLabelText("Delete"), "pressIn");
    await fireEvent(screen.getByLabelText("Delete"), "pressOut");
    expect(amount().props.value).toBe("12,534");
    expect(amount().props.selection).toEqual({ start: 4, end: 4 });
  });

  it("sanitizes and groups a paste", async () => {
    await render(<Amount />);
    // No focus needed (and none wanted: a pad sliding in would outlive the file)
    await fireEvent.changeText(amount(), "1234567.891");
    expect(amount().props.value).toBe("1,234,567.89");
  });
});
