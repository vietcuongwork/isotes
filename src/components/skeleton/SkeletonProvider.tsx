import { createContext, ReactNode, useContext } from "react";
import { SharedValue, useSharedValue } from "react-native-reanimated";

interface SkeletonProviderProps {
  children: ReactNode;
}

const SkeletonContext = createContext<SharedValue<number> | null>(null);

// One value for the whole loading block, so every bone pulses in step.
// The pulse itself starts in a later task.
export default function SkeletonProvider(props: SkeletonProviderProps) {
  const { children } = props;
  const opacity = useSharedValue(1);

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
