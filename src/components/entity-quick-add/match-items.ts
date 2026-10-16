import { normalizeForSearch, normalizeToWords } from "@/lib/filters/normalize";
import {
  bestWordRunDistance,
  editBudgetFor,
  MIN_FUZZY_LENGTH,
} from "@/lib/filters/word-distance";

/** The fields matching reads; `EntityQuickAddItem` satisfies it. */
export interface MatchableItem {
  name: string;
  count?: number;
}

/**
 * Names normalized for the substring pass, built the first time a list is
 * searched and kept for as long as that list lives.
 *
 * Normalized rather than merely lowercased so punctuation and spacing can't
 * stop a match: "Kings Cr" never matched "King's Cross St. Pancras" as typed,
 * and only reached it at the lengths where the fuzzy pass happened to.
 */
const nameCache = new WeakMap<MatchableItem[], string[]>();

/**
 * Names pre-split into words, built the first time a list needs a fuzzy pass
 * and kept for as long as that list lives.
 *
 * Lazy and cached rather than memoised alongside the list: splitting 11,000
 * names costs about as much as the scan itself, and most sessions never mistype
 * anything, so it should not be paid on mount.
 */
const wordCache = new WeakMap<MatchableItem[], string[][]>();

function fuzzyMatches<T extends MatchableItem>(
  items: T[],
  needle: string,
  limit: number,
): T[] {
  if (needle.length < MIN_FUZZY_LENGTH) return [];

  let words = wordCache.get(items);
  if (!words) {
    words = items.map((item) => normalizeToWords(item.name));
    wordCache.set(items, words);
  }

  const budget = editBudgetFor(needle);
  const scored: { item: T; distance: number }[] = [];
  for (let index = 0; index < items.length; index += 1) {
    const distance = bestWordRunDistance(needle, words[index], budget);
    if (distance <= budget) scored.push({ item: items[index], distance });
  }

  return scored
    .sort(
      (a, b) =>
        a.distance - b.distance || (b.item.count ?? 0) - (a.item.count ?? 0),
    )
    .slice(0, limit)
    .map(({ item }) => item);
}

/**
 * The items a query names, at most `limit`: a substring match ignoring case,
 * accents, punctuation and spacing, in list order; failing that, the closest
 * near-misses, closest first.
 */
export function matchItems<T extends MatchableItem>(
  items: T[],
  query: string,
  limit: number,
): T[] {
  const needle = normalizeForSearch(query);
  if (!needle) return [];

  let names = nameCache.get(items);
  if (!names) {
    names = items.map((item) => normalizeForSearch(item.name));
    nameCache.set(items, names);
  }

  // `items` arrives best-represented first, so stopping early keeps the
  // most-screened matches and avoids walking 11,000 cast names.
  const matches: T[] = [];
  for (let index = 0; index < items.length; index += 1) {
    if (!names[index].includes(needle)) continue;
    matches.push(items[index]);
    if (matches.length >= limit) break;
  }
  if (matches.length > 0) return matches;

  // Nothing matched as typed, so read it as a misspelling — "Mark Hammill"
  // is one letter from a real name and currently answers with an empty menu.
  // A menu is a list of candidates, so unlike the suggestion engine there is
  // nothing here to disambiguate: show the closest, closest first.
  return fuzzyMatches(items, needle, limit);
}
