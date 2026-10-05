import {
  cloneElement,
  createContext,
  createRef,
  memo,
  useCallback,
  useContext,
  useEffect, // TEMP T22
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { StyleSheet, View, type GestureResponderEvent } from "react-native";
import BottomSheet, {
  BottomSheetMethods,
  BottomSheetProps,
} from "./BottomSheet";
import { SheetCoverContext } from "./SheetCoverContext";
import { SheetLifecycleContext } from "./SheetLifecycleContext";
import useTapOutsideTopSheet from "./useTapOutsideTopSheet";

interface IPassThroughOptions {
  /** Return true for a tap outside the sheet that should NOT close it —
   * e.g. a tap on another field that retargets the sheet instead. */
  readonly isTapIgnored?: (e: GestureResponderEvent) => boolean;
}

interface IBottomSheetOptions {
  readonly onDismiss?: () => void;
  /** Top sheet lets touches reach the sheet below it; a tap outside
   * this sheet closes it. */
  readonly passThrough?: IPassThroughOptions;
}

interface IStackedSheet {
  id: string;
  component: ReactElement<BottomSheetProps, typeof BottomSheet>;
  ref: React.RefObject<BottomSheetMethods | null>;
  // Set when its close starts; it stays mounted until the animation ends
  closing: boolean;
  readonly onDismiss?: () => void;
  readonly passThrough?: IPassThroughOptions;
}

interface PushSheetResult {
  id: string;
  ref: React.RefObject<BottomSheetMethods | null>;
}

interface IBottomSheetStackContextValue {
  pushSheet: (
    sheet: Omit<IStackedSheet, "id" | "ref" | "closing"> & IBottomSheetOptions,
  ) => PushSheetResult;
  popSheet: (id?: string) => void;
  popToRoot: () => void;
  clearAll: () => void;
  getStackDepth: () => number;
}

const BottomSheetStackContext = createContext<
  IBottomSheetStackContextValue | undefined
>(undefined);

export const useBottomSheetStack = (): IBottomSheetStackContextValue => {
  const context = useContext(BottomSheetStackContext);
  if (!context) {
    throw new Error(
      "useBottomSheetStack must be used within BottomSheetStackProvider",
    );
  }
  return context;
};

interface StackedSheetWrapperProps {
  sheet: IStackedSheet;
  isTopSheet: boolean;
  isCoveredByPassThrough: boolean;
  onTouchStartInSheet?: () => void;
  onCloseStart: () => void;
  onClose: () => void;
}

// A pass-through top sheet's full-screen wrapper mustn't block what's below
// it, and the one sheet directly under it becomes touchable again.
function getWrapperPointerEvents(
  sheet: IStackedSheet,
  isTopSheet: boolean,
  isCoveredByPassThrough: boolean,
): "auto" | "box-none" | "none" {
  if (isTopSheet) return sheet.passThrough ? "box-none" : "auto";
  if (!isCoveredByPassThrough) return "none";
  // A covered pass-through sheet (e.g. a leftover numpad) keeps its keys but
  // its empty full-screen area mustn't swallow taps meant for the sheet below
  return sheet.passThrough ? "box-none" : "auto";
}

// The sheet a pass-through top sheet lets touches through to: the nearest one
// below it that isn't closing (a closing numpad mustn't take that role while
// a reopened one sits on top). why: [[Investigate_numpad-reopen-while-closing]]
function getCoveredIndex(sheets: IStackedSheet[]): number {
  if (!sheets[sheets.length - 1]?.passThrough) return -1;
  for (let i = sheets.length - 2; i >= 0; i--) {
    if (!sheets[i].closing) return i;
  }
  return -1;
}

// Stage 9 of documentation/bottom-sheet-recreation-guide.md. Skips the real
// component's depth-based scale/translateY visual effect for stacked
// sheets — its own SCALE_FACTOR/TRANSLATE_Y_FACTOR constants are 1/0
// (currently a no-op there too), so there's nothing working to recreate yet.
const StackedSheetWrapper = memo(function StackedSheetWrapper({
  sheet,
  isTopSheet,
  isCoveredByPassThrough,
  onTouchStartInSheet,
  onCloseStart,
  onClose,
}: StackedSheetWrapperProps) {
  // Only the top sheet should receive touches — sheets underneath are
  // still mounted (e.g. mid-close-animation, or simply stacked below) but
  // shouldn't intercept drags/taps meant for the one on top.
  // …except the sheet directly under a pass-through top sheet.
  // sheet.ref comes from createRef (not a hook), so it's assigned directly
  // here instead of via useImperativeHandle inside this component.
  const mergedRef = (node: BottomSheetMethods | null) => {
    sheet.ref.current = node;
  };

  const element = cloneElement(
    sheet.component as ReactElement<
      BottomSheetProps & { ref?: React.Ref<BottomSheetMethods> }
    >,
    {
      ref: mergedRef,
      onClose: () => {
        console.log(`[T22] ${performance.now().toFixed(1)} ${sheet.id} closed → onDismiss + remove`); // TEMP T22
        sheet.onDismiss?.();
        onClose();
      },
    },
  );

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents={getWrapperPointerEvents(
        sheet,
        isTopSheet,
        isCoveredByPassThrough,
      )}
      onTouchStart={() => {
        // TEMP T1 — does a touch start inside the sheet bubble up through its wrapper?
        console.log(`[T1] ${performance.now().toFixed(1)} wrapper ${sheet.id} touchStart`);
        onTouchStartInSheet?.();
      }}
    >
      <SheetLifecycleContext value={onCloseStart}>
        <SheetCoverContext value={isCoveredByPassThrough}>
          {element}
        </SheetCoverContext>
      </SheetLifecycleContext>
    </View>
  );
});

