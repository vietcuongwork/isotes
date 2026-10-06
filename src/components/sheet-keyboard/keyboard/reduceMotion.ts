import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/**
 * The iOS "Reduce Motion" setting, kept current while the app runs. With it on,
 * the sheet's own large movements become a fade or a jump (open and close, snap
 * changes). Motion that follows the keyboard (the number pad, a short sheet's
 * raise, the scroll) is unchanged: iOS keeps animating its own keyboard, and
 * both keyboards should behave the same.
 */
export function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (alive) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );
    return () => {
      alive = false;
      subscription.remove();
    };
  }, []);
  return reduceMotion;
}
