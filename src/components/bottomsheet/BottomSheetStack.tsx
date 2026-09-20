import { debounce } from "@/utils/debounce";
import {
  cloneElement,
  createContext,
  createRef,
  memo,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { StyleSheet, View } from "react-native";
import BottomSheet, {
  BottomSheetMethods,
  BottomSheetProps,
} from "./BottomSheet";

interface IBottomSheetOptions {
  readonly onDismiss?: () => void;
}

interface IStackedSheet {
  id: string;
  component: ReactElement<BottomSheetProps, typeof BottomSheet>;
  ref: React.RefObject<BottomSheetMethods | null>;
  readonly onDismiss?: () => void;
}

interface PushSheetResult {
  id: string;
  ref: React.RefObject<BottomSheetMethods | null>;
}

interface IBottomSheetStackContextValue {
  pushSheet: (
    sheet: Omit<IStackedSheet, "id" | "ref"> & IBottomSheetOptions,
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
  onClose: () => void;
}

// Stage 9 of documentation/bottom-sheet-recreation-guide.md. Skips the real
// component's depth-based scale/translateY visual effect for stacked
// sheets — its own SCALE_FACTOR/TRANSLATE_Y_FACTOR constants are 1/0
// (currently a no-op there too), so there's nothing working to recreate yet.
const StackedSheetWrapper = memo(function StackedSheetWrapper({
  sheet,
  isTopSheet,
  onClose,
}: StackedSheetWrapperProps) {
  // Only the top sheet should receive touches — sheets underneath are
  // still mounted (e.g. mid-close-animation, or simply stacked below) but
  // shouldn't intercept drags/taps meant for the one on top.
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
        sheet.onDismiss?.();
        onClose();
      },
    },
  );

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents={isTopSheet ? "auto" : "none"}
    >
      {element}
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

  const pushSheet = useCallback<IBottomSheetStackContextValue["pushSheet"]>(
    (sheet) => {
      const id = `sheet-${idCounter.current++}`;
      const ref = createRef<BottomSheetMethods>();

      setSheets((prev) => [
        ...prev,
        { id, ref, component: sheet.component, onDismiss: sheet.onDismiss },
      ]);

      // The sheet doesn't exist in the tree yet this tick — wait a frame so
      // its ref is actually attached before calling open() on it.
      requestAnimationFrame(() => {
        ref.current?.open();
      });

      return { id, ref };
    },
    [],
  );

  const removeSheet = useCallback((id: string) => {
    setSheets((prev) => prev.filter((s) => s.id !== id));
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

  return (
    <BottomSheetStackContext value={contextValue}>
      {children}
      {sheets.map((sheet, index) => (
        <StackedSheetWrapper
          key={sheet.id}
          sheet={sheet}
          isTopSheet={index === sheets.length - 1}
          onClose={() => removeSheet(sheet.id)}
        />
      ))}
    </BottomSheetStackContext>
  );
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
