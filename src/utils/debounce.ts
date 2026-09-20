// Fires immediately on the first call, then ignores repeat calls until
// `wait` ms have passed — swallows a rapid double-tap on whatever triggers
// present() without delaying the first response. A pragmatic guard, not a
// fix at the source (see "Debounced present()" in
// documentation/bottom-sheet-recreation-guide.md for the tradeoff).
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
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
