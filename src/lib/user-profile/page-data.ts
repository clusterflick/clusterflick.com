import { getHandleProblem } from ".";

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

export type ProfileFilm = {
  id: string;
  title: string;
  year?: string;
  posterPath?: string;
};

/** The list's size, and its most recently added films. */
export type ProfileList = { count: number; films: ProfileFilm[] };

export type ProfilePageData =
  | { found: true; handle: string; seen: ProfileList; watchlist: ProfileList }
  /** `handle` only when the address held a valid one. */
  | { found: false; handle?: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseList(value: unknown): ProfileList {
  if (!isRecord(value)) return { count: 0, films: [] };
  const films = (Array.isArray(value.films) ? value.films : []).flatMap(
    (film: unknown): ProfileFilm[] =>
      isRecord(film) &&
      typeof film.id === "string" &&
      typeof film.title === "string"
        ? [
            {
              id: film.id,
              title: film.title,
              ...(typeof film.year === "string" && { year: film.year }),
              ...(typeof film.posterPath === "string" && {
                posterPath: film.posterPath,
              }),
            },
          ]
        : [],
  );
  const count = typeof value.count === "number" ? value.count : films.length;
  return { count: Math.max(count, films.length), films };
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
    return {
      found: true,
      handle,
      seen: parseList(value.seen),
      watchlist: parseList(value.watchlist),
    };
  }
  return handle ? { found: false, handle } : { found: false };
}
