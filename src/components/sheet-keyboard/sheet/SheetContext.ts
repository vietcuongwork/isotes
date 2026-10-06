import { createContext, useContext } from "react";

/** What a BottomSheet offers to the scroll view inside it. */
export interface SheetApi {
  /** The content was pulled down past its top: go one snap point down, or close. */
  pullDown: () => void;
  /** Visible scroll-area change for a keyboard transition from -> to (see sheetMath.viewportDelta). */
  viewportDelta: (from: number, to: number) => number;
  /** How much of the scroll viewport a keyboard of height `inset` covers (snap mode; 0 when the sheet rides on it). */
  coveredAt: (inset: number) => number;
  /** The scroll content's height (dynamic mode sizes the sheet from it). */
  reportContentHeight: (height: number) => void;
}

export const SheetContext = createContext<SheetApi | null>(null);

export function useSheet(): SheetApi | null {
  return useContext(SheetContext);
}
