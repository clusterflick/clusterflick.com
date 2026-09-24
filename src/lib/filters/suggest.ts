import { AccessibilityFeature, Category, Genre, Movie, Venue } from "@/types";
import { ACCESSIBILITY_LABELS } from "@/utils/accessibility-labels";
import {
  formatDateLong,
  formatDaysFromNow,
  getDaysFromNow,
  RELATIVE_DAY_LIMIT,
} from "@/utils/format-date";
import { FilterId, FilterState, MoviesRecord } from "./types";
import {
  apply,
  get,
  set,
  getPermissiveState,
  getRestrictiveFilterIds,
} from "./manager";
import {
  FORMAT_GROUPS,
  getPrimaryCategory,
  resolvePeopleQuery,
  type PeopleIndex,
} from "./modules";
import {
  matchesSearchQuery,
  normalizeForSearch,
  normalizeToWords,
} from "./normalize";
import {
  bestWordRunDistance,
  editBudgetFor,
  MIN_FUZZY_LENGTH,
} from "./word-distance";
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
 * statement of intent on the page, so it gets redirected rather than dropped —
 * the exception being a second query left beside a film title query, see
 * {@link buildStaleQueryMoves}.
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
  // Below venues because giving up a name discards the reader's stated
  // subject rather than widening the terms around it: someone who picked
  // Scorsese would rather travel than watch somebody else. Still above
  // accessibility, which is a requirement rather than a preference.
  {
    id: FilterId.Directors,
    label: "All directors",
    action: "Search all directors",
  },
  { id: FilterId.Cast, label: "All cast", action: "Search all cast" },
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
  /** Moves that are two readings of one query and must be offered together. */
  pairId?: string;
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
  /** From `buildPeopleIndex`; absent means no query is read as naming anyone. */
  people?: PeopleIndex | null;
}

/**
 * Other words for a value — what people type rather than what the pill says.
 *
 * Aliases rather than an edit budget, because the words worth catching are
 * rarely spellings of the label: "subs", "captioned" and "SDH" are all
 * subtitles and none is within any distance of it. Plurals and past tenses
 * ("subtitle", "subtitled") need no entry here; {@link foldSuffix} covers them.
 *
 * Accessibility is keyed by feature and genres by name, since genre ids come
 * from the dataset.
 */
const ACCESSIBILITY_ALIASES: Record<AccessibilityFeature, string[]> = {
  [AccessibilityFeature.AudioDescription]: ["audio described", "AD"],
  [AccessibilityFeature.BabyFriendly]: [
    "baby",
    "parent and baby",
    "parent and child",
    "carer and baby",
  ],
  [AccessibilityFeature.HardOfHearing]: ["HOH"],
  [AccessibilityFeature.Relaxed]: [
    "relaxed screening",
    "autism friendly",
    "sensory friendly",
  ],
  [AccessibilityFeature.Subtitled]: [
    "subs",
    "captioned",
    "captions",
    "closed captions",
    "SDH",
  ],
};

const GENRE_ALIASES: Record<string, string[]> = {
  "science fiction": ["sci-fi", "scifi"],
  animation: ["animated"],
  history: ["historical"],
  documentary: ["docs"],
};

const CATEGORY_ALIASES: Partial<Record<Category, string[]>> = {
  // "quizzes" folds to "quizz", which "quiz" cannot reach.
  [Category.Quiz]: ["quiz"],
};

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
    /** The value this entry selects, as the filter stores it. */
    value: string;
    /** Other words that name this value; see {@link ACCESSIBILITY_ALIASES}. */
    aliases?: string[];
    /**
     * A format's "nothing special" value — Digital, Normal, 2D. Selecting it
     * is never what a query was reaching for when titles already matched.
     */
    isDefault?: boolean;
    /** Applies this one value, typed by the vocabulary that owns it. */
    select: (state: FilterState) => FilterState;
  }[];
}

type ValueEntry = ValueVocabulary["entries"][number];

