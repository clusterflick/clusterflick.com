import { Movie } from "@/types";
import { FilterId, FilterModule, FilterState, MoviesRecord } from "../types";
import { normalizeToWords } from "../normalize";

/** The two people filter IDs. Each reads one credit list on the movie. */
export type PeopleFilterId = FilterId.Directors | FilterId.Cast;

/** The `movie` key a group reads. */
type CreditKey = "directors" | "actors";

export type PeopleGroupConfig = {
  filterId: PeopleFilterId;
  key: CreditKey;
  /** Section heading shown in the filter overlay. */
  title: string;
  /** Singular, for the quick-add placeholder and empty copy. */
  singular: string;
  /** URL query param used when sharing filters. */
  urlParam: string;
  /** Names the dimension in a filter description or suggestion change line. */
  label: string;
  /** Reads as a clause after the films: "… directed by Agnès Varda". */
  verb: string;
  /** Completes a suggestion headline: `Show films ${verb} X`. */
  headlineNoun: string;
};

/**
 * Config for both people groups. Shared by the filter modules (below), the
 * vocabulary builder, the overlay UI, the filter description and the
 * suggestion engine, so the two stay in step.
 *
 * Unlike the format groups, the option lists are *not* a fixed schema enum —
 * they are derived from whatever is currently screening, because there is no
 * meaningful universe of people beyond that. See `getPeopleVocabulary`.
 *
 * The cast group reads `movie.actors` while calling itself "Cast": `actors` is
 * the pipeline's name for the field (the top ten billed, as the combine stage
 * writes it), and "Cast" is what a reader calls it.
 */
export const PEOPLE_GROUPS: PeopleGroupConfig[] = [
  {
    filterId: FilterId.Directors,
    key: "directors",
    title: "Directors",
    singular: "director",
    urlParam: "directors",
    label: "Director",
    verb: "directed by",
    headlineNoun: "films",
  },
  {
    filterId: FilterId.Cast,
    key: "actors",
    title: "Cast",
    singular: "cast member",
    urlParam: "cast",
    label: "Cast",
    verb: "starring",
    headlineNoun: "films",
  },
];

/**
 * Builds a filter module for one credit list.
 *
 * `[]` means *no filter*, unlike the genres module which shares this shape: a
 * typeahead has no Select All, so an empty selection is just what removing the
 * last name leaves behind, and emptying the grid there is a trap with no way
 * out. `fromUrlParams` normalises it to `null` so an empty `?directors=` never
 * reports itself restrictive while filtering nothing.
 */
function buildPeopleFilter(
  group: PeopleGroupConfig,
): FilterModule<PeopleFilterId> {
  return {
    id: group.filterId,

    getDefault: () => null,

    get: (state: FilterState) => state[group.filterId],

    set: (state: FilterState, value: string[] | null): FilterState => ({
      ...state,
      [group.filterId]: value,
    }),

    hasActiveFilter: (state: FilterState): boolean => {
      const value = state[group.filterId];
      return !!value && value.length > 0;
    },

    toUrlParams: (state: FilterState, params: URLSearchParams) => {
      const value = state[group.filterId];
      if (!value || value.length === 0) return;
      params.set(group.urlParam, value.join(","));
    },

    fromUrlParams: (params: URLSearchParams) => {
      if (!params.has(group.urlParam)) return undefined;
      const ids = params
        .get(group.urlParam)!
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      return ids.length > 0 ? ids : null;
    },

    apply: (movies: MoviesRecord, state: FilterState): MoviesRecord => {
      const selected = state[group.filterId];
      if (!selected || selected.length === 0) return movies;

      const selectedSet = new Set(selected);
      const result: MoviesRecord = {};

      for (const [id, movie] of Object.entries(movies)) {
        const credits = movie[group.key] ?? [];
        if (credits.some((personId) => selectedSet.has(personId))) {
          result[id] = movie;
        }
      }

      return result;
    },
  };
}

export const directorsFilter = buildPeopleFilter(PEOPLE_GROUPS[0]);
export const castFilter = buildPeopleFilter(PEOPLE_GROUPS[1]);

/** One selectable person, with how many of the given films they are credited on. */
export type PersonOption = {
  id: string;
  name: string;
  /** Films in the dataset this person is credited on, for this group. */
  count: number;
  /**
   * TheMovieDB popularity as a 0-99 percentile rank, when the release carries
   * one. Used only to order two people a query could equally have named.
   */
  popularity?: number;
};

/**
 * The people worth offering, per group, best represented first.
 *
 * Derived from the films rather than the `people` lookup, which is a flat
 * `{ id, name }` map carrying no role — folding the credit lists is the only
 * way to tell who directed from who appeared, and it yields the film count too.
 */
