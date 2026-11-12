import { getHandleProblem } from ".";
import {
  type FavouriteVenues,
  type UserListEntry,
  type UserLists,
  UserListId,
} from "@/lib/user-lists";
import type {
  FilmDetails,
  FilmDetailsData,
} from "@/lib/user-lists/film-details";
import { decodeBatchGet } from "./firestore-rest";

/**
 * What the profiles Worker (clusterflick/api-profiles) puts in the
 * `/profile-shell/` page it serves at `/u/<handle>/`, as JSON in a script tag
 * with this id. Its own copy of these types is the one that matters; this
 * reads what arrives defensively, so a Worker change can't break the page.
 */
export const PROFILE_DATA_ELEMENT_ID = "profile-data";

/**
 * The shell's title (before the site's " | Clusterflick") and description.
 * The Worker finds these exact strings and replaces them for a public profile,
 * in the <head> and in the page's inline RSC payload alike: Next re-renders the
 * <head> from that payload after hydration, so both have to agree. Plain text
 * with no quotes or apostrophes, so they read the same in HTML and in JSON.
 */
export const PROFILE_SHELL_TITLE = "Profile Not Found";
export const PROFILE_SHELL_DESCRIPTION = "No public profile at this address.";

/**
 * A public profile: the reader's lists, favourite venues and film details, as
 * `/personalise` has the owner's own.
 */
export type PublicProfile = {
  handle: string;
  lists: UserLists;
  favouriteVenues: FavouriteVenues;
  filmDetails: FilmDetailsData;
};

export type ProfilePageData =
  | ({ found: true } & PublicProfile)
  /** `handle` only when the address held a valid one. */
  | { found: false; handle?: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Each entry of a map that `parse` can read, by key; the rest are dropped. */
function parseMap<T>(
  value: unknown,
  parse: (entry: Record<string, unknown>) => T | null,
): Record<string, T> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, entry]) => {
      const parsed = isRecord(entry) ? parse(entry) : null;
      return parsed === null ? [] : [[key, parsed]];
    }),
  );
}

const optionalString = (key: string, value: unknown) =>
  typeof value === "string" ? { [key]: value } : {};

function parseListEntry(entry: Record<string, unknown>): UserListEntry | null {
  if (typeof entry.title !== "string") return null;
  return {
    title: entry.title,
    ...optionalString("year", entry.year),
    ...optionalString("posterPath", entry.posterPath),
    addedAt: typeof entry.addedAt === "number" ? entry.addedAt : 0,
  };
}

const strings = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];

function parseFilmDetails(entry: Record<string, unknown>): FilmDetails {
  return {
    genres: strings(entry.genres),
    directors: strings(entry.directors),
    cast: strings(entry.cast),
    ...(typeof entry.runtime === "number" && { runtime: entry.runtime }),
    ...optionalString("language", entry.language),
  };
}

/**
 * The Worker's `documents`: Firestore's own answer for `users/{uid}` and
 * `users/{uid}/meta/films`, undecoded, with the uid in their names as `-`.
 */
function parseDocuments(documents: unknown) {
  const decoded = decodeBatchGet(documents);
  const user = decoded["users/-"] ?? {};
  const films = decoded["meta/films"] ?? {};
  return {
    lists: {
      [UserListId.Watchlist]: parseMap(user.watchlist, parseListEntry),
      [UserListId.Seen]: parseMap(user.seen, parseListEntry),
    },
    favouriteVenues: parseMap(user.favouriteVenues, (entry) =>
      typeof entry.name === "string"
        ? {
            name: entry.name,
            addedAt: typeof entry.addedAt === "number" ? entry.addedAt : 0,
          }
        : null,
    ),
    filmDetails: {
      films: parseMap(films.films, parseFilmDetails),
      people: isRecord(films.people)
        ? Object.fromEntries(
            Object.entries(films.people).filter(
              (entry): entry is [string, string] =>
                typeof entry[1] === "string",
            ),
          )
        : {},
    },
  };
}

/**
 * The script tag's contents. No tag at all, as when `/profile-shell/` is
 * visited directly, or anything unreadable, is a profile not found.
 */
export function parseProfilePageData(
  text: string | null | undefined,
): ProfilePageData {
  let value: unknown;
  try {
    value = JSON.parse(text ?? "");
  } catch {
    return { found: false };
  }
  if (!isRecord(value)) return { found: false };
  const handle =
    typeof value.handle === "string" && getHandleProblem(value.handle) === null
      ? value.handle
      : undefined;
  if (value.found === true && handle) {
    return { found: true, handle, ...parseDocuments(value.documents) };
  }
  return handle ? { found: false, handle } : { found: false };
}
