import { AccessibilityFeature, Category, Genre } from "@/types";
import { ACCESSIBILITY_LABELS } from "@/utils/accessibility-labels";
import { FilterId, FilterState } from "./types";
import { filtersAtDefault, get, set } from "./manager";
import {
  FORMAT_GROUPS,
  PEOPLE_GROUPS,
  PROGRAMME_GROUPS,
  PeopleFilterId,
  PersonOption,
  getProgrammeName,
} from "./modules";
import { normalizeToWords } from "./normalize";
import {
  ACCESSIBILITY_ALIASES,
  CATEGORY_ALIASES,
  GENRE_ALIASES,
  foldSuffix,
} from "./value-aliases";

/**
 * Filters the overlay's search menu can select, each holding a list of ids or
 * values. Every one of them stores `string[] | null`.
 */
type ListFilterId =
  | FilterId.Categories
  | FilterId.Genres
  | FilterId.FormatSource
  | FilterId.FormatPresentation
  | FilterId.FormatDimension
  | FilterId.Accessibility
  | FilterId.Directors
  | FilterId.Cast
  | FilterId.FilmClubs
  | FilterId.Festivals
  | FilterId.Venues;

/** One filter value the search menu can offer. */
export type FilterSearchEntry = {
  /** Unique across every group: `<filterId>:<value>`. */
  key: string;
  filterId: ListFilterId;
  /** The value as the filter stores it. */
  value: string;
  name: string;
  /** What kind of thing this is, shown beside the name: "Director", "Genre". */
  kind: string;
  /** Other words that name it ("subs" for Subtitles). */
  aliases?: string[];
  /** Films it accounts for, where that is known without probing. */
  count?: number;
};

/** What the overlay already holds that names filter values. */
export type FilterSearchSources = {
  categories: { value: Category; label: string }[];
  genres: Record<string, Genre> | null;
  /** From `getPeopleVocabulary`, best-represented first. */
  people: Record<PeopleFilterId, PersonOption[]> | null;
  /** Every venue with showings. */
  venues: { id: string; name: string; count?: number }[];
};

/**
 * Every value the search menu can offer, in groups, in the order the menu
 * lists them.
 *
 * The enumerated filters come first. Their vocabularies are a few dozen
 * values, so a query reaching one of them ("horror", "70mm", "subs") almost
 * certainly meant it; a query reaching one of 11,000 cast names often didn't.
 * Directors precede cast for the same reason the suggestion engine trusts
 * them more: unique among 1,300 is a stronger claim than among 11,000.
 *
 * Venues are included, unlike in the suggestion engine. There a venue name
 * matching a film title ("Rio") would be read as the answer; here it is one
 * candidate among several, and the reader picks.
 *
 * Films are left out: typing in the box already searches titles, and a film
 * row would offer the same thing a second way.
 */
