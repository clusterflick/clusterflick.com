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
  /**
   * TheMovieDB popularity as a 0-99 percentile rank, when the release carries
   * one. Used only to order two people a query could equally have named.
   */
  popularity?: number;
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
 * Keyed the way `normalizeForSearch` renders a query — words folded and run
 * together with no separators — because `normalizeToWords(s).join("") ===
 * normalizeForSearch(s)`. A lookup is therefore exactly the comparison
 * `bestWordRunDistance(needle, normalizeToWords(name), 0) === 0` used to make
 * entry by entry, at O(1) instead of a scan of 12,000 names per pass.
 *
 * Built once per dataset and memoised alongside the vocabulary it indexes. The
 * scan it replaces was ~10ms of every suggestion pass once cast was included,
 * paid whether or not anything matched.
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
 * A name is a far weaker signal than a format string. Most of a people
 * vocabulary is forenames held in common ("john" is 27 directors in a live
 * release, "michael" 19), so a fragment is read as a name only when it picks
 * out one person per role. The tiers:
 *
 * 1. Unique in one role and ambiguous or absent in the other → that one. This
 *    is overwhelmingly "unique director, ambiguous cast" (502 fragments against
 *    20 the other way), which is the point: unique among 1,288 directors is a
 *    far stronger claim than unique among 11,070 cast.
 * 2. Unique in both and the names differ → both, since they are two different
 *    people and only the reader knows which they meant. Preferring the director
 *    was measured and is wrong 23 times in 212 — "pacino" is Al Pacino (6
 *    films, cast) far more often than Julie Pacino (1 film, director).
 * 3. Unique in both and the names match → both, being one person in two roles,
 *    each answering for a different set of films. Compared by name rather than
 *    id on purpose: TheMovieDB carries duplicate person records, so John
 *    Carpenter directing and John Carpenter appearing can be two ids, and a
 *    reader cannot tell two identical names apart anyway.
 * 4. Ambiguous in both → nothing. A fragment naming 27 people names none.
 *
 * The needle must already be folded by `normalizeForSearch`, which is how the
 * index is keyed — `normalizeToWords(s).join("") === normalizeForSearch(s)`, so
 * a lookup is exactly the whole-word-run comparison this replaces.
 *
 * Ordering within a pair is by films currently showing, then popularity, then
 * director. Film count leads because it is what the offer actually accounts
 * for — a twelve-film retrospective is the better answer to an ambiguous
 * surname. Popularity settles the rest, which is most of them: of 212 pairs the
 * counts are equal in 165, and there a name's standing is the only signal left.
 * Director breaks a remaining tie, keeping the stronger vocabulary first.
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
