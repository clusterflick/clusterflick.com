import { AccessibilityFeature, Category, Genre, Venue } from "@/types";
import { ACCESSIBILITY_LABELS } from "@/utils/accessibility-labels";
import {
  formatDateLong,
  formatDaysFromNow,
  getDaysFromNow,
} from "@/utils/format-date";
import { FilterId, FilterState, MoviesRecord } from "./types";
import {
  apply,
  get,
  set,
  getPermissiveState,
  getRestrictiveFilterIds,
} from "./manager";
import { FORMAT_GROUPS, getPrimaryCategory } from "./modules";
import {
  matchesSearchQuery,
  normalizeForSearch,
  normalizeToWords,
} from "./normalize";
import { formatList } from "./describe";

/**
 * What kind of change an offer represents:
 * - `filter` — the query names a filter value rather than a film ("70mm",
 *   "Action"). Reads the query exactly as typed, just as something other than
 *   a title, so it concedes nothing and leads.
 * - `redirect` — the same query, matched against a different text field. Also
 *   concedes nothing, but a filter is the stronger reading when both fit.
 * - `correct` — a different query, in the same field. Puts words in the user's
 *   mouth, so it ranks below a redirect, but only ever appears when the query
 *   as typed matches nothing anywhere.
 * - `widen` — a filter given up. Costs the user something real: a date they
 *   didn't want, a venue further away.
 */
export type SuggestionKind = "filter" | "redirect" | "correct" | "widen";

/** One filter this offer changes, named and — where it can be — explained. */
export interface SuggestionChange {
  /** Noun phrase for the filter's new value, e.g. "Any date". */
  label: string;
  /**
   * What the change reveals, read off the probe result and phrased to follow
   * the label after a colon: "next showing in 8 days", "found in TV".
   *
   * Absent when the change has nothing to add beyond its own name (genres,
   * formats), and deliberately absent for accessibility.
   */
  detail?: string;
}

export interface FilterSuggestion {
  /** Stable key, unique within a result set. */
  id: string;
  kind: SuggestionKind;
  /**
   * Line one: what taking this offer does, phrased as something you can do.
   * A bare filter name ("Any date") reads as a label rather than a button, so
   * this is always either a question, an instruction, or the films themselves.
   */
  headline: string;
  /**
   * The filters this offer changes, one per line under the headline. Empty when
   * the headline already says everything — a correction that needed no filter
   * touched at all.
   */
  changes: SuggestionChange[];
  /** How many movies the suggested state returns. Always greater than zero. */
  count: number;
  /** The filter state to apply if the offer is taken. */
  state: FilterState;
}

/**
 * The search fields a query can be moved between, and the noun each one
 * searches. Order is the order offers appear in.
 *
 * `ShowingUrlSearch` is absent on purpose: it is internal-only, with no UI and
 * no URL params, so it can neither be explained to the reader nor undone by
 * them.
 */
type SearchFieldId =
  | FilterId.Search
  | FilterId.ShowingTitleSearch
  | FilterId.PerformanceNotesSearch;

const REDIRECT_FIELDS: { id: SearchFieldId; noun: string; label: string }[] = [
  { id: FilterId.Search, noun: "film titles", label: "Film title" },
  {
    id: FilterId.ShowingTitleSearch,
    noun: "original venue titles",
    label: "Original venue title",
  },
  {
    id: FilterId.PerformanceNotesSearch,
    noun: "performance notes",
    label: "Performance note",
  },
];

/**
 * Filters that can be widened, ordered by how little it costs the user to give
 * them up.
 *
 * This order is an editorial judgement, and deliberately *not* a ranking by
 * result count. Sorting by count would promote "drop your Subtitles
 * requirement" to the top whenever that happens to free up the most
 * screenings — which is the one suggestion a subtitles user cannot act on.
 *
 * Date leads because "I want to see this film" rarely means "tonight or never",
 * and because the today→+7d default is the most common invisible blocker.
 * Venues sit low: travelling further is a real cost. Accessibility is last and
 * never combined with anything else (see `soloOnly` below) — it is a
 * requirement, not a preference.
 *
 * The search fields are absent by design. A typed query is the clearest
 * statement of intent on the page, so it gets redirected, never dropped.
 */
