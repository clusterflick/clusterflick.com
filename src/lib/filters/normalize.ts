/**
 * Search is asymmetric, and deliberately so.
 *
 * `normalizeForSearch` handles the query and only ever rewrites a single
 * character into a fixed string, so normalizing a prefix of a query always
 * yields a prefix of the normalized query. Search runs on every keystroke, and
 * any rule whose trigger can be created or destroyed by typing one more
 * character makes results vanish and reappear mid-word — "ii" → "2" would drop
 * "A Chinese Ghost Story II" while "…Story I" is on screen.
 *
 * The cleverer rewrites therefore live in `getSearchVariants`, which expands a
 * title into every spelling it could reasonably be searched by. Because the
 * untouched form is always one of the variants, an expansion can only ever add
 * matches — it can never lose one.
 */

import { numbersToWords, wordsToNumbers } from "./number-words";

/** Longer form of a symbol → the token it reads as. Single characters only. */
const CHARACTER_EQUIVALENTS: [RegExp, string][] = [
  [/&/g, " and "], // "Pomp & Circumstance" → "Pomp and Circumstance"
  [/\+/g, " and "], // "Halloween + Halloween II"
  [/½/g, " 1/2"], // "8½" → "8 1/2"
  [/¼/g, " 1/4"],
  [/¾/g, " 3/4"],
];

/**
 * Normalize a string for fuzzy matching:
 * - Convert to lowercase
 * - Remove diacritics (é → e, ñ → n, etc.)
 * - Treat "&" and "+" as "and", and expand fractions
 * - Remove all punctuation and spacing
 *
 * Non-Latin scripts are preserved — only punctuation is stripped, so titles
 * like "Сталкер" remain searchable.
 */
const foldForSearch = (str: string): string => {
  let result = str
    .toLowerCase()
    // Remove diacritics: normalize to NFD (decomposed form), then strip combining marks
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

  for (const [pattern, replacement] of CHARACTER_EQUIVALENTS) {
    result = result.replace(pattern, replacement);
  }

  return result;
};

export const normalizeForSearch = (str: string): string =>
  // Everything that isn't a letter or a number goes, including spaces
  foldForSearch(str).replace(/[^\p{L}\p{N}]/gu, "");

/**
 * The same folding as {@link normalizeForSearch}, but split into words instead
 * of run together — `normalizeToWords(s).join("") === normalizeForSearch(s)`.
 *
 * Substring search wants the run-on form: it must not care where the spaces
 * fell. Fuzzy matching wants the opposite, because a mistyping never straddles
 * a word boundary — without the split, "ornage" matches "short**s for age**s"
 * one edit away, and the real answer never gets a look in.
 */
export const normalizeToWords = (str: string): string[] =>
  foldForSearch(str)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

/** Roman numerals, so "The Godfather Part II" is found by "godfather part 2". */
const ROMAN_NUMERALS: Record<string, string> = {
  ii: "2",
  iii: "3",
  iv: "4",
  vi: "6",
  vii: "7",
  viii: "8",
  ix: "9",
  xi: "11",
  xii: "12",
  xiii: "13",
};

/**
 * Single-letter numerals are only converted when they follow a sequence word,
 * otherwise the film "X" becomes "10" and "I Saw the TV Glow" becomes "1 Saw…".
 */
const SEQUENCE_WORDS = "part|chapter|volume|vol|episode|act|book|series";
const SEQUENCE_NUMERALS: Record<string, string> = { i: "1", v: "5", x: "10" };

/** Abbreviated form ↔ written-out form. Expanded in both directions. */
const ABBREVIATIONS: [short: string, long: string][] = [
  ["dr", "doctor"],
  ["mr", "mister"],
  ["mrs", "missus"],
  ["st", "saint"],
  ["vs", "versus"],
  ["n", "and"], // "Doc'n Roll", "Rock 'n' Roll"
];

const applyNumerals = (str: string): string =>
  str
    .replace(
      new RegExp(`\\b(${SEQUENCE_WORDS})\\.?\\s+([ivx])\\b`, "g"),
      (_, word, numeral) => `${word} ${SEQUENCE_NUMERALS[numeral]}`,
    )
    .replace(
      /\b(ii|iii|iv|vi|vii|viii|ix|xi|xii|xiii)\b/g,
      (numeral) => ROMAN_NUMERALS[numeral],
    );

const applyAbbreviations = (str: string, expand: boolean): string => {
  let result = str;
  for (const [short, long] of ABBREVIATIONS) {
    const [from, to] = expand ? [short, long] : [long, short];
    result = result.replace(new RegExp(`\\b${from}\\b\\.?`, "g"), to);
  }
  return result;
};

// Titles are re-normalized on every keystroke, so memoize the expansion.
const variantCache = new Map<string, string[]>();

/**
 * Every normalized spelling a string could reasonably be searched by, always
 * including its plain normalized form. Use for the text being searched; use
 * `normalizeForSearch` for the query itself.
 */
export const getSearchVariants = (str: string): string[] => {
  const cached = variantCache.get(str);
  if (cached) return cached;

  const base = str.toLowerCase();
  const spellings = [
    base,
    applyAbbreviations(base, true),
    applyAbbreviations(base, false),
  ];

  const variants = [
    ...new Set(
      spellings
        .flatMap((spelling) => [spelling, applyNumerals(spelling)])
        // Each rule keeps the spelling it was given alongside its rewrites, so
        // the untouched form is always present and a rule can only add matches
        .flatMap((spelling) => [
          spelling,
          // "101 Dalmatians" ↔ "One Hundred and One Dalmatians"
          ...numbersToWords(spelling),
          wordsToNumbers(spelling),
        ])
        .map(normalizeForSearch)
        .filter(Boolean),
    ),
  ];

  variantCache.set(str, variants);
  return variants;
};

/**
 * Whether `haystack` matches an already-normalized query, allowing for
 * alternative spellings of the haystack (roman numerals, abbreviations).
 */
export const matchesSearchQuery = (
  haystack: string,
  normalizedQuery: string,
): boolean =>
  getSearchVariants(haystack).some((variant) =>
    variant.includes(normalizedQuery),
  );
