import { createContext, useContext } from "react";

// Lets a stacked sheet tell the stack its close has started, whatever
// triggered it (ref.close(), backdrop, drag), so the stack stops treating it
// as a live sheet. why: [[Investigate_numpad-reopen-while-closing]]
export const SheetLifecycleContext = createContext<() => void>(() => {});

export const useSheetCloseStart = (): (() => void) =>
  useContext(SheetLifecycleContext);