const WIDENABLE: { id: FilterId; label: string; action: string }[] = [
  { id: FilterId.DateRange, label: "Any date", action: "Search all dates" },
  {
    id: FilterId.Categories,
    label: "All event types",
    action: "Search all event types",
  },
  {
    id: FilterId.TimeRange,
    label: "Any time of day",
    action: "Search all times of day",
  },
  { id: FilterId.Genres, label: "All genres", action: "Search all genres" },
  {
    id: FilterId.FormatSource,
    label: "Any source format",
    action: "Search all source formats",
  },
  {
    id: FilterId.FormatPresentation,
    label: "Any presentation",
    action: "Search all presentations",
  },
  {
    id: FilterId.FormatDimension,
    label: "Any dimension",
    action: "Search all dimensions",
  },
  {
    id: FilterId.HideFinished,
    label: "Finished showings shown",
    action: "Include finished showings",
  },
  {
    id: FilterId.HideSoldOut,
    label: "Sold-out showings shown",
    action: "Include sold-out showings",
  },
  { id: FilterId.Venues, label: "All venues", action: "Search all venues" },
  {
    id: FilterId.Accessibility,
    label: "Any accessibility requirement",
    action: "Search without your accessibility filter",
  },
];

/** A single reversible change to the filter state. */
interface Move {
  id: string;
  kind: SuggestionKind;
  /** Imperative phrasing, used when this move leads the offer. */
  action: string;
  /** Noun phrasing, used when this move is listed as one of the changes. */
  label: string;
  /** Never paired with another move — offered alone or not at all. */
  soloOnly: boolean;
  /**
   * Whether this move rewrites what the reader asked for rather than the
   * filters around it. Decides which move leads the offer.
   */
  altersQuery: boolean;
  /**
   * Every filter this move sets. Two moves that write the same filter can never
   * be combined: transforms apply in order, so the second silently undoes the
   * first while both still appear in the copy. Setting the event type to
   * Quizzes and then widening the event type to everything produced exactly
   * that — an offer headed "Show Quizzes" that selected all events.
   */
  writes: FilterId[];
  transform: (state: FilterState) => FilterState;
  /**
   * Turns the probe result into the specific fact worth reporting. Only ever
   * called on a result that already has something in it, so it can read the
   * first entry without guarding for emptiness beyond the obvious.
   */
  describeResult?: (result: MoviesRecord) => string | undefined;
}

/** Lookups needed to name things the reader would recognise. */
interface SuggestContext {
  /** Category display labels, as passed to `describeFilters`. */
  categories?: { value: Category; label: string }[];
  venues?: Record<string, Venue> | null;
  genres?: Record<string, Genre> | null;
}

/**
 * A filter whose values a query might be naming instead of a film — "70mm" is
 * a source format, "Action" is a genre.
 *
 * Venues are deliberately absent. Their names are full of ordinary words (Rio,
 * Castle, Everyman, The Garden) that collide with film titles, and unlike the
 * vocabularies here there is no reading of the query that makes the collision
 * harmless.
 */
interface ValueVocabulary {
  filterId: FilterId;
  /** Names the dimension in a change line, e.g. "Source Format". */
  label: string;
  /** Completes the headline: `Show 70mm ${noun}`. Empty where none reads well. */
  noun: string;
  entries: {
    name: string;
    /** Applies this one value, typed by the vocabulary that owns it. */
    select: (state: FilterState) => FilterState;
  }[];
}

function buildVocabularies(context: SuggestContext): ValueVocabulary[] {
  const vocabularies: ValueVocabulary[] = FORMAT_GROUPS.map((group) => ({
    filterId: group.filterId,
    label: group.title,
    noun: "screenings",
    entries: group.options.map((option) => ({
      name: option.label,
      select: (state: FilterState) =>
        set(state, group.filterId, [option.value]),
    })),
  }));

  if (context.genres) {
    vocabularies.push({
      filterId: FilterId.Genres,
      label: "Genre",
      noun: "films",
      // Keyed by id, and the entries themselves carry only a name — the same
      // way `describeFilters` reads them.
      entries: Object.entries(context.genres).map(([id, genre]) => ({
        name: genre.name,
        select: (state: FilterState) => set(state, FilterId.Genres, [id]),
      })),
    });
  }

  if (context.categories) {
    vocabularies.push({
      filterId: FilterId.Categories,
      label: "Event type",
      // The labels are already plural nouns — "Show Quizzes", "Show TV".
      noun: "",
      entries: context.categories.map((category) => ({
        name: category.label,
        select: (state: FilterState) =>
          set(state, FilterId.Categories, [category.value]),
      })),
    });
  }

  vocabularies.push({
    filterId: FilterId.Accessibility,
    label: "Accessibility",
    noun: "screenings",
    entries: Object.entries(ACCESSIBILITY_LABELS).map(([feature, name]) => ({
      name,
      select: (state: FilterState) =>
        set(state, FilterId.Accessibility, [feature as AccessibilityFeature]),
    })),
  });

  return vocabularies;
}