function buildVocabularies(context: SuggestContext): ValueVocabulary[] {
  const vocabularies: ValueVocabulary[] = FORMAT_GROUPS.map((group) => ({
    filterId: group.filterId,
    label: group.title,
    noun: "screenings",
    entries: group.options.map((option) => ({
      name: option.label,
      value: option.value,
      isDefault: option.value === group.defaultValue,
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
        value: id,
        aliases: GENRE_ALIASES[genre.name.toLowerCase()],
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
        value: category.value,
        aliases: CATEGORY_ALIASES[category.value],
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
      value: feature,
      aliases: ACCESSIBILITY_ALIASES[feature as AccessibilityFeature],
      select: (state: FilterState) =>
        set(state, FilterId.Accessibility, [feature as AccessibilityFeature]),
    })),
  });

  return vocabularies;
}

/**
 * Folds the common English endings off a normalised term, so "subtitle",
 * "subtitled" and "subtitles" all meet at "subtitl".
 *
 * Applied to both sides of a comparison, so it only has to be consistent, not
 * linguistically right — and it only ever compares against a vocabulary of a
 * few dozen values, where two different words folding together is harmless.
 * Anything that would leave fewer than three letters is left alone, so "ad"
 * and "tv" stay themselves.
 */
function foldSuffix(term: string): string {
  const rules: [RegExp, string][] = [
    [/ies$/, "y"],
    [/es$/, ""],
    [/ed$/, ""],
    [/s$/, ""],
  ];
  let folded = term;
  for (const [pattern, replacement] of rules) {
    if (pattern.test(folded)) {
      folded = folded.replace(pattern, replacement);
      break;
    }
  }
  folded = folded.replace(/e$/, "");
  return folded.length >= 3 ? folded : term;
}

/**
 * Whether the query names this value: the whole query, suffix-folded, equals a
 * run of whole words from the value's name or one of its aliases.
 *
 * Matching a *run* rather than the whole name is what lets "70mm" find both
 * "70mm" and "IMAX 70mm".
 */
function namesEntry(needle: string, entry: ValueEntry): boolean {
  const target = foldSuffix(needle);
  return [entry.name, ...(entry.aliases ?? [])].some((name) => {
    const words = normalizeToWords(name);
    for (let start = 0; start < words.length; start += 1) {
      let run = "";
      for (let end = start; end < words.length; end += 1) {
        run += words[end];
        if (foldSuffix(run) === target) return true;
      }
    }
    return false;
  });
}

/** Every vocabulary value the query names, in vocabulary order. */
function findNamedValues(
  needle: string,
  context: SuggestContext,
): { vocabulary: ValueVocabulary; entry: ValueEntry }[] {
  const found: { vocabulary: ValueVocabulary; entry: ValueEntry }[] = [];
  for (const vocabulary of buildVocabularies(context)) {
    for (const entry of vocabulary.entries) {
      if (namesEntry(needle, entry)) found.push({ vocabulary, entry });
    }
  }
  return found;
}

function buildValueMove(vocabulary: ValueVocabulary, entry: ValueEntry): Move {
  return {
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
  };
}

/**
 * Moves that read the query as a filter value rather than a title.
 *
 * Matching is against whole words plus aliases and folded endings, never an
 * edit budget: the words people actually use for a value ("subs", "captioned")
 * are not misspellings of its label, and no distance reaches them.
 *
 * Only the main search box is read this way. The other two fields are already
 * specialist, and a format string typed into performance notes is a legitimate
 * note search rather than a mistake.
 */
function buildValueMoves(state: FilterState, context: SuggestContext): Move[] {
  const needle = normalizeForSearch(get(state, FilterId.Search).trim());
  if (needle.length === 0) return [];

  return findNamedValues(needle, context).map(({ vocabulary, entry }) =>
    buildValueMove(vocabulary, entry),
  );
}

/**
 * Moves that read the query as naming a person rather than a film. The tiers
 * and ordering live in {@link resolvePeopleQuery}; two results are a pair and
 * share a `pairId` so the round-one cut cannot split them.
 */
function buildPeopleMoves(state: FilterState, context: SuggestContext): Move[] {
  if (!context.people) return [];
  const needle = normalizeForSearch(get(state, FilterId.Search).trim());
  if (needle.length === 0) return [];

  const resolved = resolvePeopleQuery(needle, context.people);
  const pairId = resolved.length > 1 ? `people:${needle}` : undefined;

  return resolved.map(({ person, group }) => ({
    id: `filter:${group.filterId}:${person.id}`,
    kind: "filter" as const,
    // "Show films directed by Martin Scorsese" reads as an instruction where a
    // bare "Show Martin Scorsese" reads as a billing.
    action: `Show ${group.headlineNoun} ${group.verb} ${person.name}`,
    label: group.label,
    soloOnly: false,
    ...(pairId ? { pairId } : {}),
    // The query was the person's name, so it leaves the search box with them.
    altersQuery: true,
    writes: [FilterId.Search, group.filterId],
    transform: (current: FilterState) =>
      set(set(current, FilterId.Search, ""), group.filterId, [person.id]),
    describeResult: () => person.name,
  }));
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
 * Moves that clear an original venue title or performance note query sitting
 * alongside a film title query.
 *
 * Every text field narrows independently, so a film has to match all of them
 * at once — and the second box is rarely filled in with that in mind. It is
 * usually left over: typed earlier, or put there by taking a redirect offer,
 * and still in force when the reader goes back to the main box and searches
 * for something else. Nothing on the grid says the old query is still there,
 * so the new one simply comes up empty.
 *
 * This is the one place the films grid gives up a query rather than
 * redirecting it. The film title is what was typed last, so it is the one to
 * keep; the other field is the likelier mistake. A redirect can't help, since
 * the query has nowhere empty left to go. It leads the offer, because it
 * discards something the reader typed and they need to agree to that, and it
 * names the films it brings back since the headline no longer does.
 */
function buildStaleQueryMoves(state: FilterState): Move[] {
  if (get(state, FilterId.Search).trim().length === 0) return [];

  return REDIRECT_FIELDS.filter((field) => field.id !== FilterId.Search)
    .flatMap((field) => buildQueryDropMoves(state, [field]))
    .map((move) => ({
      ...move,
      altersQuery: true,
      describeResult: (result: MoviesRecord) =>
        formatList(
          Object.values(result).map((movie) => `“${movie.title}”`),
          2,
        ),
    }));
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

/** How many alternative titles to put forward at most. */
const MAX_CORRECTIONS = 2;

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
 *
 * Candidates the current filters could not reach within one widening are
 * dropped before the cut — see {@link correctionReach}.
 */
function findNearMissTitles(
  movies: MoviesRecord,
  state: FilterState,
  widens: Move[],
): string[] {
  const query = get(state, FilterId.Search).trim();
  const needle = normalizeForSearch(query);
  if (needle.length < MIN_FUZZY_LENGTH) return [];

  const maxDistance = editBudgetFor(needle);

  const catalogue = Object.values(movies);

  // Settle "is this even a typo?" before pricing anything, so the distance work
  // is never done and thrown away. The saving is smaller than it looks — this
  // scan is itself the bulk of the cost on a correctly spelled query, being the
  // same work the search filter has already done — but no result should depend
  // on where in the catalogue the matching title happens to sit.
  for (const movie of catalogue) {
    if (matchesSearchQuery(movie.title, needle)) return [];
  }

  // Widenings a correction can be paired with. Accessibility never pairs, so
  // a film only it hides is out of reach.
  const pairableWidens = widens.filter((move) => !move.soloOnly);

  const matches: {
    title: string;
    distance: number;
    reach: number;
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

    const reach = correctionReach(movie, state, pairableWidens);
    if (reach === null) continue;

    let soonest = Infinity;
    for (const performance of movie.performances) {
      if (performance.time < soonest) soonest = performance.time;
    }

    matches.push({
      title: movie.title,
      distance,
      reach,
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
  //
  // Reach comes before either: a film the current filters already show is a
  // one-change offer, one that needs a widening costs two, and only two are
  // ever offered. Ranking on screenings alone let "mark h" spend both slots on
  // a festival outside the date window and a talk no pair could reach, while
  // "Sherman's March", on this week, was never looked at.
  matches.sort(
    (a, b) =>
      a.distance - b.distance ||
      a.reach - b.reach ||
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
 * How many filter changes a correction to this film costs on top of the
 * rewrite itself: 0 when the current filters already show it, 1 when a single
 * widening does, and null when nothing within the engine's two-change limit
 * reaches it — a candidate that could only ever be probed and discarded.
 *
 * Runs the pipeline over this one film rather than the dataset, since only
 * whether *it* survives matters here, so pricing every candidate stays cheap.
 */
function correctionReach(
  movie: MoviesRecord[string],
  state: FilterState,
  widens: Move[],
): number | null {
  const single: MoviesRecord = { [movie.id]: movie };
  const corrected = set(state, FilterId.Search, movie.title);
  if (Object.keys(apply(single, corrected)).length > 0) return 0;
  for (const widen of widens) {
    if (Object.keys(apply(single, widen.transform(corrected))).length > 0) {
      return 1;
    }
  }
  return null;
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
  widens: Move[],
): Move[] {
  if (get(state, FilterId.Search).trim().length === 0) return [];

  return findNearMissTitles(movies, state, widens).map((title) => ({
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
  people,
}: SuggestOptions): FilterSuggestion[] {
  const context: SuggestContext = { categories, venues, genres, people };

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
  // nothing but only move the query; corrections rewrite it; clearing a stale
  // second query gives up words the reader typed, but ones they have likely
  // forgotten about, so it still beats giving up a filter; widenings come last.
  const widens = buildWidenMoves(state, context);
  const moves = [
    ...buildValueMoves(state, context),
    ...buildPeopleMoves(state, context),
    ...buildRedirectMoves(state),
    ...buildCorrectionMoves(movies, state, widens),
    ...buildStaleQueryMoves(state),
    ...widens,
  ];
  if (moves.length === 0) return [];

  return findOffers(moves, limit, maxProbes, (combination) => {
    const candidate = combine(state, combination);
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
  });
}

/** The state a combination of moves produces, applied in order. */
function combine(state: FilterState, combination: Move[]): FilterState {
  return combination.reduce((result, move) => move.transform(result), state);
}

/**
 * The search itself, shared by the films grid and the film page so the two can
 * only differ in which moves they consider and how an offer is phrased — never
 * in the order offers come in, how far the search goes, or which combinations
 * it refuses.
 *
 * `evaluate` probes one combination and returns its offer, or null when it
 * reveals nothing. Every call counts against `maxProbes`.
 */
function findOffers(
  moves: Move[],
  limit: number,
  maxProbes: number,
  evaluate: (combination: Move[]) => FilterSuggestion | null,
): FilterSuggestion[] {
  let probes = 0;
  const probe = (combination: Move[]): FilterSuggestion | null => {
    if (probes >= maxProbes) return null;
    probes += 1;
    return evaluate(combination);
  };

  // Round one — a single change. `moves` is already in cost order, so the first
  // hits are also the cheapest.
  const suggestions: FilterSuggestion[] = [];
  const worksAlone = new Set<string>();

  // Whether the move after this one completes the same pair. Paired moves are
  // built adjacent, so this only has to look one ahead.
  const partnerFollows = (index: number) => {
    const pairId = moves[index]?.pairId;
    return !!pairId && moves[index + 1]?.pairId === pairId;
  };

  for (let index = 0; index < moves.length; index += 1) {
    const move = moves[index];
    const suggestion = probe([move]);
    if (suggestion) {
      suggestions.push(suggestion);
      worksAlone.add(move.id);
    }
    // Cutting a pair would present its first half as the answer when the whole
    // point is that we don't know which was meant, so the limit gives way by
    // one instead. Only ever by one, since a pair is two moves.
    if (suggestions.length >= limit && !partnerFollows(index)) {
      return suggestions;
    }
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
      const suggestion = probe([pairable[i], pairable[j]]);
      if (suggestion) suggestions.push(suggestion);
      if (suggestions.length >= limit) return suggestions;
    }
  }

  return suggestions;
}

export interface ShowingSuggestOptions extends Omit<SuggestContext, "people"> {
  /** The film whose page this is, with every performance it has. */
  movie: Movie;
  state: FilterState;
  /** Maximum offers to return. */
  limit?: number;
  /** Hard ceiling on filter-pipeline passes, as for the films grid. */
  maxProbes?: number;
}

/**
 * The film-page counterpart to {@link suggestFilterRelaxations}: when the
 * filters hide every showing of the film being looked at, the changes that
 * would bring some back, each with the number of showings it reveals.
 *
 * Only widenings apply. Every other kind of move answers "your query named the
 * wrong thing", and on a film page the subject is fixed — there is no other
 * film to redirect to, correct towards or read a filter value out of. For the
 * same reason a query is widened here rather than redirected: whatever was
 * typed, it was not a search for this page, which the reader has already
 * found.
 *
 * Counts are showings, not films. Measured in films every offer would read
 * "1 result" and name the film the reader is already looking at.
 *
 * Returns nothing when the film already has showings under the state given.
 * The "Show all" button is the reset beyond the two changes the engine stops
 * at, so there is nothing to add when nothing within two changes works.
 */
export function suggestShowingRelaxations({
  movie,
  state,
  limit = 3,
  maxProbes = 40,
  categories,
  venues,
  genres,
}: ShowingSuggestOptions): FilterSuggestion[] {
  const context: SuggestContext = { categories, venues, genres };
  const movies: MoviesRecord = { [movie.id]: movie };

  const countShowings = (result: MoviesRecord) =>
    result[movie.id]?.performances.length ?? 0;

  if (countShowings(apply(movies, state)) > 0) return [];

  const widens = buildWidenMoves(state, context);
  // Dropping a query is cheaper than giving up an accessibility requirement,
  // which stays last on its own terms.
  const accessibility = widens.filter((move) => move.soloOnly);
  const moves = [
    ...widens.filter((move) => !move.soloOnly),
    ...buildQueryDropMoves(state),
    ...accessibility,
  ];
  if (moves.length === 0) return [];

  return findOffers(moves, limit, maxProbes, (combination) => {
    const candidate = combine(state, combination);
    const filtered = apply(movies, candidate);
    const count = countShowings(filtered);
    if (count === 0) return null;

    // The catalogue names the films an offer reveals, but here that is the
    // film already on screen. The actions themselves are the instruction, and
    // the change lines beneath carry what they reveal.
    const headline = combination
      .map((move, index) =>
        index === 0 ? move.action : lowerFirst(move.action),
      )
      .join(" and ");

    return {
      id: combination.map((move) => move.id).join("+"),
      kind: "widen",
      headline,
      changes: buildChanges(combination, headline, filtered),
      count,
      state: candidate,
    };
  });
}

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

/**
 * Moves that clear a text query. On the film page any query can go; the films
 * grid only drops one sitting beside a film title query
 * ({@link buildStaleQueryMoves}) and otherwise redirects. A search left over from the grid
 * ("alien", or "Q&A" in performance notes) can hide every showing of the film the reader went on to
 * open, and nothing but a reset would otherwise say so.
 */
function buildQueryDropMoves(
  state: FilterState,
  fields = REDIRECT_FIELDS,
): Move[] {
  return fields.flatMap((field) => {
    const query = get(state, field.id).trim();
    if (query.length === 0) return [];

    return [
      {
        id: `drop:${field.id}`,
        kind: "widen" as const,
        action: `Clear the ${field.label.toLowerCase()} search for “${query}”`,
        label: `Any ${field.label.toLowerCase()}`,
        soloOnly: false,
        altersQuery: false,
        writes: [field.id],
        transform: (current: FilterState) => set(current, field.id, ""),
      },
    ];
  });
}

export interface FilterValueOfferOptions extends Pick<
  SuggestContext,
  "categories" | "genres"
> {
  movies: MoviesRecord;
  state: FilterState;
  /** How many films the grid is showing for `state`. */
  shownCount: number;
  /** Maximum offers to return. */
  limit?: number;
}

/**
 * Offers to read the query as a filter value when it matched some titles too —
 * "horror" finding two films with the word in their name, when what was meant
 * was the genre.
 *
 * The companion to the filter-value move in {@link suggestFilterRelaxations},
 * which only runs once the grid is empty and so never hears about a word that
 * happens to appear in a title. Here the search worked, so the offer is a
 * question rather than a rescue, and it is only made when taking it returns
 * more films than the grid already shows: when the titles are the bigger
 * answer, they were probably what was meant.
 *
 * Two kinds of value are never offered, because the reader already has them:
 * one the filter has selected, and a format's "nothing special" default
 * (Digital, Normal, 2D). People are left out too — a name rarely matches a
 * title, so the empty-grid path already catches it.
 */
export function getFilterValueOffers({
  movies,
  state,
  shownCount,
  limit = 2,
  categories,
  genres,
}: FilterValueOfferOptions): FilterSuggestion[] {
  if (shownCount === 0) return [];
  const needle = normalizeForSearch(get(state, FilterId.Search).trim());
  if (needle.length === 0) return [];

  const offers: FilterSuggestion[] = [];

  for (const { vocabulary, entry } of findNamedValues(needle, {
    categories,
    genres,
  })) {
    if (entry.isDefault) continue;
    const selected = get(state, vocabulary.filterId) as string[] | null;
    if (selected?.includes(entry.value)) continue;

    const move = buildValueMove(vocabulary, entry);
    const candidate = move.transform(state);
    const result = apply(movies, candidate);
    const count = Object.keys(result).length;
    if (count <= shownCount) continue;

    const headline = buildHeadline([move], result);
    offers.push({
      id: move.id,
      kind: move.kind,
      headline,
      changes: buildChanges([move], headline, result),
      count,
      state: candidate,
    });
    if (offers.length >= limit) break;
  }

  return offers;
}
