import { act, fireEvent, render, screen } from "@testing-library/react-native";
import React, { createRef, useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Dimensions,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";
import {
  KeyboardHost,
  KeyboardTransition,
  useKeyboardHost,
} from "../keyboard/KeyboardHost";
import { HANDOFF_PT, PAD_RELEASE_AT, SHEET_FADE } from "../keyboard/motion";
import { NumberPadInput } from "../keyboard/NumberPadInput";
import { BottomSheet } from "../sheet/BottomSheet";
import { FormTextInput } from "../sheet/FormTextInput";
import { KeyboardAwareScrollView } from "../sheet/KeyboardAwareScrollView";
import { MIN_VISIBLE_SCROLL } from "../sheet/sheetMath";

const INSETS = { top: 47, bottom: 34 };

/**
 * Waits for a condition instead of a fixed sleep, so slow machines don't make
 * tests flaky. Polls inside act() so animation-driven updates stay wrapped.
 */
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
/** Up = interactive *and* finished sliding in (interactive is set when the slide starts). */
const padUp = () =>
  until(() => {
    expect(padIsUp()).toBe(true);
    const dock = screen.getByTestId("number-pad-dock", {
      includeHiddenElements: true,
    });
    expect(StyleSheet.flatten(dock.props.style).bottom).toBe(0); // finished sliding in
  });
/** Down = released *and* finished sliding out (it is released early, while still sliding: PAD_RELEASE_AT). */
const padDown = async () => {
  await until(() => expect(padIsUp()).toBe(false));
  await act(() => new Promise<void>((resolve) => setTimeout(resolve, 250)));
};
const press = (label: string) => fireEvent.press(screen.getByLabelText(label));
/** Emits an iOS keyboard frame event as UIKit would (`height` 0 = hiding). */
async function systemKeyboard(height: number) {
  const screenHeight = Dimensions.get("screen").height;
  const emitter = (
    Keyboard as unknown as {
      _emitter: { emit: (e: string, p: unknown) => void };
    }
  )._emitter;
  const event = {
    duration: 250,
    easing: "keyboard",
    endCoordinates: {
      screenX: 0,
      screenY: screenHeight - height,
      width: 402,
      height,
    },
  };
  await act(() =>
    emitter.emit(
      height > 0 ? "keyboardWillChangeFrame" : "keyboardWillHide",
      event,
    ),
  );
}

/** The hidden dock is (correctly) hidden from accessibility, so opt in to hidden elements. */
function padIsUp() {
  const dock = screen.getByTestId("number-pad-dock", {
    includeHiddenElements: true,
  });
  const up = dock.props.pointerEvents === "auto";
  expect(dock.props.accessibilityElementsHidden).toBe(!up);
  return up;
}

function Form() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [note, setNote] = useState("");
  return (
    <KeyboardHost safeAreaInsets={INSETS}>
      <KeyboardAwareScrollView>
        <FormTextInput testID="note" value={note} onChangeText={setNote} />
        <NumberPadInput
          testID="a"
          value={a}
          onChangeText={setA}
          maxDecimals={2}
        />
        <NumberPadInput
          testID="b"
          value={b}
          onChangeText={setB}
          maxDecimals={4}
        />
      </KeyboardAwareScrollView>
      <Text testID="values">{`${a}|${b}|${note}`}</Text>
    </KeyboardHost>
  );
}
const values = () => screen.getByTestId("values").props.children as string;

describe("number pad wiring", () => {
  it("suppresses the system keyboard on pad inputs only", async () => {
    await render(<Form />);
    expect(screen.getByTestId("a").props.showSoftInputOnFocus).toBe(false);
    expect(screen.getByTestId("b").props.showSoftInputOnFocus).toBe(false);
    expect(screen.getByTestId("note").props.showSoftInputOnFocus).not.toBe(
      false,
    );
  });

  it("shows the pad on focus, routes keys to the focused input, hides on blur", async () => {
    await render(<Form />);
    expect(padIsUp()).toBe(false);
    await fireEvent(screen.getByTestId("a"), "focus");
    await padUp();
    for (const key of ["1", "2", "Decimal point", "5", "Triple zero", "9"])
      await press(key);
    expect(values()).toBe("12.59||");
    await fireEvent(screen.getByTestId("a"), "blur");
    await padDown();
  });

  it("A -> B with a late blur from A keeps the pad and sends keys to B", async () => {
    await render(<Form />);
    await fireEvent(screen.getByTestId("a"), "focus");
    await padUp();
    await fireEvent(screen.getByTestId("b"), "focus");
    await fireEvent(screen.getByTestId("a"), "blur"); // arrives after B's focus
    // An absence check ("the pad did not hide") has to outlast a full transition.
    await act(() => new Promise<void>((resolve) => setTimeout(resolve, 600)));
    expect(padIsUp()).toBe(true);
    await press("7");
    expect(values()).toBe("|7|");
  });

  it("hides the pad when focus moves to a system input while the pad is still sliding in", async () => {
    // Regression: a focus notification mid-transition used to invalidate the
    // running transition, so the pad was never marked non-interactive.
    await render(<Form />);
    await fireEvent(screen.getByTestId("a"), "focus");
    await act(() => new Promise<void>((resolve) => setTimeout(resolve, 30)));
    await fireEvent(screen.getByTestId("a"), "blur");
    await fireEvent(screen.getByTestId("note"), "focus");
    await padDown();
  });

  it("hides the pad when focus moves to a system-keyboard input", async () => {
    await render(<Form />);
    await fireEvent(screen.getByTestId("a"), "focus");
    await padUp();
    await fireEvent(screen.getByTestId("a"), "blur");
    await fireEvent(screen.getByTestId("note"), "focus");
    await padDown();
  });

  it("Done blurs the focused input", async () => {
    const ref = createRef<TextInput>();
    function One() {
      const [v, setV] = useState("");
      return (
        <KeyboardHost safeAreaInsets={INSETS}>
          <NumberPadInput
            ref={ref}
            testID="one"
            value={v}
            onChangeText={setV}
          />
        </KeyboardHost>
      );
    }
    await render(<One />);
    await fireEvent(screen.getByTestId("one"), "focus");
    await padUp();
    const blur = jest.spyOn(ref.current!, "blur");
    await press("Done");
    expect(blur).toHaveBeenCalledTimes(1);
  });

  it("sanitizes text that bypasses the pad (paste, hardware keyboard)", async () => {
    await render(<Form />);
    await fireEvent.changeText(screen.getByTestId("a"), "$1,234.567");
    expect(values()).toBe("1234.56||");
  });

  it('greys out "." for integer-only fields', async () => {
    function IntOnly() {
      const [v, setV] = useState("");
      return (
        <KeyboardHost safeAreaInsets={INSETS}>
          <NumberPadInput
            testID="int"
            value={v}
            onChangeText={setV}
            maxDecimals={0}
          />
        </KeyboardHost>
      );
    }
    await render(<IntOnly />);
    await fireEvent(screen.getByTestId("int"), "focus");
    await padUp();
    expect(
      screen.getByLabelText("Decimal point").props.accessibilityState,
    ).toMatchObject({ disabled: true });
  });

  it("a key that arrives between two parent commits is applied to the newest text", async () => {
    // Parent that commits on demand, like a store or a transition that
    // commits after the event. Keys can then arrive while an older value is
    // still waiting to be committed.
    const queue: string[] = [];
    let commitNext = () => {};
    function AsyncParent() {
      const [v, setV] = useState("0.12");
      useEffect(() => {
        commitNext = () => setV(queue.shift()!);
      }, []);
      return (
        <KeyboardHost safeAreaInsets={INSETS}>
          <NumberPadInput
            testID="slow"
            value={v}
            onChangeText={(t) => queue.push(t)}
            maxDecimals={4}
          />
          <Text testID="slow-value">{v}</Text>
        </KeyboardHost>
      );
    }
    await render(<AsyncParent />);
    await fireEvent(screen.getByTestId("slow"), "focus");
    await padUp();
    await press("3"); // emits 0.123 (not committed yet)
    await press("4"); // emits 0.1234
    await act(() => commitNext()); // the stale 0.123 commits now
    await press("5"); // decimals are full: must be rejected
    while (queue.length) await act(() => commitNext());
    expect(screen.getByTestId("slow-value").props.children).toBe("0.1234");
  });
});