/**
 * Moves that read the query as a filter value rather than a title.
 *
 * Matching is exact against whole words, never fuzzy: over a vocabulary this
 * small an edit budget multiplies ambiguity for nothing — "Action" is a genre,
 * "Acton" is a place. Matching a *run* of words rather than the whole name is
 * what lets "70mm" find both "70mm" and "IMAX 70mm", which is the point: the
 * two are different offers with different counts, and the reader picks.
 *
 * Only the main search box is read this way. The other two fields are already
 * specialist, and a format string typed into performance notes is a legitimate
 * note search rather than a mistake.
 */
function buildValueMoves(state: FilterState, context: SuggestContext): Move[] {
  const needle = normalizeForSearch(get(state, FilterId.Search).trim());
  if (needle.length === 0) return [];

  const moves: Move[] = [];

  for (const vocabulary of buildVocabularies(context)) {
    for (const entry of vocabulary.entries) {
      const exact =
        bestWordRunDistance(needle, normalizeToWords(entry.name), 0) === 0;
      if (!exact) continue;

      moves.push({
        id: `filter:${vocabulary.filterId}:${entry.name}`,
        kind: "filter",
        action: `Show ${entry.name}${vocabulary.noun ? ` ${vocabulary.noun}` : ""}`,
        label: vocabulary.label,
        soloOnly: false,
        // The query was the filter value, so it leaves the search box with it.
        altersQuery: true,
        writes: [FilterId.Search, vocabulary.filterId],
        transform: (current: FilterState) =>
          entry.select(set(current, FilterId.Search, "")),
        describeResult: () => entry.name,
      });
    }
  }

  return moves;
}

/**
 * The earliest performance across the result — the whole point of widening a
 * date window, and far more use than the number of films it let through.
 */
function describeEarliestPerformance(result: MoviesRecord): string | undefined {
  let earliest = Infinity;
  for (const movie of Object.values(result)) {
    for (const performance of movie.performances) {
      if (performance.time < earliest) earliest = performance.time;
    }
  }
  if (!Number.isFinite(earliest)) return undefined;

  // "in 8 days" is easier to act on than a date you have to count to, but the
  // arithmetic stops being worth doing at a fortnight out — past that the date
  // itself is the more useful answer.
  const days = getDaysFromNow(earliest, RELATIVE_DAY_LIMIT);
  return days === null
    ? `next showing ${formatDateLong(earliest)}`
    : `next showing ${formatDaysFromNow(days)}`;
}

/** The categories the widening let in, which the current selection excludes. */
function describeNewCategories(
  state: FilterState,
  result: MoviesRecord,
  labels: { value: Category; label: string }[] | undefined,
): string | undefined {
  if (!labels) return undefined;

  const selected = new Set(state.categories ?? []);
  const found = new Set<Category>();
  for (const movie of Object.values(result)) {
    const category = getPrimaryCategory(movie);
    if (!selected.has(category)) found.add(category);
  }

  const names = [...found]
    .map((category) => labels.find((l) => l.value === category)?.label)
    .filter((name): name is string => !!name);
  if (names.length === 0) return undefined;

  return `found in ${formatList(names, 3)}`;
}

/** The venues the widening let in, which the current selection excludes. */
function describeNewVenues(
  state: FilterState,
  result: MoviesRecord,
  venues: Record<string, Venue> | null | undefined,
): string | undefined {
  if (!venues) return undefined;

  const selected = new Set(state.venues ?? []);
  const found = new Set<string>();
  for (const movie of Object.values(result)) {
    for (const showing of Object.values(movie.showings)) {
      if (!selected.has(showing.venueId)) found.add(showing.venueId);
    }
  }

  const names = [...found]
    .map((id) => venues[id]?.name)
    .filter((name): name is string => !!name);
  if (names.length === 0) return undefined;

  return `at ${formatList(names, 2, "venues")}`;
}

