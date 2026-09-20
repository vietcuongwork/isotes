export function mergeRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  return (node: T | null) => {
    refs.forEach((ref) => {
      if (!ref) return;
      if (typeof ref === "function") ref(node);
      else (ref as React.RefObject<T | null>).current = node;
    });
  };
}

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const getInitial = (s: string) => capitalize(s).charAt(0);