describe("lifecycle", () => {
  it("hides the pad when the focused input unmounts (no blur event)", async () => {
    let hide = () => {};
    function Conditional() {
      const [shown, setShown] = useState(true);
      const [v, setV] = useState("");
      useEffect(() => {
        hide = () => setShown(false);
      }, []);
      return (
        <KeyboardHost safeAreaInsets={INSETS}>
          {shown ? (
            <NumberPadInput testID="c" value={v} onChangeText={setV} />
          ) : null}
        </KeyboardHost>
      );
    }
    await render(<Conditional />);
    await fireEvent(screen.getByTestId("c"), "focus");
    await padUp();
    await act(() => hide());
    await padDown();
  });
});

describe("tap outside, deferred native keyboard, transition events", () => {
  const content = () => screen.getByTestId("keyboard-aware-content");
  afterEach(() => jest.restoreAllMocks()); // undo the currentlyFocusedInput spies below

  /** A raw tap on the scroll content: touch start/end on `target` (a native tag), then one frame. */
  async function tap(
    target: number,
    opts: { move?: number; scroll?: boolean } = {},
  ) {
    await fireEvent(content(), "touchStart", {
      nativeEvent: { pageX: 100, pageY: 100, target },
    });
    if (opts.scroll)
      await fireEvent(screen.getByTestId("kasv"), "scrollBeginDrag", {
        nativeEvent: {},
      });
    await fireEvent(content(), "touchEnd", {
      nativeEvent: { pageX: 100, pageY: 100 + (opts.move ?? 0), target },
    });
    await act(
      () =>
        new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
    );
  }
  const BUTTON = 987654; // the native tag of a button (or label, or empty space) in the content
  /** The test renderer never focuses natively, so tell TextInputState what is focused. */
  const focusedIs = (input: TextInput | null) =>
    jest
      .spyOn(TextInput.State, "currentlyFocusedInput")
      .mockReturnValue(
        input as unknown as ReturnType<
          typeof TextInput.State.currentlyFocusedInput
        >,
      );

  function Tappable({ persist }: { persist?: "always" }) {
    const [v, setV] = useState("");
    const [note, setNote] = useState("");
    return (
      <KeyboardHost safeAreaInsets={INSETS}>
        <KeyboardAwareScrollView
          testID="kasv"
          keyboardShouldPersistTaps={persist}
        >
          <FormTextInput
            ref={noteRef}
            testID="note"
            value={note}
            onChangeText={setNote}
          />
          <NumberPadInput
            ref={padRef}
            testID="pad"
            value={v}
            onChangeText={setV}
          />
        </KeyboardAwareScrollView>
      </KeyboardHost>
    );
  }
  const padRef = createRef<TextInput>();
  const noteRef = createRef<TextInput>();

  it("a tap outside the focused input (a button too) dismisses the pad, like the system keyboard", async () => {
    await render(<Tappable />);
    await fireEvent(screen.getByTestId("pad"), "focus");
    await padUp();
    focusedIs(padRef.current);
    const blur = jest.spyOn(padRef.current!, "blur");
    await tap(BUTTON);
    expect(blur).toHaveBeenCalledTimes(1); // the input's onBlur then hides the pad
  });

  it("a tap outside dismisses the system keyboard too", async () => {
    await render(<Tappable />);
    await fireEvent(screen.getByTestId("note"), "focus");
    focusedIs(noteRef.current);
    const dismiss = jest.spyOn(Keyboard, "dismiss");
    await tap(BUTTON);
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it('keeps the keyboard for drags, scrolls, keyboardShouldPersistTaps="always", and with nothing focused', async () => {
    await render(<Tappable />);
    await fireEvent(screen.getByTestId("pad"), "focus");
    await padUp();
    focusedIs(padRef.current);
    const blur = jest.spyOn(padRef.current!, "blur");
    await tap(BUTTON, { move: 30 });
    await tap(BUTTON, { scroll: true });
    expect(blur).not.toHaveBeenCalled();
    await tap(BUTTON); // the scroll flag is per touch
    expect(blur).toHaveBeenCalledTimes(1);

    await screen.rerender(<Tappable persist="always" />);
    await tap(BUTTON);
    expect(blur).toHaveBeenCalledTimes(1);

    focusedIs(null);
    await screen.rerender(<Tappable />);
    const dismiss = jest.spyOn(Keyboard, "dismiss");
    await tap(BUTTON);
    expect(dismiss).not.toHaveBeenCalled();
  });

  it("a native field tapped while the pad is up waits for the pad to leave, then gets its keyboard", async () => {
    await render(<Form />);
    expect(screen.getByTestId("note").props.showSoftInputOnFocus).toBe(true);
    await fireEvent(screen.getByTestId("a"), "focus");
    await padUp();
    // While the pad is up, focusing Note must not raise the system keyboard yet.
    expect(screen.getByTestId("note").props.showSoftInputOnFocus).toBe(false);
    await fireEvent(screen.getByTestId("a"), "blur");
    await fireEvent(screen.getByTestId("note"), "focus");
    await padDown();
    // Pad gone: the flag flips back, and RN raises the system keyboard for the focused field.
    expect(screen.getByTestId("note").props.showSoftInputOnFocus).toBe(true);
  });

  const dockBottom = () =>
    StyleSheet.flatten(
      screen.getByTestId("number-pad-dock", { includeHiddenElements: true })
        .props.style,
    ).bottom as number;
  const layoutPad = () =>
    fireEvent(
      screen.getByTestId("number-pad", { includeHiddenElements: true }),
      "layout",
      {
        nativeEvent: { layout: { x: 0, y: 0, width: 402, height: 256 } },
      },
    );

  it("releases the pad before it has fully slid out, so a waiting native keyboard starts without a pause", async () => {
    await render(<Form />);
    await layoutPad();
    await fireEvent(screen.getByTestId("a"), "focus");
    await padUp();
    await fireEvent(screen.getByTestId("a"), "blur");
    await until(() => expect(padIsUp()).toBe(false));
    // The flip re-rendered the dock: it was still on its way out, about PAD_RELEASE_AT of it left.
    expect(dockBottom()).toBeGreaterThan(-256);
    expect(dockBottom()).toBeLessThanOrEqual(-256 * (1 - PAD_RELEASE_AT) + 1);
    await act(() => new Promise<void>((resolve) => setTimeout(resolve, 300))); // let the slide finish inside act
  });

  it("the pad finishes sliding out when the native keyboard starts before it is gone", async () => {
    // Regression: Animated.parallel stops all of a transition's animations when one is retargeted
    // (stopTogether), which would have frozen the pad partway once the next keyboard started.
    await render(<Form />);
    await layoutPad();
    await fireEvent(screen.getByTestId("a"), "focus");
    await padUp();
    jest
      .spyOn(TextInput.State, "currentlyFocusedInput")
      .mockReturnValue({ measureLayout: () => {} } as unknown as ReturnType<
        typeof TextInput.State.currentlyFocusedInput
      >);
    await fireEvent(screen.getByTestId("a"), "blur");
    await fireEvent(screen.getByTestId("note"), "focus");
    await until(() => expect(padIsUp()).toBe(false)); // released early: the native keyboard may start
    await systemKeyboard(335);
    await act(() => new Promise<void>((resolve) => setTimeout(resolve, 500)));
    await screen.rerender(<Form />); // the test renderer reads Animated values on render
    expect(dockBottom()).toBe(-256); // fully out, not frozen where the keyboard caught it
  });

  it('does not announce "settled" while a transition is still in flight', async () => {
    // Regression: iOS sends a frame for the pad's empty inputView mid-slide. The resulting no-op
    // flush announced "settled", which stopped the scroll that follows the keyboard halfway.
    let settled = 0;
    function SettleProbe() {
      const host = useKeyboardHost();
      useEffect(() => host.onSettled(() => (settled += 1)), [host]);
      return null;
    }
    function WithProbe() {
      const [v, setV] = useState("");
      return (
        <KeyboardHost safeAreaInsets={INSETS}>
          <SettleProbe />
          <NumberPadInput testID="p" value={v} onChangeText={setV} />
        </KeyboardHost>
      );
    }
    await render(<WithProbe />);
    await fireEvent(
      screen.getByTestId("number-pad", { includeHiddenElements: true }),
      "layout",
      {
        nativeEvent: { layout: { x: 0, y: 0, width: 402, height: 256 } },
      },
    );
    await fireEvent(screen.getByTestId("p"), "focus");
    await act(() => new Promise<void>((resolve) => setTimeout(resolve, 60))); // the pad is sliding up
    await systemKeyboard(17); // nothing to move for the pad owner: a no-op flush
    await act(() => new Promise<void>((resolve) => setTimeout(resolve, 40)));
    expect(settled).toBe(0);
    await padUp();
    await until(() => expect(settled).toBe(1)); // announced once, when the slide finishes
  });

  it("announces each transition before its first frame, from where the inset is to where it goes", async () => {
    const seen: KeyboardTransition[] = [];
    function Probe() {
      const host = useKeyboardHost();
      useEffect(() => host.onTransitionStart((t) => seen.push(t)), [host]);
      return null;
    }
    function WithProbe() {
      const [v, setV] = useState("");
      return (
        <KeyboardHost safeAreaInsets={INSETS}>
          <Probe />
          <NumberPadInput testID="p" value={v} onChangeText={setV} />
        </KeyboardHost>
      );
    }
    await render(<WithProbe />);
    await fireEvent(
      screen.getByTestId("number-pad", { includeHiddenElements: true }),
      "layout",
      {
        nativeEvent: { layout: { x: 0, y: 0, width: 402, height: 256 } },
      },
    );
    await fireEvent(screen.getByTestId("p"), "focus");
    await padUp();
    await fireEvent(screen.getByTestId("p"), "blur");
    await padDown();
    expect(seen).toEqual([
      { from: 0, to: 256 },
      { from: 256, to: 0 },
    ]);
  });
  it("a short sheet raise follows a transition that flips padUp to its end (no mid-transition freeze)", async () => {
    // Regression: re-subscribing when the host context value changed (padUp) re-anchored the
    // geometry mid-transition with slope 0, freezing the sheet height at its starting value.
    function SheetWithPad() {
      const [v, setV] = useState("");
      return (
        <BottomSheet visible onClose={() => {}} safeAreaInsets={INSETS}>
          <KeyboardAwareScrollView testID="scroll">
            <NumberPadInput testID="sp" value={v} onChangeText={setV} />
          </KeyboardAwareScrollView>
        </BottomSheet>
      );
    }
    await render(<SheetWithPad />);
    await fireEvent(
      screen.getByTestId("number-pad", { includeHiddenElements: true }),
      "layout",
      {
        nativeEvent: { layout: { x: 0, y: 0, width: 402, height: 256 } },
      },
    );
    await fireEvent(screen.getByTestId("sheet-handle"), "layout", {
      nativeEvent: { layout: { x: 0, y: 0, width: 402, height: 60 } },
    });
    await fireEvent(
      screen.getByTestId("scroll"),
      "contentSizeChange",
      402,
      200,
    );
    const height = () =>
      StyleSheet.flatten(screen.getByTestId("sheet-surface").props.style)
        .height;
    expect(height()).toBeCloseTo(60 + 200 + INSETS.bottom); // resting: its content
    await fireEvent(screen.getByTestId("sp"), "focus");
    await padUp();
    await screen.rerender(<SheetWithPad />); // the test renderer reads Animated values on render
    expect(height()).toBeCloseTo(256 + 60 + MIN_VISIBLE_SCROLL); // grown to keep header + strip above the pad
  });
});

describe("keyboard sequences and stacked hosts", () => {
  afterEach(() => jest.restoreAllMocks()); // undo the currentlyFocusedInput spies below
  /** Simulates the system keyboard (iOS keyboardWillChangeFrame / keyboardWillHide). */
  function Probe({ seen }: { seen: KeyboardTransition[] }) {
    const host = useKeyboardHost();
    useEffect(() => host.onTransitionStart((t) => seen.push(t)), [host, seen]);
    return null;
  }

  it("native -> pad runs in sequence: the system keyboard leaves, then the pad slides up", async () => {
    const seen: KeyboardTransition[] = [];
    function Seq() {
      const [v, setV] = useState("");
      return (
        <KeyboardHost safeAreaInsets={INSETS}>
          <Probe seen={seen} />
          <FormTextInput testID="n" />
          <NumberPadInput testID="p" value={v} onChangeText={setV} />
        </KeyboardHost>
      );
    }
    await render(<Seq />);
    await fireEvent(
      screen.getByTestId("number-pad", { includeHiddenElements: true }),
      "layout",
      {
        nativeEvent: { layout: { x: 0, y: 0, width: 402, height: 256 } },
      },
    );
    const focused = jest.spyOn(TextInput.State, "currentlyFocusedInput");
    focused.mockReturnValue(
      {} as ReturnType<typeof TextInput.State.currentlyFocusedInput>,
    );
    await fireEvent(screen.getByTestId("n"), "focus");
    await systemKeyboard(335);
    await until(() => expect(seen).toEqual([{ from: 0, to: 335 }]));
    await act(() => new Promise<void>((resolve) => setTimeout(resolve, 400)));

    await fireEvent(screen.getByTestId("n"), "blur");
    await fireEvent(screen.getByTestId("p"), "focus");
    await systemKeyboard(0); // iOS hides the system keyboard for the pad input's empty inputView
    await padUp();
    // (Not polled in between: phase 1 is short, so a poll races it.)
    expect(seen.slice(0, 2)).toEqual([
      { from: 0, to: 335 },
      { from: 335, to: 0 }, // phase 1: only the system keyboard moves
    ]);
    // Phase 2 (the pad slides up) starts once the system keyboard is visibly gone, without
    // waiting out its curve's flat tail (that waited ~0.2 s with no keyboard on screen).
    expect(seen).toHaveLength(3);
    expect(seen[2].to).toBe(256);
    expect(seen[2].from).toBeGreaterThan(0);
    expect(seen[2].from).toBeLessThanOrEqual(HANDOFF_PT);
  });

  it("a keyboard event arriving mid-sequence does not start the pad early", async () => {
    const seen: KeyboardTransition[] = [];
    function Seq() {
      const [v, setV] = useState("");
      return (
        <KeyboardHost safeAreaInsets={INSETS}>
          <Probe seen={seen} />
          <FormTextInput testID="n" />
          <NumberPadInput testID="p" value={v} onChangeText={setV} />
        </KeyboardHost>
      );
    }
    await render(<Seq />);
    await fireEvent(
      screen.getByTestId("number-pad", { includeHiddenElements: true }),
      "layout",
      {
        nativeEvent: { layout: { x: 0, y: 0, width: 402, height: 256 } },
      },
    );
    const focused = jest.spyOn(TextInput.State, "currentlyFocusedInput");
    focused.mockReturnValue(
      {} as ReturnType<typeof TextInput.State.currentlyFocusedInput>,
    );
    await fireEvent(screen.getByTestId("n"), "focus");
    await systemKeyboard(335);
    await until(() => expect(seen).toEqual([{ from: 0, to: 335 }]));
    await act(() => new Promise<void>((resolve) => setTimeout(resolve, 400)));

    await fireEvent(screen.getByTestId("n"), "blur");
    await fireEvent(screen.getByTestId("p"), "focus");
    await systemKeyboard(0); // iOS hides the system keyboard for the pad input's empty inputView
    // Regression: a second frame event for the swap (iOS sends them before or after the focus
    // change) flushed again mid-way, and that flush started the pad while the keyboard was half up.
    await act(() => new Promise<void>((resolve) => setTimeout(resolve, 40)));
    await systemKeyboard(0);
    await padUp();
    // (Not polled in between: phase 1 is short, so a poll races it.)
    expect(seen.slice(0, 2)).toEqual([
      { from: 0, to: 335 },
      { from: 335, to: 0 }, // phase 1: only the system keyboard moves
    ]);
    // Phase 2 (the pad slides up) starts once the system keyboard is visibly gone, without
    // waiting out its curve's flat tail (that waited ~0.2 s with no keyboard on screen).
    expect(seen).toHaveLength(3);
    expect(seen[2].to).toBe(256);
    expect(seen[2].from).toBeGreaterThan(0);
    expect(seen[2].from).toBeLessThanOrEqual(HANDOFF_PT);
  });

  it("only the top-most host answers to the system keyboard (stacked sheets)", async () => {
    const outer: KeyboardTransition[] = [];
    const inner: KeyboardTransition[] = [];
    await render(
      <KeyboardHost safeAreaInsets={INSETS}>
        <Probe seen={outer} />
        <KeyboardHost safeAreaInsets={INSETS}>
          <Probe seen={inner} />
          <FormTextInput testID="inner-note" />
        </KeyboardHost>
      </KeyboardHost>,
    );
    jest
      .spyOn(TextInput.State, "currentlyFocusedInput")
      .mockReturnValue(
        {} as ReturnType<typeof TextInput.State.currentlyFocusedInput>,
      );
    await fireEvent(screen.getByTestId("inner-note"), "focus");
    await systemKeyboard(335);
    await until(() => expect(inner).toEqual([{ from: 0, to: 335 }]));
    await act(() => new Promise<void>((resolve) => setTimeout(resolve, 400)));
    expect(outer).toEqual([]); // the sheet underneath does not move
  });
});

describe("sheet modes", () => {
  const room = () => Dimensions.get("window").height - INSETS.top - 12;
  const surfaceStyle = () =>
    StyleSheet.flatten(screen.getByTestId("sheet-surface").props.style);
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

  it("snap mode opens at the initial point and a drag up past the middle settles on the next one", async () => {
    const onSnapChange = jest.fn();
    await render(
      <BottomSheet
        visible
        onClose={() => {}}
        snapPoints={[300, 600]}
        onSnapChange={onSnapChange}
        safeAreaInsets={INSETS}
      >
        <Text>Body</Text>
      </BottomSheet>,
    );
    expect(surfaceStyle().height).toBe(300);
    await dragHandle(-200, 2000); // slow drag up to 500: nearer 600
    await until(() => expect(onSnapChange).toHaveBeenCalledWith(1));
    expect(surfaceStyle().height).toBeCloseTo(600, 0);
  });

  it("snap mode: a slow short drag snaps back, a long drag below the lowest closes", async () => {
    const onClose = jest.fn();
    await render(
      <BottomSheet
        visible
        onClose={onClose}
        snapPoints={[300, 600]}
        initialSnap={1}
        safeAreaInsets={INSETS}
      >
        <Text>Body</Text>
      </BottomSheet>,
    );
    await dragHandle(80, 2000); // 600 -> 520: nearer 600
    await until(() => expect(surfaceStyle().height).toBeCloseTo(600, 0));
    expect(onClose).not.toHaveBeenCalled();
    await dragHandle(550, 3000); // far below 300
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("snap mode: pulling the content down at its top goes one point down instead of closing", async () => {
    const onClose = jest.fn();
    const onSnapChange = jest.fn();
    await render(
      <BottomSheet
        visible
        onClose={onClose}
        snapPoints={[300, 600]}
        initialSnap={1}
        onSnapChange={onSnapChange}
        safeAreaInsets={INSETS}
      >
        <KeyboardAwareScrollView testID="scroll">
          <Text>Body</Text>
        </KeyboardAwareScrollView>
      </BottomSheet>,
    );
    const pull = () =>
      fireEvent(screen.getByTestId("scroll"), "scrollEndDrag", {
        nativeEvent: {
          contentOffset: { x: 0, y: -120 },
          velocity: { x: 0, y: -0.2 },
        },
      });
    await pull();
    await until(() => expect(onSnapChange).toHaveBeenCalledWith(0)); // settled, not just near 300
    expect(surfaceStyle().height).toBeCloseTo(300, 0);
    expect(onClose).not.toHaveBeenCalled();
    await pull(); // already at the lowest point: closes
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  /** A sheet in either mode with a system-keyboard field; reports the scroll view's bottom inset. */
  function KeyboardSheet({ snap }: { snap: boolean }) {
    return (
      <BottomSheet
        visible
        onClose={() => {}}
        snapPoints={snap ? [500] : undefined}
        safeAreaInsets={INSETS}
      >
        <KeyboardAwareScrollView testID="scroll">
          <FormTextInput testID="field" />
        </KeyboardAwareScrollView>
      </BottomSheet>
    );
  }
  const scrollInset = () =>
    screen.getByTestId("scroll").props.contentInset?.bottom ?? 0;
  /** Focuses the field and raises a 335pt keyboard. `fieldY` places the field in the content (the reveal measures it). */
  async function raiseKeyboard(fieldY?: number) {
    const field = {
      measureLayout: (
        _to: unknown,
        done: (x: number, y: number, w: number, h: number) => void,
      ) => {
        if (fieldY !== undefined) done(0, fieldY, 300, 48);
      },
    };
    jest
      .spyOn(TextInput.State, "currentlyFocusedInput")
      .mockReturnValue(
        field as unknown as ReturnType<
          typeof TextInput.State.currentlyFocusedInput
        >,
      );
    await fireEvent(screen.getByTestId("field"), "focus");
    await systemKeyboard(335);
  }
  afterEach(() => jest.restoreAllMocks()); // undo the currentlyFocusedInput spies

  const blurField = async () => {
    await fireEvent(screen.getByTestId("field"), "blur");
    jest
      .spyOn(TextInput.State, "currentlyFocusedInput")
      .mockReturnValue(
        null as unknown as ReturnType<
          typeof TextInput.State.currentlyFocusedInput
        >,
      );
  };
  const settle = () =>
    act(() => new Promise<void>((resolve) => setTimeout(resolve, 400)));
  const scrollTo = () =>
    (ScrollView.prototype as unknown as { scrollTo: jest.Mock }).scrollTo;
  /** A snap sheet whose 400pt scroll view holds 1000pt of content, scrolled to `y`. */
  async function scrolledSheet(y: number) {
    await render(<KeyboardSheet snap />);
    await fireEvent(screen.getByTestId("scroll"), "layout", {
      nativeEvent: { layout: { x: 0, y: 0, width: 402, height: 400 } },
    });
    await fireEvent(
      screen.getByTestId("scroll"),
      "contentSizeChange",
      402,
      1000,
    );
    await fireEvent(screen.getByTestId("scroll"), "scroll", {
      nativeEvent: { contentOffset: { x: 0, y } },
    });
  }
  const scrollEvent = (y: number) =>
    fireEvent(screen.getByTestId("scroll"), "scroll", {
      nativeEvent: { contentOffset: { x: 0, y } },
    });

  it("snap mode stays put: the keyboard covers its bottom and the content gets an inset instead", async () => {
    await render(<KeyboardSheet snap />);
    // Content reaches the sheet's bottom edge; the home indicator's part is inset, not a blank strip.
    expect(scrollInset()).toBe(INSETS.bottom);
    expect(surfaceStyle().paddingBottom).toBeUndefined();
    await raiseKeyboard();
    await until(() => expect(scrollInset()).toBe(335)); // set as the keyboard starts rising
    await act(() => new Promise<void>((resolve) => setTimeout(resolve, 400))); // transition done
    await screen.rerender(<KeyboardSheet snap />); // the test renderer reads Animated values on render
    expect(surfaceStyle().marginBottom).toBeUndefined(); // docked: never lifted
    expect(surfaceStyle().height).toBeCloseTo(500); // tall enough: not raised either
    await blurField();
    await systemKeyboard(0);
    await act(() => new Promise<void>((resolve) => setTimeout(resolve, 40))); // the host's next frame: the fall has started
    expect(scrollInset()).toBe(335); // kept while the keyboard slides away
    await until(() => expect(scrollInset()).toBe(INSETS.bottom)); // back to the home indicator once it has settled
  });

  it("snap mode: a falling keyboard brings the content back down in step with it, not after", async () => {
    await scrolledSheet(0);
    await raiseKeyboard();
    await settle();
    await scrollEvent(1000 - (400 - 335)); // scrolled to the end with the keyboard up (no drag, no reveal)
    scrollTo().mockClear();

    await blurField();
    await systemKeyboard(0);
    await until(() => expect(scrollInset()).toBe(INSETS.bottom));
    const steps = scrollTo().mock.calls.map(
      ([arg]) => arg as { y: number; animated: boolean },
    );
    expect(steps.length).toBeGreaterThan(3); // frame by frame, driven by the keyboard's own progress
    expect(steps.every((s) => s.animated === false)).toBe(true); // not UIKit's separately timed animation
    steps
      .slice(1)
      .forEach((s, i) => expect(s.y).toBeLessThanOrEqual(steps[i].y));
    expect(steps[steps.length - 1].y).toBeCloseTo(1000 - (400 - INSETS.bottom)); // lands on the new end with the keyboard
  });

  it("closing the keyboard scrolls back to where the user was before it opened", async () => {
    await scrolledSheet(100);
    await raiseKeyboard(900); // a field far down: the reveal scrolls to it
    await settle();
    const revealed = scrollTo().mock.calls.at(-1)?.[0] as { y: number };
    expect(revealed.y).toBeGreaterThan(800);
    await scrollEvent(revealed.y);
    scrollTo().mockClear();

    await blurField();
    await systemKeyboard(0);
    await until(() => expect(scrollInset()).toBe(INSETS.bottom));
    const steps = scrollTo().mock.calls.map(
      ([arg]) => arg as { y: number; animated: boolean },
    );
    expect(steps.every((s) => s.animated === false)).toBe(true); // in step with the keyboard
    expect(steps[steps.length - 1].y).toBeCloseTo(100);
  });

  it("keeps the position the user scrolled to while the keyboard was up", async () => {
    await scrolledSheet(100);
    await raiseKeyboard(900);
    await settle();
    await fireEvent(screen.getByTestId("scroll"), "scrollBeginDrag", {
      nativeEvent: {},
    });
    await scrollEvent(500);
    scrollTo().mockClear();

    await blurField();
    await systemKeyboard(0);
    await until(() => expect(scrollInset()).toBe(INSETS.bottom));
    expect(scrollTo()).not.toHaveBeenCalled(); // 500 is still within range: stays
  });

  it("a hand-off to the other keyboard is not a close: nothing is restored", async () => {
    await scrolledSheet(100);
    await raiseKeyboard(900);
    await settle();
    const revealed = scrollTo().mock.calls.at(-1)?.[0] as { y: number };
    await scrollEvent(revealed.y);
    scrollTo().mockClear();

    await systemKeyboard(0); // still focused (e.g. the pad is next)
    await settle();
    // It only comes back within the new end (past it now), not down to where it was before (100).
    const end = 1000 - (400 - INSETS.bottom);
    const ys = scrollTo().mock.calls.map(([arg]) => (arg as { y: number }).y);
    expect(ys.length).toBeGreaterThan(0);
    expect(Math.min(...ys)).toBeCloseTo(end);
  });

  /** A dynamic sheet with a 60pt header and `content` pt of content. */
  async function dynamicSheet(content: number) {
    await render(<KeyboardSheet snap={false} />);
    await fireEvent(screen.getByTestId("sheet-handle"), "layout", {
      nativeEvent: { layout: { x: 0, y: 0, width: 402, height: 60 } },
    });
    await fireEvent(
      screen.getByTestId("scroll"),
      "contentSizeChange",
      402,
      content,
    );
  }

  it("dynamic mode stays docked too: a short sheet raises only its top, just enough", async () => {
    await dynamicSheet(200);
    expect(scrollInset()).toBe(INSETS.bottom);
    expect(surfaceStyle().height).toBeCloseTo(60 + 200 + INSETS.bottom);
    await raiseKeyboard();
    await settle();
    await screen.rerender(<KeyboardSheet snap={false} />); // the test renderer reads Animated values on render
    expect(surfaceStyle().marginBottom).toBeUndefined(); // the bottom stays on the screen bottom
    expect(surfaceStyle().height).toBeCloseTo(335 + 60 + MIN_VISIBLE_SCROLL); // header + strip above the keyboard
    expect(scrollInset()).toBe(335); // the keyboard covers the rest of the scroll area
  });

  it("a short sheet holds its raise through a hand-off, and drops it once nothing is focused", async () => {
    await dynamicSheet(200);
    const raised = 335 + 60 + MIN_VISIBLE_SCROLL;
    await raiseKeyboard();
    await settle();
    await systemKeyboard(0); // the keyboard leaves while the field is still focused: a hand-off
    await settle();
    await screen.rerender(<KeyboardSheet snap={false} />); // the test renderer reads Animated values on render
    expect(surfaceStyle().height).toBeCloseTo(raised); // held: the next keyboard moves the top once

    await blurField(); // nothing follows (e.g. a hardware keyboard): the raise drops
    await settle();
    await screen.rerender(<KeyboardSheet snap={false} />);
    expect(surfaceStyle().height).toBeCloseTo(60 + 200 + INSETS.bottom);
  });

  it("a tall dynamic sheet does not move at all", async () => {
    await dynamicSheet(5000);
    expect(surfaceStyle().height).toBeCloseTo(room());
    await raiseKeyboard();
    await settle();
    await screen.rerender(<KeyboardSheet snap={false} />);
    expect(surfaceStyle().height).toBeCloseTo(room());
  });

  it("dynamic mode sizes to the content, then stops at the room", async () => {
    await render(
      <BottomSheet
        visible
        onClose={() => {}}
        title="Fit"
        safeAreaInsets={INSETS}
      >
        <KeyboardAwareScrollView testID="scroll">
          <Text>Body</Text>
        </KeyboardAwareScrollView>
      </BottomSheet>,
    );
    await fireEvent(screen.getByTestId("sheet-handle"), "layout", {
      nativeEvent: { layout: { x: 0, y: 0, width: 402, height: 60 } },
    });
    await fireEvent(
      screen.getByTestId("scroll"),
      "contentSizeChange",
      402,
      200,
    );
    expect(surfaceStyle().height).toBeCloseTo(60 + 200 + INSETS.bottom); // header + content + home indicator
    await fireEvent(
      screen.getByTestId("scroll"),
      "contentSizeChange",
      402,
      5000,
    );
    expect(surfaceStyle().height).toBeCloseTo(room()); // too tall: stops at the room, content scrolls
  });
});

describe("accessibility", () => {
  const handle = () => screen.getByTestId("sheet-handle");
  const action = (actionName: string) =>
    fireEvent(handle(), "accessibilityAction", { nativeEvent: { actionName } });
  const motion = () =>
    StyleSheet.flatten(screen.getByTestId("sheet-motion").props.style) as {
      opacity: number;
      transform: { translateY: number }[];
    };
  const reduceMotion = AccessibilityInfo.isReduceMotionEnabled as jest.Mock;
  afterEach(() => {
    jest.restoreAllMocks();
    reduceMotion.mockImplementation(() => Promise.resolve(false));
  });

  it("a multi-point sheet's handle is adjustable: expand, collapse, and close", async () => {
    const onSnapChange = jest.fn();
    const onClose = jest.fn();
    await render(
      <BottomSheet
        visible
        onClose={onClose}
        title="Pick"
        snapPoints={[300, 600]}
        onSnapChange={onSnapChange}
        safeAreaInsets={INSETS}
      >
        <Text>Body</Text>
      </BottomSheet>,
    );
    expect(handle().props.accessible).toBe(true);
    expect(handle().props.accessibilityRole).toBe("adjustable");
    expect(handle().props.accessibilityLabel).toBe("Pick");
    expect(handle().props.accessibilityValue).toEqual({
      text: "Height 1 of 2",
    });
    await action("increment"); // VoiceOver: swipe up
    await until(() => expect(onSnapChange).toHaveBeenCalledWith(1));
    expect(handle().props.accessibilityValue).toEqual({
      text: "Height 2 of 2",
    });
    await action("decrement"); // swipe down
    await until(() => expect(onSnapChange).toHaveBeenCalledWith(0));
    await action("activate"); // double-tap: no keyboard up, so the sheet closes
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("a single-point or dynamic sheet's handle is a close button", async () => {
    const onClose = jest.fn();
    await render(
      <BottomSheet
        visible
        onClose={onClose}
        title="Fit"
        safeAreaInsets={INSETS}
      >
        <Text>Body</Text>
      </BottomSheet>,
    );
    expect(handle().props.accessibilityRole).toBe("button");
    expect(handle().props.accessibilityActions).toEqual([
      { name: "activate", label: "Close" },
    ]);
    await action("activate");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("double-tap and the escape gesture close the keyboard first, then the sheet", async () => {
    const onClose = jest.fn();
    await render(
      <BottomSheet
        visible
        onClose={onClose}
        title="Esc"
        safeAreaInsets={INSETS}
      >
        <Text>Body</Text>
      </BottomSheet>,
    );
    const focused = jest
      .spyOn(TextInput.State, "currentlyFocusedInput")
      .mockReturnValue(
        {} as ReturnType<typeof TextInput.State.currentlyFocusedInput>,
      );
    const dismiss = jest.spyOn(Keyboard, "dismiss");
    await action("activate");
    await fireEvent(screen.getByTestId("sheet-surface"), "accessibilityEscape"); // two-finger Z
    expect(dismiss).toHaveBeenCalledTimes(2);
    expect(onClose).not.toHaveBeenCalled();
    focused.mockReturnValue(
      null as unknown as ReturnType<
        typeof TextInput.State.currentlyFocusedInput
      >,
    );
    await fireEvent(screen.getByTestId("sheet-surface"), "accessibilityEscape");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("moves VoiceOver focus to the title once open, and calls onAfterClose once closed", async () => {
    const send = AccessibilityInfo.sendAccessibilityEvent as jest.Mock;
    const onAfterClose = jest.fn();
    const sheet = (visible: boolean) => (
      <BottomSheet
        visible={visible}
        onClose={() => {}}
        onAfterClose={onAfterClose}
        title="Focus"
        safeAreaInsets={INSETS}
      >
        <Text>Body</Text>
      </BottomSheet>
    );
    await render(sheet(false));
    await screen.rerender(sheet(true));
    await until(() =>
      expect(send).toHaveBeenCalledWith(expect.anything(), "focus"),
    );
    expect(onAfterClose).not.toHaveBeenCalled();
    await screen.rerender(sheet(false));
    await until(() => expect(onAfterClose).toHaveBeenCalledTimes(1));
    expect(screen.queryByText("Body")).toBeNull();
  });

  it("with Reduce Motion the sheet fades in and out instead of sliding, and snap changes jump", async () => {
    // (Native-driven values don't update in Jest, so the fade is checked by the animation started.)
    reduceMotion.mockImplementation(() => Promise.resolve(true));
    const timing = jest.spyOn(Animated, "timing");
    const fades = (toValue: number) =>
      timing.mock.calls.filter(
        ([, config]) =>
          config.toValue === toValue && config.duration === SHEET_FADE.duration,
      ).length;
    const onSnapChange = jest.fn();
    const onAfterClose = jest.fn();
    const sheet = (visible: boolean) => (
      <BottomSheet
        visible={visible}
        onClose={() => {}}
        onAfterClose={onAfterClose}
        snapPoints={[300, 600]}
        onSnapChange={onSnapChange}
        safeAreaInsets={INSETS}
      >
        <Text>Body</Text>
      </BottomSheet>
    );
    await render(sheet(false));
    await act(() => Promise.resolve()); // the setting is read asynchronously
    await screen.rerender(sheet(true));
    await until(() => expect(fades(1)).toBe(1)); // fading in
    await screen.rerender(sheet(true)); // the test renderer reads Animated values on render
    expect(motion().transform[0].translateY).toBe(0); // in place from the first frame: no slide

    await action("increment");
    expect(onSnapChange).toHaveBeenCalledWith(1); // at once: no spring to wait for
    await screen.rerender(sheet(true));
    expect(
      StyleSheet.flatten(screen.getByTestId("sheet-surface").props.style)
        .height,
    ).toBeCloseTo(600);

    await screen.rerender(sheet(false));
    expect(fades(0)).toBe(1); // fading out
    expect(motion().transform[0].translateY).toBe(0); // in place
    await until(() => expect(onAfterClose).toHaveBeenCalledTimes(1));
  });
});

describe("host lifecycle", () => {
  it("schedules no work after it unmounts, even when a focused input releases on the way out", async () => {
    await render(<Form />);
    await fireEvent(screen.getByTestId("a"), "focus");
    await padUp();
    const raf = jest.spyOn(globalThis, "requestAnimationFrame");
    await act(() => screen.unmount());
    expect(raf).not.toHaveBeenCalled();
    raf.mockRestore();
  });
});

describe("parent-owned value", () => {
  it("keys apply to text the parent set itself (e.g. a reset)", async () => {
    let reset = () => {};
    function Resettable() {
      const [v, setV] = useState("");
      useEffect(() => {
        reset = () => setV("");
      }, []);
      return (
        <KeyboardHost safeAreaInsets={INSETS}>
          <NumberPadInput testID="r" value={v} onChangeText={setV} />
          <Text testID="r-value">{v}</Text>
        </KeyboardHost>
      );
    }
    await render(<Resettable />);
    await fireEvent(screen.getByTestId("r"), "focus");
    await padUp();
    await press("9");
    await press("8");
    await act(() => reset());
    await press("1");
    expect(screen.getByTestId("r-value").props.children).toBe("1");
  });
});

describe("BottomSheet", () => {
  it("renders title and content, and the backdrop requests close", async () => {
    const onClose = jest.fn();
    await render(
      <BottomSheet
        visible
        onClose={onClose}
        title="Sheet title"
        safeAreaInsets={INSETS}
      >
        <Text>Body</Text>
      </BottomSheet>,
    );
    expect(screen.getByText("Sheet title")).toBeTruthy();
    expect(screen.getByText("Body")).toBeTruthy();
    await fireEvent.press(screen.getByLabelText("Close sheet"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("opening blurs the focused field first and presents a frame later (iOS would restore it when the sheet closes)", async () => {
    const field = {} as ReturnType<
      typeof TextInput.State.currentlyFocusedInput
    >;
    const focused = jest
      .spyOn(TextInput.State, "currentlyFocusedInput")
      .mockReturnValue(field);
    const blur = jest
      .spyOn(TextInput.State, "blurTextInput")
      .mockImplementation(() => {});
    const sheet = (open: boolean) => (
      <BottomSheet
        visible={open}
        onClose={() => {}}
        title="Picker"
        safeAreaInsets={INSETS}
      >
        <Text>Body</Text>
      </BottomSheet>
    );
    await render(sheet(false));
    await screen.rerender(sheet(true));
    expect(blur).toHaveBeenCalledWith(field);
    expect(screen.queryByText("Body")).toBeNull(); // not presented while the field is still first responder
    await until(() => expect(screen.getByText("Body")).toBeTruthy());
    focused.mockRestore();
    blur.mockRestore();
  });

  it("renders nothing when not visible", async () => {
    await render(
      <BottomSheet visible={false} onClose={() => {}} title="Hidden">
        <Text>Body</Text>
      </BottomSheet>,
    );
    expect(screen.queryByText("Hidden")).toBeNull();
  });

  async function dragHandle(dy: number, ms: number, sheetHeight?: number) {
    const onClose = jest.fn();
    await render(
      <BottomSheet
        visible
        onClose={onClose}
        title="Drag"
        safeAreaInsets={INSETS}
      >
        <Text>Body</Text>
      </BottomSheet>,
    );
    if (sheetHeight) {
      await fireEvent(screen.getByTestId("sheet-surface"), "layout", {
        nativeEvent: {
          layout: { x: 0, y: 0, width: 390, height: sheetHeight },
        },
      });
    }
    const handle = screen.getByTestId("sheet-handle");
    const ev = (y: number, t: number) => ({
      nativeEvent: { pageX: 0, pageY: y, timestamp: t },
    });
    // The handle must claim on touch start: a move-based claim never fired on device.
    expect(handle.props.onStartShouldSetResponder(ev(0, 0))).toBe(true);
    await fireEvent(handle, "responderGrant", ev(0, 0));
    await fireEvent(handle, "responderMove", ev(dy / 2, ms / 2));
    await fireEvent(handle, "responderMove", ev(dy, ms));
    await fireEvent(handle, "responderRelease", ev(dy, ms));
    return onClose;
  }

  it("a short slow drag snaps back", async () =>
    expect(await dragHandle(40, 800, 500)).not.toHaveBeenCalled());
  it("a long slow drag closes", async () =>
    expect(await dragHandle(200, 2000, 500)).toHaveBeenCalledTimes(1));
  it("a short fast flick closes", async () =>
    expect(await dragHandle(60, 30, 500)).toHaveBeenCalledTimes(1));
  it("a nudge before the sheet is measured does not close", async () =>
    expect(await dragHandle(30, 600)).not.toHaveBeenCalled());

  it("pulling the content down past the top closes the sheet", async () => {
    const onClose = jest.fn();
    await render(
      <BottomSheet visible onClose={onClose} safeAreaInsets={INSETS}>
        <KeyboardAwareScrollView testID="scroll">
          <Text>Body</Text>
        </KeyboardAwareScrollView>
      </BottomSheet>,
    );
    const endDrag = (y: number, vy: number) =>
      fireEvent(screen.getByTestId("scroll"), "scrollEndDrag", {
        nativeEvent: { contentOffset: { x: 0, y }, velocity: { x: 0, y: vy } },
      });
    await endDrag(-30, -0.2);
    expect(onClose).not.toHaveBeenCalled();
    await endDrag(-120, -0.2);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