/**
 * The text that actually matched, quoted back.
 *
 * Every search module prunes to matching showings or performances, so the first
 * entry left in the result *is* a match — no re-running the comparison to find
 * one. Showing this is the point of a redirect offer: it proves the query was
 * right and only pointed at the wrong column.
 */
function describeRedirectMatch(
  target: SearchFieldId,
  result: MoviesRecord,
): string | undefined {
  const movie = Object.values(result)[0];
  if (!movie) return undefined;

  const quote = (text: string) => `“${text}”`;

  switch (target) {
    case FilterId.Search:
      return quote(movie.title);
    case FilterId.ShowingTitleSearch: {
      const showing = Object.values(movie.showings)[0];
      // `showing.title` is only set when it differs from the film title.
      return showing ? quote(showing.title || movie.title) : undefined;
    }
    case FilterId.PerformanceNotesSearch: {
      const notes = movie.performances.find((p) => p.notes)?.notes;
      return notes ? quote(notes) : undefined;
    }
  }
}

/**
 * Moves that re-file the user's query against a different search field.
 *
 * Only generated when the target field is empty: overwriting a query the user
 * put there themselves would be a silent loss, not a suggestion.
 */
function buildRedirectMoves(state: FilterState): Move[] {
  const moves: Move[] = [];

  for (const source of REDIRECT_FIELDS) {
    const query = get(state, source.id).trim();
    if (query.length === 0) continue;

    for (const target of REDIRECT_FIELDS) {
      if (target.id === source.id) continue;
      if (get(state, target.id).trim().length > 0) continue;

      moves.push({
        id: `redirect:${source.id}:${target.id}`,
        kind: "redirect",
        action: `Search ${target.noun} instead`,
        label: target.label,
        soloOnly: false,
        altersQuery: true,
        writes: [source.id, target.id],
        transform: (current) =>
          set(set(current, source.id, ""), target.id, query),
        describeResult: (result) => describeRedirectMatch(target.id, result),
      });
    }
  }

  return moves;
}

/**
 * Which widenings have something specific to say about their result. The rest
 * stand on their count alone: "all genres" freeing up 12 films is already the
 * whole story, and naming the genres would just restate the label.
 *
 * Accessibility is absent deliberately. Any detail here would be an argument
 * for giving up a requirement, and the offer is only listed at all so that
 * someone who *can* flex it is not left guessing.
 */
function widenDetail(
  id: FilterId,
  state: FilterState,
  context: SuggestContext,
): ((result: MoviesRecord) => string | undefined) | undefined {
  switch (id) {
    case FilterId.DateRange:
      return describeEarliestPerformance;
    case FilterId.Categories:
      return (result) =>
        describeNewCategories(state, result, context.categories);
    case FilterId.Venues:
      return (result) => describeNewVenues(state, result, context.venues);
    default:
      return undefined;
  }
}

/**
 * Shortest query that can be corrected.
 *
 * The floor is empirical, not aesthetic: below it, a one-edit budget is a
 * quarter of the query, and the dataset holds enough short title words that
 * something always lands within it.
 *
 * Five is where the real cases start — "akera" → Akira and "bilss" → Bliss are
 * both five — so it cannot go higher without losing them. Short queries stay
 * inherently speculative as a result: any five-letter string one edit from a
 * title word will draw an offer, and nothing in the query distinguishes a
 * genuine slip from a coincidence. They are phrased as a question and carry a
 * result count for exactly that reason.
 */
const MIN_CORRECTABLE_LENGTH = 5;

/** How many alternative titles to put forward at most. */
const MAX_CORRECTIONS = 2;

/** Beyond a fortnight, "in 23 days" is harder to place than the date itself. */
const RELATIVE_DAY_LIMIT = 14;

/**
 * Optimal string alignment distance between two whole strings — Levenshtein
 * plus a transposition operation, capped at `max`.
 *
 * The transposition case is not a refinement, it is the main event. Swapping
 * two adjacent letters is the most common way to mistype a word, and plain
 * Levenshtein charges it as two substitutions — which put "ornage" → "orange"
 * and "bilss" → "bliss" out of reach of any budget a short query can afford.
 *
 * Returns `max + 1` rather than the true distance once the answer is known to
 * exceed the cap, so callers must compare against `max`, never between two
 * rejected values.
 */