export function getPeopleVocabulary(
  movies: Record<string, Movie>,
  people: Record<string, { name: string; p?: number }> | null,
): Record<PeopleFilterId, PersonOption[]> {
  const counts: Record<string, Map<string, number>> = {};
  for (const group of PEOPLE_GROUPS) counts[group.filterId] = new Map();

  for (const movie of Object.values(movies)) {
    for (const group of PEOPLE_GROUPS) {
      const tally = counts[group.filterId];
      // A person credited twice on one film still only screens once.
      for (const personId of new Set(movie[group.key] ?? [])) {
        tally.set(personId, (tally.get(personId) ?? 0) + 1);
      }
    }
  }

  const result = {} as Record<PeopleFilterId, PersonOption[]>;
  for (const group of PEOPLE_GROUPS) {
    result[group.filterId] = [...counts[group.filterId].entries()]
      // A credit with no entry in the lookup cannot be labelled, and an
      // unnamed row in a typeahead is unpickable rather than merely untidy.
      .flatMap(([id, count]) => {
        const person = people?.[id];
        if (!person?.name) return [];
        return [
          {
            id,
            name: person.name,
            count,
            ...(typeof person.p === "number" ? { popularity: person.p } : {}),
          },
        ];
      })
      // Most credited first: the reader scanning for "Scorsese" wants the one
      // with twelve films on, and ties fall back to something stable.
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }

  return result;
}

/** The people a single query fragment names, split by the role they hold. */
export type PeopleMatch = {
  directors: PersonOption[];
  cast: PersonOption[];
};

/**
 * Every whole-word run of every name, mapped to the people who claim it.
 *
 * Keyed as `normalizeForSearch` renders a query, which is exact because
 * `normalizeToWords(s).join("") === normalizeForSearch(s)` — so a lookup is the
 * whole-word-run comparison it replaces, at O(1) rather than a scan of 12,000
 * names per suggestion pass.
 */
export type PeopleIndex = Map<string, PeopleMatch>;

export function buildPeopleIndex(
  groups: Record<PeopleFilterId, PersonOption[]>,
): PeopleIndex {
  const index: PeopleIndex = new Map();

  const add = (person: PersonOption, key: keyof PeopleMatch) => {
    const words = normalizeToWords(person.name);
    // "John John" would otherwise claim the same run twice and read as two
    // people to anything counting matches.
    const seen = new Set<string>();
    for (let start = 0; start < words.length; start += 1) {
      let run = "";
      for (let end = start; end < words.length; end += 1) {
        run += words[end];
        if (seen.has(run)) continue;
        seen.add(run);
        let match = index.get(run);
        if (!match) {
          match = { directors: [], cast: [] };
          index.set(run, match);
        }
        match[key].push(person);
      }
    }
  };

  for (const person of groups[FilterId.Directors]) add(person, "directors");
  for (const person of groups[FilterId.Cast]) add(person, "cast");

  return index;
}

/** One person a query named, and the filter that would select them. */
export type ResolvedPerson = {
  person: PersonOption;
  group: PeopleGroupConfig;
};

/**
 * The people a query names, in the order they should be offered — or nothing,
 * when it names too many to be naming anyone.
 *
 * A name is a weaker signal than a format string: most of a people vocabulary
 * is forenames held in common, so a fragment is read as a name only when it
 * picks out one person per role. Unique in one role wins; unique in both offers
 * both, since only the reader knows which of two people they meant; ambiguous
 * in both offers nothing. Two roles held by the same *name* — compared by name,
 * not id, because TheMovieDB carries duplicate person records — is one person
 * answering for two sets of films, so both are offered there too.
 *
 * Ordering is films showing, then popularity, then director. See "Zero-Result
 * Suggestions" in CLAUDE.md for the measurements behind each of these.
 */
export function resolvePeopleQuery(
  /** The query, already through `normalizeForSearch` — spaces and all. */
  needle: string,
  index: PeopleIndex,
): ResolvedPerson[] {
  const match = index.get(needle);
  if (!match) return [];

  const director =
    match.directors.length === 1 ? match.directors[0] : undefined;
  const castMember = match.cast.length === 1 ? match.cast[0] : undefined;

  const resolved: ResolvedPerson[] = [];
  if (director) resolved.push({ person: director, group: PEOPLE_GROUPS[0] });
  if (castMember)
    resolved.push({ person: castMember, group: PEOPLE_GROUPS[1] });

  return resolved.sort((a, b) => {
    if (a.person.count !== b.person.count)
      return b.person.count - a.person.count;
    const aPopularity = a.person.popularity ?? -1;
    const bPopularity = b.person.popularity ?? -1;
    if (aPopularity !== bPopularity) return bPopularity - aPopularity;
    return a.group === PEOPLE_GROUPS[0] ? -1 : 1;
  });
}
