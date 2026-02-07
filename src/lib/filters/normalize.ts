/**
 * Normalize a string for fuzzy matching:
 * - Convert to lowercase
 * - Remove diacritics (é → e, ñ → n, etc.)
 * - Remove common punctuation (apostrophes, colons, periods, etc.)
 */
export const normalizeForSearch = (str: string): string => {
  return (
    str
      .toLowerCase()
      // Remove diacritics: normalize to NFD (decomposed form), then strip combining marks
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      // Remove common punctuation that might differ between query and title
      .replace(/[''`´]/g, "") // apostrophes and similar
      .replace(/[.:;,!?]/g, "") // common punctuation
      .replace(/[-–—]/g, " ") // dashes to spaces
      .replace(/\s+/g, " ") // collapse multiple spaces
      .trim()
  );
};