export function buildFilterSearchGroups(
  sources: FilterSearchSources,
): FilterSearchEntry[][] {
  const groups: FilterSearchEntry[][] = [];

  groups.push(
    sources.categories.map(({ value, label }) => ({
      key: `${FilterId.Categories}:${value}`,
      filterId: FilterId.Categories,
      value,
      name: label,
      kind: "Event type",
      aliases: CATEGORY_ALIASES[value],
    })),
  );

  if (sources.genres) {
    groups.push(
      Object.entries(sources.genres)
        .map(([id, genre]) => ({
          key: `${FilterId.Genres}:${id}`,
          filterId: FilterId.Genres as const,
          value: id,
          name: genre.name,
          kind: "Genre",
          aliases: GENRE_ALIASES[genre.name.toLowerCase()],
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    );
  }

  // A format's default (Digital, Normal, 2D) is what nearly everything is, so
  // offering it is never what a query was reaching for.
  groups.push(
    FORMAT_GROUPS.flatMap((group) =>
      group.options
        .filter((option) => option.value !== group.defaultValue)
        .map((option) => ({
          key: `${group.filterId}:${option.value}`,
          filterId: group.filterId,
          value: option.value,
          name: option.label,
          kind: "Format",
        })),
    ),
  );

  groups.push(
    Object.values(AccessibilityFeature).map((feature) => ({
      key: `${FilterId.Accessibility}:${feature}`,
      filterId: FilterId.Accessibility,
      value: feature,
      name: ACCESSIBILITY_LABELS[feature],
      kind: "Accessibility",
      aliases: ACCESSIBILITY_ALIASES[feature],
    })),
  );

  if (sources.people) {
    for (const group of PEOPLE_GROUPS) {
      groups.push(
        (sources.people[group.filterId] ?? []).map((person) => ({
          key: `${group.filterId}:${person.id}`,
          filterId: group.filterId,
          value: person.id,
          name: person.name,
          kind: group.filterId === FilterId.Directors ? "Director" : "Cast",
          count: person.count,
        })),
      );
    }
  }

  for (const group of PROGRAMME_GROUPS) {
    groups.push(
      group.programmes.map((programme) => ({
        key: `${group.filterId}:${programme.id}`,
        filterId: group.filterId,
        value: programme.id,
        name: getProgrammeName(programme),
        kind: group.filterId === FilterId.FilmClubs ? "Film club" : "Festival",
        aliases: programme.aliases,
      })),
    );
  }

  groups.push(
    sources.venues.map((venue) => ({
      key: `${FilterId.Venues}:${venue.id}`,
      filterId: FilterId.Venues,
      value: venue.id,
      name: venue.name,
      kind: "Venue",
      count: venue.count,
    })),
  );

  return groups;
}

/** Shortest query the menu answers: one letter matches half of everything. */
export const MIN_FILTER_SEARCH_LENGTH = 2;

type EntryWords = { raw: string[][]; folded: string[][] };

/**
 * Names and aliases split into words, raw and with endings folded, built the
 * first time an entry is compared and kept for as long as the entry lives.
 * Lazy, so opening the overlay doesn't pay for splitting 13,000 names nobody
 * searches; folded up front, because folding inside the comparison loop was
 * most of a 35ms keystroke.
 */
const wordCache = new WeakMap<FilterSearchEntry, EntryWords>();

function getWords(entry: FilterSearchEntry): EntryWords {
  let words = wordCache.get(entry);
  if (!words) {
    const raw = [entry.name, ...(entry.aliases ?? [])].map(normalizeToWords);
    words = { raw, folded: raw.map((name) => name.map(foldSuffix)) };
    wordCache.set(entry, words);
  }
  return words;
}

/** How well a query names an entry. Lower is better. */
enum MatchTier {
  /** Every word typed matches a whole word: "rio" is Rio Cinema. */
  Whole = 0,
  /** The last word is still being typed: "rio" in Louise Rioton. */
  Prefix = 1,
}

type Query = {
  raw: string[];
  folded: string[];
  /**
   * The last word ends in an inflection ("subtitled", "dramas"), so it reads
   * as finished and is compared folded. Otherwise it is still being typed and
   * only matches a word exactly or as its start — folding it would make "mar"
   * a whole match for Kenneth Mars.
   */
  lastIsInflected: boolean;
};

/**
 * How the query's words appear as a run of the name's words, if they do:
 * "alfred hitch" finds Alfred Hitchcock, "cock" doesn't. Finished words
 * compare with their endings folded, so "subtitled" finds Subtitles.
 */
function matchWords(
  query: Query,
  raw: string[],
  folded: string[],
): MatchTier | null {
  const last = query.raw.length - 1;
  let best: MatchTier | null = null;
  for (let start = 0; start + query.raw.length <= raw.length; start += 1) {
    let tier: MatchTier | null = MatchTier.Whole;
    for (let offset = 0; offset <= last && tier !== null; offset += 1) {
      const at = start + offset;
      if (offset < last || query.lastIsInflected) {
        if (query.folded[offset] === folded[at]) continue;
      } else if (query.raw[offset] === raw[at]) {
        continue;
      }
      tier =
        offset === last && raw[at].startsWith(query.raw[offset])
          ? MatchTier.Prefix
          : null;
    }
    if (tier === MatchTier.Whole) return tier;
    if (tier !== null) best = tier;
  }
  return best;
}

function matchEntry(query: Query, entry: FilterSearchEntry): MatchTier | null {
  const { raw, folded } = getWords(entry);
  let best: MatchTier | null = null;
  for (let index = 0; index < raw.length; index += 1) {
    const tier = matchWords(query, raw[index], folded[index]);
    if (tier === MatchTier.Whole) return tier;
    if (tier !== null) best = tier;
  }
  return best;
}

type IndexedWord = { word: string; entry: FilterSearchEntry };

type SearchIndex = {
  /** Every word of every name and alias, sorted, for a prefix lookup. */
  raw: IndexedWord[];
  /** The same words folded, sorted, for an exact lookup of a finished word. */
  folded: IndexedWord[];
  /** Where each entry sits: its group, then its place in the group. */
  position: Map<FilterSearchEntry, { group: number; order: number }>;
};

/**
 * Built the first time the groups are searched and kept while they live.
 * Scanning every entry instead cost ~12ms a keystroke over 13,000 names
 * whatever was typed; the index answers from the few hundred names holding a
 * word that starts with it.
 */
const indexCache = new WeakMap<FilterSearchEntry[][], SearchIndex>();

function getIndex(groups: FilterSearchEntry[][]): SearchIndex {
  let index = indexCache.get(groups);
  if (index) return index;

  const raw: IndexedWord[] = [];
  const folded: IndexedWord[] = [];
  const position = new Map<
    FilterSearchEntry,
    { group: number; order: number }
  >();
  groups.forEach((group, groupIndex) => {
    group.forEach((entry, order) => {
      position.set(entry, { group: groupIndex, order });
      const words = getWords(entry);
      words.raw.flat().forEach((word) => raw.push({ word, entry }));
      words.folded.flat().forEach((word) => folded.push({ word, entry }));
    });
  });
  const byWord = (a: IndexedWord, b: IndexedWord) =>
    a.word < b.word ? -1 : a.word > b.word ? 1 : 0;
  raw.sort(byWord);
  folded.sort(byWord);

  index = { raw, folded, position };
  indexCache.set(groups, index);
  return index;
}

/**
 * Builds the search index ahead of the first query, which would otherwise
 * pay for it (~175ms over 13,000 names on a desktop, several times that on a
 * phone). The overlay calls it in idle time when it opens.
 */
export function prepareFilterSearch(groups: FilterSearchEntry[][]): void {
  getIndex(groups);
}

/** The first position in a sorted word list not before `word`. */
function lowerBound(words: IndexedWord[], word: string): number {
  let low = 0;
  let high = words.length;
  while (low < high) {
    const middle = (low + high) >> 1;
    if (words[middle].word < word) low = middle + 1;
    else high = middle;
  }
  return low;
}

/**
 * Entries holding a word the query's last word could be: one it starts, or
 * — when it reads as finished — one it equals once folded. Every match has
 * such a word, so these are the only entries worth comparing in full.
 */
function getCandidates(index: SearchIndex, query: Query) {
  const candidates = new Set<FilterSearchEntry>();
  const prefix = query.raw[query.raw.length - 1];
  for (
    let at = lowerBound(index.raw, prefix);
    at < index.raw.length && index.raw[at].word.startsWith(prefix);
    at += 1
  ) {
    candidates.add(index.raw[at].entry);
  }
  if (query.lastIsInflected) {
    const folded = query.folded[query.folded.length - 1];
    for (
      let at = lowerBound(index.folded, folded);
      at < index.folded.length && index.folded[at].word === folded;
      at += 1
    ) {
      candidates.add(index.folded[at].entry);
    }
  }
  return candidates;
}

/**
 * The menu's matches for a query: a few from each group, whole-word matches
 * before ones that only complete a word being typed, then in group order,
 * each group in its own order (best-represented first for people and venues).
 *
 * A few per group rather than the best overall, because the groups don't
 * compete: "hitch" naming a director and a festival is two different answers,
 * and the reader knows which they meant. The tiers stop "rio" listing actors
 * called Rioton and Rioufol above Rio Cinema.
 */
export function searchFilterGroups(
  groups: FilterSearchEntry[][],
  query: string,
  { perGroup = 3, limit = 10 }: { perGroup?: number; limit?: number } = {},
): FilterSearchEntry[] {
  const raw = normalizeToWords(query);
  if (raw.join("").length < MIN_FILTER_SEARCH_LENGTH) return [];
  const folded = raw.map(foldSuffix);
  const words: Query = {
    raw,
    folded,
    lastIsInflected: folded[folded.length - 1] !== raw[raw.length - 1],
  };

  const index = getIndex(groups);
  const matches: {
    entry: FilterSearchEntry;
    tier: MatchTier;
    group: number;
    order: number;
  }[] = [];
  for (const entry of getCandidates(index, words)) {
    const tier = matchEntry(words, entry);
    if (tier === null) continue;
    matches.push({ entry, tier, ...index.position.get(entry)! });
  }
  matches.sort(
    (a, b) => a.group - b.group || a.tier - b.tier || a.order - b.order,
  );

  // A few from each group, then the groups' picks ranked together.
  const picked: typeof matches = [];
  let taken = 0;
  let group = -1;
  for (const match of matches) {
    if (match.group !== group) {
      group = match.group;
      taken = 0;
    }
    if (taken < perGroup) {
      picked.push(match);
      taken += 1;
    }
  }

  return picked
    .sort((a, b) => a.tier - b.tier || a.group - b.group || a.order - b.order)
    .slice(0, limit)
    .map(({ entry }) => entry);
}

/**
 * Whether the entry's value is explicitly selected. `null` (everything) counts
 * as no, so a menu over an unfiltered state isn't a column of ticks.
 */
export function isFilterSearchEntrySelected(
  state: FilterState,
  entry: FilterSearchEntry,
): boolean {
  const current = get(state, entry.filterId) as string[] | null;
  return current !== null && current.includes(entry.value);
}

/**
 * The state after picking an entry: its value toggled in its filter, and the
 * title query cleared, since the query was the value's name rather than a
 * title.
 *
 * Adding to a filter that holds everything (`null`) or its default selects
 * just this value — picking Quizzes means quizzes, not films and quizzes.
 * Otherwise the value joins what's there, so two directors can be picked in
 * turn. Removing the last value leaves the filter at everything rather than
 * at nothing, which would empty the grid.
 */
export function applyFilterSearchEntry(
  state: FilterState,
  entry: FilterSearchEntry,
): FilterState {
  const current = get(state, entry.filterId) as string[] | null;
  const atDefault =
    current === null || filtersAtDefault(state, [entry.filterId]);

  let next: string[] | null;
  if (isFilterSearchEntrySelected(state, entry) && !atDefault) {
    const remaining = current!.filter((value) => value !== entry.value);
    next = remaining.length > 0 ? remaining : null;
  } else if (atDefault) {
    next = [entry.value];
  } else {
    next = [...current!, entry.value];
  }

  const withValue = set(
    state,
    entry.filterId,
    next as FilterState[ListFilterId],
  );
  return set(withValue, FilterId.Search, "");
}
