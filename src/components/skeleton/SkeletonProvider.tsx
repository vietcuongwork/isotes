import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  cancelAnimation,
  SharedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

interface SkeletonProviderProps {
  children: ReactNode;
}

// Pulse values: DESIGN.md components.skeleton. Reduce Motion stays on
// Reanimated's default.
const PULSE_MIN_OPACITY = 0.45;
const PULSE_MS = 1000;

const SkeletonContext = createContext<SharedValue<number> | null>(null);

// One value for the whole loading block, so every bone pulses in step.
export default function SkeletonProvider(props: SkeletonProviderProps) {
  const { children } = props;
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(PULSE_MIN_OPACITY, { duration: PULSE_MS }),
      -1,
      true,
    );
    return () => cancelAnimation(opacity);
  }, [opacity]);

  return (
    <SkeletonContext.Provider value={opacity}>
      {children}
    </SkeletonContext.Provider>
  );
}

export function useSkeletonOpacity(): SharedValue<number> {
  const opacity = useContext(SkeletonContext);
  if (!opacity) throw new Error("SkeletonBone needs a SkeletonProvider");

  return opacity;
}