function boundedEditDistance(a: string, b: string, max: number): number {
  const m = a.length;
  const n = b.length;
  // Length alone can rule it out: each edit changes the length by at most one.
  if (Math.abs(m - n) > max) return max + 1;

  let twoBack: number[] = [];
  let previous = Array.from({ length: n + 1 }, (_, j) => j);

  for (let i = 1; i <= m; i += 1) {
    const current = new Array<number>(n + 1);
    current[0] = i;
    let rowBest = current[0];

    for (let j = 1; j <= n; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let distance = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + cost,
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        distance = Math.min(distance, twoBack[j - 2] + 1);
      }
      current[j] = distance;
      if (distance < rowBest) rowBest = distance;
    }

    // Every later row is at least this good, so the cap can never be met again.
    if (rowBest > max) return max + 1;

    twoBack = previous;
    previous = current;
  }

  return previous[n];
}

/**
 * The closest any run of whole words in `words` comes to `needle`.
 *
 * Anchoring to word boundaries is what keeps corrections honest. The previous
 * free-floating substring match let a query land anywhere, so "ornage" scored
 * one edit against "short**s for age**s 4+" — three words deep, mid-word at
 * both ends — and beat "A Clockwork Orange". People mistype words, not
 * arbitrary character windows.
 *
 * Runs are joined without separators so the comparison stays in the same
 * alphabet as the query, and only runs whose length is within `max` of the
 * query are scored — anything else cannot possibly come within budget.
 */
function bestWordRunDistance(
  needle: string,
  words: string[],
  max: number,
): number {
  const shortest = needle.length - max;
  const longest = needle.length + max;
  let best = max + 1;

  for (let start = 0; start < words.length; start += 1) {
    let run = "";
    for (let end = start; end < words.length; end += 1) {
      run += words[end];
      // Extending only makes it longer, so nothing further from this start can
      // come back into range.
      if (run.length > longest) break;
      if (run.length < shortest) continue;

      const distance = boundedEditDistance(needle, run, max);
      if (distance < best) best = distance;
      if (best === 0) return 0;
    }
  }

  return best;
}

/**
 * Titles close enough to the query to be a plausible mistyping of it, best
 * first.
 *
 * Returns nothing the moment any title matches the query outright — a query
 * that finds films is not a typo, and offering to rewrite it would be putting
 * words in the mouth of someone who spelled it correctly. The exact-match test
 * goes through `matchesSearchQuery` rather than the distance, so a query that
 * only lands via a spelling variant ("godfather part 2") is recognised as
 * correct too.
 */
function findNearMissTitles(movies: MoviesRecord, query: string): string[] {
  const needle = normalizeForSearch(query);
  if (needle.length < MIN_CORRECTABLE_LENGTH) return [];

  // One typo per six characters, so short queries are not rewritten wholesale.
  const maxDistance = Math.min(3, Math.max(1, Math.round(needle.length / 6)));

  const catalogue = Object.values(movies);

  // Settle "is this even a typo?" before pricing anything, so the distance work
  // is never done and thrown away. The saving is smaller than it looks — this
  // scan is itself the bulk of the cost on a correctly spelled query, being the
  // same work the search filter has already done — but no result should depend
  // on where in the catalogue the matching title happens to sit.
  for (const movie of catalogue) {
    if (matchesSearchQuery(movie.title, needle)) return [];
  }

  const matches: {
    title: string;
    distance: number;
    showings: number;
    soonest: number;
  }[] = [];

  for (const movie of catalogue) {
    const distance = bestWordRunDistance(
      needle,
      normalizeToWords(movie.title),
      maxDistance,
    );
    if (distance > maxDistance) continue;

    let soonest = Infinity;
    for (const performance of movie.performances) {
      if (performance.time < soonest) soonest = performance.time;
    }

    matches.push({
      title: movie.title,
      distance,
      showings: movie.performances.length,
      soonest,
    });
  }

  // Ties are the normal case, not the exception: "dummer" is one edit from
  // eleven titles, every one of them through the word "summer". Only two are
  // ever offered, so how the tie breaks decides what the reader sees.
  //
  // Alphabetical — the obvious default — is the one ordering with nothing to
  // recommend it, handing "dummer" the two titles that happen to start with a
  // digit and an A. Screening count stands in for how likely a film is to be
  // the one meant, since a film showing across London all week is a better
  // guess than one with a single late-night slot; the soonest showing settles
  // what is left, favouring something the reader can actually go and see.
  matches.sort(
    (a, b) =>
      a.distance - b.distance ||
      b.showings - a.showings ||
      a.soonest - b.soonest ||
      a.title.localeCompare(b.title),
  );

  const titles: string[] = [];
  for (const { title } of matches) {
    if (titles.includes(title)) continue;
    titles.push(title);
    if (titles.length >= MAX_CORRECTIONS) break;
  }
  return titles;
}

