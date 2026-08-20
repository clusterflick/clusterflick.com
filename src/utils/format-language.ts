const languageNames = new Intl.DisplayNames(["en"], { type: "language" });

/** ISO 639-1 code ("fr") → English display name ("French"). Falls back to the code itself for anything Intl doesn't recognise. */
export function formatLanguage(code: string): string {
  return languageNames.of(code) ?? code;
}