interface BottomSheetStackProviderProps {
  children: ReactNode;
}

export function BottomSheetStackProvider({
  children,
}: BottomSheetStackProviderProps) {
  const [sheets, setSheets] = useState<IStackedSheet[]>([]);
  const idCounter = useRef(0);
  // Committed stack, readable from the open() frame below without a setSheets
  // updater (side effects there can run during render)
  const sheetsRef = useRef(sheets);
  useLayoutEffect(() => {
    sheetsRef.current = sheets;
  }, [sheets]);

  const pushSheet = useCallback<IBottomSheetStackContextValue["pushSheet"]>(
    (sheet) => {
      const id = `sheet-${idCounter.current++}`;
      const ref = createRef<BottomSheetMethods>();

      setSheets((prev) => [
        ...prev,
        {
          id,
          ref,
          component: sheet.component,
          closing: false,
          onDismiss: sheet.onDismiss,
          passThrough: sheet.passThrough,
        },
      ]);

      // The sheet doesn't exist in the tree yet this tick — wait a frame so
      // its ref is actually attached before calling open() on it.
      requestAnimationFrame(() => {
        ref.current?.open();
        if (!sheet.passThrough) return;
        // Only one live pass-through sheet: a newer one retires any below it,
        // so none is left stranded. why: [[Investigate_numpad-focus-switching]]
        const stack = sheetsRef.current;
        const index = stack.findIndex((s) => s.id === id);
        if (index < 0) return;
        stack
          .slice(0, index)
          .filter((s) => s.passThrough && !s.closing)
          .forEach((s) => s.ref.current?.close());
      });

      return { id, ref };
    },
    [],
  );

  const removeSheet = useCallback((id: string) => {
    setSheets((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const markClosing = useCallback((id: string) => {
    setSheets((prev) =>
      prev.map((s) => (s.id === id ? { ...s, closing: true } : s)),
    );
  }, []);

  const popSheet = useCallback<IBottomSheetStackContextValue["popSheet"]>(
    (id) => {
      setSheets((prev) => {
        if (!prev.length) return prev;

        if (id) {
          prev.find((s) => s.id === id)?.ref.current?.close();
        } else {
          prev[prev.length - 1]?.ref.current?.close();
        }

        return prev; // removal happens via onClose, after the close animation finishes
      });
    },
    [],
  );

  const popToRoot = useCallback<
    IBottomSheetStackContextValue["popToRoot"]
  >(() => {
    setSheets((prev) => {
      prev.forEach((s) => s.ref.current?.close());
      return prev;
    });
  }, []);

  const clearAll = useCallback(() => {
    setSheets([]);
  }, []);

  const getStackDepth = useCallback(() => sheets.length, [sheets]);

  const contextValue = useMemo(
    () => ({ pushSheet, popSheet, popToRoot, clearAll, getStackDepth }),
    [pushSheet, popSheet, popToRoot, clearAll, getStackDepth],
  );

  // Only a pass-through top sheet closes on an outside tap — every other
  // sheet is closed by its own backdrop, as before.
  const {
    onStartShouldSetResponderCapture,
    onTouchEndCapture,
    markTouchInTopSheet,
  } = useTapOutsideTopSheet({
    onTapOutside: (e) => {
      // A closing sheet is already on its way out — a second close() on it
      // re-ran its dismiss. why: [[Investigate_numpad-focus-switching]]
      const topSheet = sheets.findLast((s) => !s.closing);
      if (!topSheet?.passThrough) return;
      if (topSheet.passThrough.isTapIgnored?.(e)) {
        console.log(`[T22] ${performance.now().toFixed(1)} tapOutside ignored ${topSheet.id}`); // TEMP T22
        return;
      }
      console.log(`[T22] ${performance.now().toFixed(1)} tapOutside close ${topSheet.id}`); // TEMP T22
      // Not popSheet(): it calls close() inside a setSheets updater, which can
      // run during render — close() then sets the caller's state mid-render
      topSheet.ref.current?.close();
    },
  });

  // TEMP T22 — stack contents and which sheet is "covered" after each change
  useEffect(() => {
    console.log(
      `[T22] ${performance.now().toFixed(1)} stack [${sheets.map((s) => s.id).join(", ")}]`,
      "closing:", sheets.filter((s) => s.closing).map((s) => s.id).join(", ") || "-",
      "covered:", sheets[getCoveredIndex(sheets)]?.id ?? "-",
    );
  }, [sheets]);

  const coveredIndex = getCoveredIndex(sheets);

  // TEMP T1 — root touch order: capture phase sees every touch first
  const logRootTouch = (phase: string) => (e: GestureResponderEvent) =>
    console.log(
      `[T1] ${performance.now().toFixed(1)} root ${phase}`,
      "target:", e.nativeEvent.target,
      "page:", Math.round(e.nativeEvent.pageX), Math.round(e.nativeEvent.pageY),
    );

  return (
    <BottomSheetStackContext value={contextValue}>
      {/* Root for tap-outside detection: its capture handlers see every touch
          before any child does (useTapOutsideTopSheet) */}
      <View
        style={{ flex: 1 }}
        onStartShouldSetResponderCapture={(e) => {
          logRootTouch("startCapture")(e); // TEMP T1
          return onStartShouldSetResponderCapture(e);
        }}
        onTouchEndCapture={(e) => {
          logRootTouch("endCapture")(e); // TEMP T1
          onTouchEndCapture(e);
        }}
        onTouchCancel={logRootTouch("cancel")} // TEMP T1
      >
        {children}
        {sheets.map((sheet, index) => (
          <StackedSheetWrapper
            key={sheet.id}
            sheet={sheet}
            isTopSheet={index === sheets.length - 1}
            isCoveredByPassThrough={index === coveredIndex}
            onTouchStartInSheet={
              index === sheets.length - 1 ? markTouchInTopSheet : undefined
            }
            onCloseStart={() => markClosing(sheet.id)}
            onClose={() => removeSheet(sheet.id)}
          />
        ))}
      </View>
    </BottomSheetStackContext>
  );
}

// Fires immediately on the first call, then ignores repeat calls until
// `wait` ms have passed — swallows a rapid double-tap on whatever triggers
// present() without delaying the first response. A pragmatic guard, not a
// fix at the source (see "Debounced present()" in
// documentation/bottom-sheet-recreation-guide.md for the tradeoff).
function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>): void => {
    if (timer !== null) return;
    fn(...args);
    timer = setTimeout(() => {
      timer = null;
    }, wait);
  };
}

// Final public API: present()/dismiss() instead of pushSheet/popSheet
// directly — hides the id/ref bookkeeping a caller doesn't need.
export const useBottomSheet = <
  T extends IBottomSheetOptions = IBottomSheetOptions,
>(
  options?: T,
) => {
  const { pushSheet, popSheet } = useBottomSheetStack();
  const activeId = useRef<string | null>(null);
  const lastRef = useRef<React.RefObject<BottomSheetMethods | null> | null>(
    null,
  );

  const presentImpl = useMemo(
    () =>
      // Debounced so a rapid double-tap on the trigger only ever pushes one sheet.
      debounce(
        (component: ReactElement<BottomSheetProps, typeof BottomSheet>) => {
          const { id, ref } = pushSheet({
            component,
            onDismiss: options?.onDismiss,
          });
          activeId.current = id;
          lastRef.current = ref;
        },
        500,
      ),
    [pushSheet, options?.onDismiss],
  );

  const present = useCallback(
    (component: ReactElement<BottomSheetProps, typeof BottomSheet>) => {
      // Returns synchronously, but pushSheet is debounced — a call within the
      // debounce window returns the ref from the *previous* present(), not this one.
      presentImpl(component);
      return lastRef.current;
    },
    [presentImpl],
  );

  const dismiss = useCallback(() => {
    if (activeId.current) {
      popSheet(activeId.current);
      activeId.current = null;
    }
  }, [popSheet]);

  return { present, dismiss };
};
