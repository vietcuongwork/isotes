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

// Keeps letters from any script + combining diacritics (\p{M} — needed for
// decomposed accents, e.g. some Vietnamese input), digits, spaces,
// apostrophes, and hyphens, plus symbols seen in real names: period/comma
// ("Jr.", "Smith, John"), ampersand ("Mom & Dad"), and parentheses
// ("Robert (Bob)"). Drops emoji and other symbols.
const NON_NAME_CHAR_PATTERN = /[^\p{L}\p{M}\p{N}\s'&.,()-]/gu;

export const sanitizeNameInput = (s: string) => s.replace(NON_NAME_CHAR_PATTERN, "");
