import type { Movie } from "@/types";
import type { UserListEntry } from "./index";
import type { FilmDetailsData } from "./film-details";

/** People shown per ranking: a favourite, not a census. */
const TOP_PEOPLE = 5;
/** A ranking of one film each says nothing, so a person needs this many. */
const MIN_PERSON_FILMS = 2;

export type RankedPerson = { id: string; name: string; count: number };
export type GenreCount = { id: string; name: string; count: number };
export type LanguageCount = { code: string; count: number };
export type DecadeCount = { decade: number; count: number };

export type SeenRecord = {
  id: Movie["id"];
  entry: UserListEntry;
  /** Minutes, for the runtime records. */
  runtime?: number;
};

export type SeenStats = {
  /** Films on the Seen list. */
  films: number;
  /** Of those, how many have details. The rest are unmatched. */
  withDetails: number;
  /** Total running time, in whole hours. */
  hours: number;
  /** Distinct directors across the films. */
  directors: number;
  languages: LanguageCount[];
  records: {
    longest?: SeenRecord;
    shortest?: SeenRecord;
    oldest?: SeenRecord;
    newest?: SeenRecord;
  };
  topDirectors: RankedPerson[];
  topCast: RankedPerson[];
  genres: GenreCount[];
  /** Every decade from the oldest film's to the newest's, gaps included. */
  decades: DecadeCount[];
};

/** Most first, then by name, so ties read in a stable, sensible order. */
const byCountThenName =
  <T extends { count: number }>(name: (item: T) => string) =>
  (a: T, b: T) =>
    b.count - a.count || name(a).localeCompare(name(b));

function count(ids: Iterable<string>) {
  const counts = new Map<string, number>();
  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  return counts;
}

function rankPeople(
  counts: Map<string, number>,
  people: FilmDetailsData["people"],
): RankedPerson[] {
  return [...counts]
    .filter(([id, n]) => n >= MIN_PERSON_FILMS && people[id])
    .map(([id, n]) => ({ id, name: people[id], count: n }))
    .sort(byCountThenName((person) => person.name))
    .slice(0, TOP_PEOPLE);
}

/** The year a list entry gives, when it gives a usable one. */
function getYear(entry: UserListEntry) {
  const year = Number(entry.year);
  return Number.isInteger(year) && year > 1800 ? year : undefined;
}

/**
 * Stats on the reader's Seen list. Years come from each list entry, so every
 * film counts towards the decades; everything else from the films' details,
 * so a film without them (an unmatched one) is left out of those rather than
 * guessed at. Watch dates aren't used: a list entry's date is when it was
 * added, which for an import is the day of the import.
 *
 * Details for films no longer on the list are ignored, as the document can
 * hold some (see `FilmDetailsData`).
 */
export function getSeenStats(
  seen: Record<Movie["id"], UserListEntry>,
  details: FilmDetailsData,
  genreNames: Record<string, string>,
): SeenStats {
  const ids = Object.keys(seen);
  const films = ids.flatMap((id) =>
    details.films[id] ? [{ id, film: details.films[id] }] : [],
  );
  const title = (record: SeenRecord) => seen[record.id].title;

  const minutes = films.reduce((sum, { film }) => sum + (film.runtime ?? 0), 0);
  const hours = Math.round(minutes / 60);

  const timed = films
    .filter(({ film }) => film.runtime)
    .map(({ id, film }) => ({ id, entry: seen[id], runtime: film.runtime }))
    .sort(
      (a, b) =>
        (a.runtime ?? 0) - (b.runtime ?? 0) || title(a).localeCompare(title(b)),
    );
  const dated = ids
    .filter((id) => getYear(seen[id]) !== undefined)
    .map((id) => ({ id, entry: seen[id] }))
    // Within a year, by when the film went on the list: the year alone left
    // eight 2026 films tied for newest, and the one added most recently is
    // the likelier to be the newest film. A stopgap until a release date is
    // stored; an import adds many at once, which falls back to the title.
    .sort(
      (a, b) =>
        (getYear(a.entry) ?? 0) - (getYear(b.entry) ?? 0) ||
        a.entry.addedAt - b.entry.addedAt ||
        title(a).localeCompare(title(b)),
    );

  const years = dated.map(({ entry }) => getYear(entry) as number);
  const decadeCounts = count(years.map((year) => String(year - (year % 10))));
  const decades: DecadeCount[] = [];
  if (years.length > 0) {
    const first = years[0] - (years[0] % 10);
    const last = years[years.length - 1] - (years[years.length - 1] % 10);
    for (let decade = first; decade <= last; decade += 10) {
      decades.push({ decade, count: decadeCounts.get(String(decade)) ?? 0 });
    }
  }

  return {
    films: ids.length,
    withDetails: films.length,
    hours,
    directors: new Set(films.flatMap(({ film }) => film.directors)).size,
    languages: [...count(films.flatMap(({ film }) => film.language ?? []))]
      .map(([code, n]) => ({ code, count: n }))
      .sort(byCountThenName((language) => language.code)),
    records: {
      shortest: timed[0],
      longest: timed[timed.length - 1],
      oldest: dated[0],
      newest: dated[dated.length - 1],
    },
    topDirectors: rankPeople(
      count(films.flatMap(({ film }) => film.directors)),
      details.people,
    ),
    topCast: rankPeople(
      count(films.flatMap(({ film }) => film.cast)),
      details.people,
    ),
    genres: [...count(films.flatMap(({ film }) => film.genres))]
      .filter(([id]) => genreNames[id])
      .map(([id, n]) => ({ id, name: genreNames[id], count: n }))
      .sort(byCountThenName((genre) => genre.name)),
    decades,
  };
}
