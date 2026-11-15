import { decodeValue, type Value } from "./firestore";

/**
 * A reader's lists, favourite venues and film details, decoded from
 * Firestore's REST values as the site reads them: its `UserListEntry`,
 * `FavouriteVenues` and `FilmDetailsData`, which `parseProfilePageData`
 * (src/lib/user-profile/page-data.ts) reads with the same rules. Change the
 * two together: both are in the site's repo.
 *
 * What can't be read is dropped rather than guessed at: an entry with no
 * title, a venue with no name. `users/{uid}` holds `watchlist`, `seen` and
 * `favouriteVenues`; `users/{uid}/meta/films` holds `films` and `people`.
 */
export type ListEntry = {
  title: string;
  year?: string;
  posterPath?: string;
  /** Epoch milliseconds. */
  addedAt: number;
};

export type List = Record<string, ListEntry>;

export type FavouriteVenue = { name: string; addedAt: number };

export type FilmDetails = {
  genres: string[];
  directors: string[];
  cast: string[];
  /** Minutes. */
  runtime?: number;
  /** ISO 639-1 code of the original language. */
  language?: string;
};

export type FilmDetailsData = {
  films: Record<string, FilmDetails>;
  people: Record<string, string>;
};

type Entry = Record<string, unknown>;

function isRecord(value: unknown): value is Entry {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const decoded = (value: Value | undefined) =>
  value === undefined ? undefined : decodeValue(value);

/** Each entry of a map that `parse` can read, by key; the rest are dropped. */
function readMap<T>(
  value: unknown,
  parse: (entry: Entry) => T | null,
): Record<string, T> {
  if (!isRecord(value)) return {};
  const map: Record<string, T> = {};
  for (const [key, entry] of Object.entries(value)) {
    const parsed = isRecord(entry) ? parse(entry) : null;
    if (parsed !== null) map[key] = parsed;
  }
  return map;
}

const optionalString = (key: string, value: unknown) =>
  typeof value === "string" ? { [key]: value } : {};

const addedAt = (entry: Entry) =>
  typeof entry.addedAt === "number" ? entry.addedAt : 0;

/** A list entry needs a title to be drawn; anything else it lacks is left off. */
function readListEntry(entry: Entry): ListEntry | null {
  if (typeof entry.title !== "string") return null;
  return {
    title: entry.title,
    ...optionalString("year", entry.year),
    ...optionalString("posterPath", entry.posterPath),
    addedAt: addedAt(entry),
  };
}

export const readList = (value: Value | undefined): List =>
  readMap(decoded(value), readListEntry);

export const readFavouriteVenues = (
  value: Value | undefined,
): Record<string, FavouriteVenue> =>
  readMap(decoded(value), (entry) =>
    typeof entry.name === "string"
      ? { name: entry.name, addedAt: addedAt(entry) }
      : null,
  );

const strings = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];

function readFilmDetailsEntry(entry: Entry): FilmDetails {
  return {
    genres: strings(entry.genres),
    directors: strings(entry.directors),
    cast: strings(entry.cast),
    ...(typeof entry.runtime === "number" && { runtime: entry.runtime }),
    ...optionalString("language", entry.language),
  };
}

/**
 * The details of the films on the Seen list, and the names of the people
 * credited on them. The document can hold details for films no longer on any
 * list (removing a film leaves them behind), and the page only reads them for
 * the Seen stats, so the rest are left out.
 */
export function readFilmDetails(
  films: Value | undefined,
  people: Value | undefined,
  seen: List,
): FilmDetailsData {
  const all = readMap(decoded(films), readFilmDetailsEntry);
  const kept: Record<string, FilmDetails> = {};
  const credited = new Set<string>();
  for (const id of Object.keys(seen)) {
    const film = all[id];
    if (!film) continue;
    kept[id] = film;
    for (const person of [...film.directors, ...film.cast]) {
      credited.add(person);
    }
  }
  const names = decoded(people);
  const keptPeople: Record<string, string> = {};
  if (isRecord(names)) {
    for (const id of credited) {
      const name = names[id];
      if (typeof name === "string") keptPeople[id] = name;
    }
  }
  return { films: kept, people: keptPeople };
}
