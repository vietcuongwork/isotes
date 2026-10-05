import { createContext, useContext } from "react";

// True for the one sheet directly under a pass-through top sheet: it can be
// touched again, but its backdrop mustn't close it — only the top sheet closes.
export const SheetCoverContext = createContext<boolean>(false);

export const useIsCoveredByPassThrough = (): boolean =>
  useContext(SheetCoverContext);
