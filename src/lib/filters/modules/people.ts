import { Movie } from "@/types";
import { FilterId, FilterModule, FilterState, MoviesRecord } from "../types";

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
 * The value semantics deliberately differ from the genres filter, which shares
 * the same `string[] | null` shape. Genres are a fixed, fully-enumerated chip
 * list with Select All / Clear All, so `[]` there means "none selected, nothing
 * matches" — a state the reader can reach and undo.
 *
 * People are a typeahead over a thousand-plus names with no "select all" to
 * speak of, so the only two meaningful states are "not filtering" and "these
 * names". `[]` is therefore treated as no filter rather than as a wall: it is
 * what removing the last name leaves behind, and emptying the grid at that
 * point would be a trap with no visible way out.
 *
 * `fromUrlParams` normalises `[]` to `null` for the same reason, so that an
 * empty `?directors=` can never leave the state reporting itself restrictive
 * (and drawing a "widen" suggestion) while filtering nothing.
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
};

/**
 * The people currently worth offering, per group, best represented first.
 *
 * Derived from the films rather than from the `people` lookup, which is a flat
 * `{ id, name }` map carrying no role — it cannot say who directed and who
 * appeared, only who was involved. Folding the credit lists is the only way to
 * split the two, and it doubles as the count shown beside each name.
 *
 * Runs once per dataset, not per keystroke: the whole vocabulary is ~1,300
 * directors and ~11,000 cast, so the fold is cheap but not free.
 */
export function getPeopleVocabulary(
  movies: Record<string, Movie>,
  people: Record<string, { name: string }> | null,
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
        const name = people?.[id]?.name;
        return name ? [{ id, name, count }] : [];
      })
      // Most credited first: the reader scanning for "Scorsese" wants the one
      // with twelve films on, and ties fall back to something stable.
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }

  return result;
}
