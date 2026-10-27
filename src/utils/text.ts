// NFD splits "É" into "E" plus a combining accent (U+0300 to U+036F), which is dropped.
// "ł" and "đ" are strokes, not accents, so NFD leaves them and they are mapped by hand
export function foldForSearch(text: string): string {
  return text
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/gi, "l")
    .replace(/đ/gi, "d")
    .toLowerCase();
}
