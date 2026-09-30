import { FILM_CLUBS } from "@/data/film-clubs";
import { FESTIVALS } from "@/data/festivals";
import { FilterId, FilterModule, FilterState, MoviesRecord } from "../types";
import { unionMatches, type MatchAny } from "../match-any";

/** The two programme filter IDs. Each reads one registry. */
export type ProgrammeFilterId = FilterId.FilmClubs | FilterId.Festivals;

/** What a programme filter needs from a registry entry. */
export type Programme = {
  id: string;
  name: string;
  aliases: string[];
  matchers: Partial<FilterState>[];
};

export type ProgrammeGroupConfig = {
  filterId: ProgrammeFilterId;
  /** The registry the selection's ids are looked up in. */
  programmes: readonly Programme[];
  /** Section heading shown in the filter overlay. */
  title: string;
  /** Singular and plural, for the quick-add and filter description copy. */
  singular: string;
  plural: string;
  /** URL query param used when sharing filters. */
  urlParam: string;
  /** Reads as a clause after the films: "… from Cinebug". */
  verb: string;
};

/**
 * Config for both programme groups, shared by the filter modules (below), the
 * filter description and the suggestion engine so the two stay in step.
 *
 * Two filters rather than one because clubs and festivals are different kinds
 * of thing — a club recurs with no end, a festival is a bounded event — and
 * the rest of the site keeps them apart. Like directors and cast, a selection
 * within one is "or" and the two together are "and": a club's screenings that
 * are part of a festival.
 */
export const PROGRAMME_GROUPS: ProgrammeGroupConfig[] = [
  {
    filterId: FilterId.FilmClubs,
    programmes: FILM_CLUBS,
    title: "Film Clubs",
    singular: "film club",
    plural: "film clubs",
    urlParam: "filmClubs",
    verb: "from",
  },
  {
    filterId: FilterId.Festivals,
    programmes: FESTIVALS,
    title: "Festivals",
    singular: "festival",
    plural: "festivals",
    urlParam: "festivals",
    verb: "at",
  },
];

/** A programme's display name; some registry names carry stray whitespace. */
export function getProgrammeName(programme: Programme): string {
  return programme.name.trim();
}

/**
 * Builds a filter module that restricts the grid to the showings of the
 * selected clubs or festivals.
 *
 * The selection holds registry ids, never film ids, so it follows the
 * programme as the listings change: a link made today picks up next month's
 * screenings with no change to the link. Each programme's matchers are run by
 * `match` — the pipeline over a permissive state, injected by the manager
 * because it *is* the manager — and the selected programmes' slices are
 * unioned per movie, as a single programme's matchers are.
 *
 * `[]` means *no filter*, as for the films and people filters, and ids the
 * registry doesn't hold are kept rather than pruned: a festival leaving the
 * registry between editions is the same case as a film finishing its run. They
 * match nothing meanwhile.
 *
 * Results are memoised per input record and selection, so a later filter in
 * the pipeline — the other programme filter above all, whose own cache is
 * keyed on the record handed to it — sees the same record on every pass.
 */
export function buildProgrammeFilter(
  group: ProgrammeGroupConfig,
  match: MatchAny,
): FilterModule<ProgrammeFilterId> {
  const byId = new Map(group.programmes.map((p) => [p.id, p]));
  const cache = new WeakMap<MoviesRecord, Map<string, MoviesRecord>>();

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
      return ids.length > 0 ? [...new Set(ids)] : null;
    },

    apply: (movies: MoviesRecord, state: FilterState): MoviesRecord => {
      const selected = state[group.filterId];
      if (!selected || selected.length === 0) return movies;

      const key = [...selected].sort().join(",");
      let byKey = cache.get(movies);
      if (!byKey) {
        byKey = new Map();
        cache.set(movies, byKey);
      }

      let result = byKey.get(key);
      if (!result) {
        const slices = selected
          .map((id) => byId.get(id))
          .filter((programme): programme is Programme => !!programme)
          .map((programme) => match(programme.matchers, movies));
        result = slices.length === 1 ? slices[0] : unionMatches(slices, movies);
        byKey.set(key, result);
      }
      return result;
    },
  };
}

/**
 * The link that opens a page filtered to one club or festival — what a club or
 * festival page's "Explore" and "Plan" buttons point at.
 *
 * `base=all`, as for a person link: clubs are often listed as events, which
 * the default categories hide, and a club meeting monthly would show nothing
 * in the today→+7d default most weeks.
 */
export function getProgrammeFilterUrl(
  path: "/catalogue" | "/planner",
  filterId: ProgrammeFilterId,
  programmeId: string,
): string {
  const group = PROGRAMME_GROUPS.find((g) => g.filterId === filterId)!;
  return `${path}?base=all&${group.urlParam}=${encodeURIComponent(programmeId)}`;
}
