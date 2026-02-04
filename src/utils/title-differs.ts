/**
 * Normalize a title for comparison by removing noise that shouldn't
 * count as a "significant difference":
 * - Lowercase
 * - Remove diacritics (é → e)
 * - Remove all punctuation and whitespace
 * - Remove common articles (the, a, an)
 * - Remove year suffixes like (1984) or [1984]
 */
const normalizeTitle = (title: string): string => {
  return (
    title
      .toLowerCase()
      // Remove diacritics
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      // Remove year patterns like (1984), [1984], 1984 at the end
      .replace(/[\[(]?\d{4}[\])]?\s*$/g, "")
      // Remove all non-alphanumeric characters
      .replace(/[^a-z0-9]/g, "")
  );
};

/**
 * Check if two titles are significantly different.
 *
 * Returns true if the titles differ enough that showing the original
 * venue title would be useful to the user.
 *
 * Examples:
 * - "Film club - showing shorts" vs "Film club: showing shorts" → NOT different (same normalized)
 * - "Bar Trash: SAVAGE STREETS (1984)" vs "Savage Streets" → DIFFERENT
 * - "Film Club Presents: Movie Name" vs "Movie Name" → DIFFERENT
 */
export const titlesDiffer = (
  movieTitle: string,
  showingTitle: string | undefined,
): boolean => {
  // If no showing title, they don't differ
  if (!showingTitle) {
    return false;
  }

  const normalizedMovie = normalizeTitle(movieTitle);
  const normalizedShowing = normalizeTitle(showingTitle);

  // If either is empty after normalization, consider them the same
  if (!normalizedMovie || !normalizedShowing) {
    return false;
  }

  // They're different if the normalized versions don't match exactly
  return normalizedMovie !== normalizedShowing;
};
