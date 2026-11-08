const languageNames = new Intl.DisplayNames(["en"], { type: "language" });

/**
 * Codes TheMovieDB uses that aren't ISO 639-1: "cn" for Cantonese (Chinese in
 * Mandarin is "zh"), and "xx" for a film with no spoken language.
 */
const TMDB_LANGUAGES: Record<string, string> = {
  cn: "Cantonese",
  xx: "No language",
};

/** ISO 639-1 code ("fr") → English display name ("French"). Falls back to the code itself for anything Intl doesn't recognise. */
export function formatLanguage(code: string): string {
  return TMDB_LANGUAGES[code] ?? languageNames.of(code) ?? code;
}