/**
 * Moves that replace the query with a title it was probably a mistyping of.
 *
 * Only the main search box is corrected. It takes the overwhelming majority of
 * queries, and it is the only field whose contents are drawn from a fixed
 * vocabulary of titles — performance notes are freeform prose, where "did you
 * mean" has nothing to match against.
 */
function buildCorrectionMoves(
  movies: MoviesRecord,
  state: FilterState,
): Move[] {
  const query = get(state, FilterId.Search).trim();
  if (query.length === 0) return [];

  return findNearMissTitles(movies, query).map((title) => ({
    id: `correct:${title}`,
    kind: "correct" as const,
    action: `Did you mean “${title}”?`,
    // Never listed as a change: the headline already names the film, and the
    // correction touches no filter. The next showing date belongs to the date
    // widening, if one was needed — reporting it here made every correction
    // look as though it had moved the date window when it had not.
    label: `Did you mean “${title}”?`,
    soloOnly: false,
    altersQuery: true,
    writes: [FilterId.Search],
    transform: (current: FilterState) => set(current, FilterId.Search, title),
  }));
}

/** Moves that reset one restrictive filter to its fully permissive value. */
function buildWidenMoves(state: FilterState, context: SuggestContext): Move[] {
  const permissive = getPermissiveState();
  const restrictive = new Set(getRestrictiveFilterIds(state));

  return WIDENABLE.filter(({ id }) => restrictive.has(id)).map(
    ({ id, label, action }) => ({
      id: `widen:${id}`,
      kind: "widen" as const,
      action,
      label,
      soloOnly: id === FilterId.Accessibility,
      altersQuery: false,
      writes: [id],
      transform: (current: FilterState) =>
        set(current, id, get(permissive, id)),
      describeResult: widenDetail(id, state, context),
    }),
  );
}

/**
 * Line one of an offer.
 *
 * A move that rewrites the query leads, because it is the thing the reader most
 * needs to agree to — the film they meant, or the column they meant. Failing
 * that there is nothing to phrase as an instruction that the change lines below
 * do not already say, so the films themselves take the line: naming two titles
 * beats "Any date", which reads as a caption rather than a button.
 */
function buildHeadline(moves: Move[], result: MoviesRecord): string {
  const rewrite = moves.find((move) => move.altersQuery);
  if (rewrite) return rewrite.action;

  const titles = Object.values(result).map((movie) => `“${movie.title}”`);
  return `Show ${formatList(titles, 2)}`;
}

/**
 * The change lines beneath the headline, one per filter touched.
 *
 * A move whose action is already the headline contributes only its fact, so
 * nothing is said twice — and a correction, which has no fact, drops out
 * entirely rather than repeating the film's name under its own question.
 */
function buildChanges(
  moves: Move[],
  headline: string,
  result: MoviesRecord,
): SuggestionChange[] {
  const changes: SuggestionChange[] = [];

  for (const move of moves) {
    const detail = move.describeResult?.(result);
    if (move.action === headline && detail === undefined) continue;
    changes.push({ label: move.label, ...(detail ? { detail } : {}) });
  }

  return changes;
}

export interface SuggestOptions extends SuggestContext {
  movies: MoviesRecord;
  state: FilterState;
  /** Maximum offers to return. */
  limit?: number;
  /**
   * Hard ceiling on filter-pipeline passes, so a heavily filtered state can't
   * stall the page working through the pair round.
   */
  maxProbes?: number;
}

