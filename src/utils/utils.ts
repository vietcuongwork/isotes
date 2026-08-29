export function mergeRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  return (node: T) => {
    refs.forEach((ref) => {
      if (!ref) return;
      if (typeof ref === "function") ref(node);
      else (ref as React.RefObject<T>).current = node;
    });
  };
}