/**
 * Finds the cheapest changes to the current filter state that would actually
 * return something, each with the number of results it yields.
 *
 * Works by probing: build a candidate state, run the real filter pipeline over
 * it, count what survives. That means the counts shown to the user are the
 * counts they will get, with no second implementation of the filter logic to
 * drift out of sync.
 *
 * Offers are found in rounds, cheapest first — redirects, then single widens,
 * then pairs — and the search runs until it has `limit` offers rather than
 * stopping at the first productive round. Cost decides the *order* of offers,
 * not whether a reader gets to hear about them: a cheap redirect and an
 * expensive widening frequently point at entirely different films.
 *
 * There is no third round on purpose: a three-filter relaxation is no longer a
 * suggestion, it is a reset with extra steps, and the caller offers a reset.
 *
 * Returns an empty array when the state already has results — there is nothing
 * to rescue — and also when nothing rescues the query, which is itself
 * meaningful — it says the query matches nothing anywhere in the dataset,
 * rather than being hidden by a filter.
 */
export function suggestFilterRelaxations({
  movies,
  state,
  limit = 3,
  maxProbes = 40,
  categories,
  venues,
  genres,
}: SuggestOptions): FilterSuggestion[] {
  const context: SuggestContext = { categories, venues, genres };

  // Nothing to rescue. Checked here rather than trusted to the caller because
  // the caller's idea of "empty" is easy to take from a different state than
  // the one passed in: on the films page the grid is measured against the live
  // filters while this runs on a deferred copy, and one keystroke of daylight
  // between them was enough to offer ways to improve a query that had results
  // — offers that flashed up, vanished, and would have reinstated the previous
  // query if taken.
  if (Object.keys(apply(movies, state)).length > 0) return [];

  // Cost order. A filter reading takes the query exactly as typed and is the
  // strongest reading when it fits at all, so it leads; redirects also concede
  // nothing but only move the query; corrections rewrite it; widenings give up
  // a filter, so they come last.
  const moves = [
    ...buildValueMoves(state, context),
    ...buildRedirectMoves(state),
    ...buildCorrectionMoves(movies, state),
    ...buildWidenMoves(state, context),
  ];
  if (moves.length === 0) return [];

  let probes = 0;

  const evaluate = (combination: Move[]): FilterSuggestion | null => {
    if (probes >= maxProbes) return null;
    probes += 1;

    const candidate = combination.reduce(
      (result, move) => move.transform(result),
      state,
    );
    const filtered = apply(movies, candidate);
    const count = Object.keys(filtered).length;
    if (count === 0) return null;

    const headline = buildHeadline(combination, filtered);

    return {
      id: combination.map((move) => move.id).join("+"),
      kind: combination[0].kind,
      headline,
      changes: buildChanges(combination, headline, filtered),
      count,
      state: candidate,
    };
  };

  // Round one — a single change. `moves` is already in cost order, so the first
  // hits are also the cheapest.
  const suggestions: FilterSuggestion[] = [];
  const worksAlone = new Set<string>();
  for (const move of moves) {
    const suggestion = evaluate([move]);
    if (suggestion) {
      suggestions.push(suggestion);
      worksAlone.add(move.id);
    }
    if (suggestions.length >= limit) return suggestions;
  }

  // Round two — pairs. Reached even when round one found something, because a
  // redirect and a widening are answers to different questions, about different
  // films: "you searched the wrong field" versus "your filters are too narrow".
  // Searching "word" can turn up a performance note straight away while the
  // film actually called "Words" sits outside the date window *and* in an
  // excluded category — reachable only as a pair, and silently lost if finding
  // the redirect ended the search.
  //
  // A pair whose halves already work individually is skipped: it is a strictly
  // more expensive route to results the reader has been offered already.
  const pairable = moves.filter(
    (move) => !move.soloOnly && !worksAlone.has(move.id),
  );
  for (let i = 0; i < pairable.length; i += 1) {
    for (let j = i + 1; j < pairable.length; j += 1) {
      // Two moves writing the same filter contradict each other, and the one
      // applied second wins silently. That also covers the query fields, so a
      // correction never pairs with a redirect and no query lands in two boxes.
      const collides = pairable[i].writes.some((id) =>
        pairable[j].writes.includes(id),
      );
      if (collides) continue;
      const suggestion = evaluate([pairable[i], pairable[j]]);
      if (suggestion) suggestions.push(suggestion);
      if (suggestions.length >= limit) return suggestions;
    }
  }

  return suggestions;
}
