/**
 * A reader's IMDb sync, as the sync Worker (clusterflick/api-imdb) writes it
 * and the site reads it: which IMDb user is linked, and the ledger of each
 * night's run. The same shape as the Letterboxd sync's (`./letterboxd`), kept
 * apart because the two are linked, switched on and unlinked separately.
 *
 * - `users/{uid}/meta/imdb` is the link. Only the Worker writes it, after IMDb
 *   has named the user, so what it holds is a user that exists; the reader may
 *   read it, and unlinks by deleting it. `enabled` is always true while it's
 *   there: the nightly run finds readers by it, with the collection-group
 *   index the alerts already use.
 * - `users/{uid}/meta/imdb-ledger` is the Worker's: the reader may read and
 *   delete it, never write it.
 *
 * Anything that can't be read is dropped rather than guessed at, as the lists
 * are.
 */

export const imdbLinkPath = (uid: string) => `users/${uid}/meta/imdb`;
export const imdbLedgerPath = (uid: string) => `users/${uid}/meta/imdb-ledger`;

/**
 * An IMDb user id, the older form: `ur` and digits. It's what IMDb's API
 * reads a user's lists by. The same pattern as a public profile's IMDb link
 * (`isProfileLinks` in `firestore.rules`).
 */
export function isImdbUserId(value: unknown): value is string {
  return typeof value === "string" && /^ur[0-9]{1,12}$/.test(value);
}

/**
 * An IMDb profile id, the newer form in a profile's address: `p.` and
 * lowercase letters and digits. The same pattern as a public profile's.
 */
export function isImdbProfileId(value: unknown): value is string {
  return typeof value === "string" && /^p\.[a-z0-9]{1,40}$/.test(value);
}

/**
 * The IMDb user in what a reader typed or pasted: either id on its own, or a
 * profile's address (`https://www.imdb.com/user/p.…/watchlist/`), or null
 * when there's neither. Checked before anything is sent anywhere.
 */
export function readImdbUser(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (isImdbUserId(text) || isImdbProfileId(text)) return text;
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return null;
  }
  if (!/(^|\.)imdb\.com$/.test(url.hostname)) return null;
  const id = url.pathname.match(/^\/user\/([^/]+)/)?.[1];
  return isImdbUserId(id) || isImdbProfileId(id) ? id : null;
}

/** An IMDb username, as IMDb shows one: shown to the reader, never in a path. */
const MAX_USERNAME_LENGTH = 100;

export type ImdbLink = {
  /** The `ur` id the lists are read by. */
  userId: string;
  /** The `p.` id in the profile's address. */
  profileId: string;
  /** The name IMDb shows, when it gave one. */
  username?: string;
  /** Epoch milliseconds. */
  linkedAt: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** The link as the Worker writes it. */
export function toImdbLinkDocument(link: ImdbLink) {
  return { enabled: true, ...link };
}

/** The link, or null when there's none or it can't be read. */
export function parseImdbLink(data: unknown): ImdbLink | null {
  if (!isRecord(data) || data.enabled !== true) return null;
  const { userId, profileId, username, linkedAt } = data;
  if (!isImdbUserId(userId) || !isImdbProfileId(profileId)) return null;
  if (typeof linkedAt !== "number") return null;
  return {
    userId,
    profileId,
    ...(typeof username === "string" &&
      username.length > 0 &&
      username.length <= MAX_USERNAME_LENGTH && { username }),
    linkedAt,
  };
}

/** What one night's run did for a reader. */
export const ImdbRunOutcome = Object.freeze({
  /** Films were added; `added` says how many to each list. */
  Synced: "synced",
  /** Read, and everything was already on the lists. */
  NothingNew: "nothingNew",
  /** Not run: the capability is gone. */
  Skipped: "skipped",
  /** Couldn't be done; `reason` says why. */
  Failed: "failed",
});
export type ImdbRunOutcome =
  (typeof ImdbRunOutcome)[keyof typeof ImdbRunOutcome];

export type ImdbRun = {
  /** The run's date, `YYYY-MM-DD` in London. */
  on: string;
  /** When it ran, epoch milliseconds. */
  at: number;
  outcome: ImdbRunOutcome;
  /** For `synced`: films added to each list. */
  added?: { watchlist: number; seen: number };
  /**
   * For `synced` and `nothingNew`: films found new on IMDb and left for the
   * next run, since one run adds at most so many.
   */
  remaining?: number;
  /** IMDb gave no watchlist (it's private), so only Seen was synced. */
  watchlistPrivate?: boolean;
  /** For `failed` and `skipped`, as the reader is shown it. */
  reason?: string;
};

/** Why a film on IMDb wasn't added. */
export const ImdbUnmatchedReason = Object.freeze({
  /** TheMovieDB has no film for its IMDb id. */
  NoTmdbFilm: "noTmdbFilm",
  /** TheMovieDB named a film for it, then had no such film. */
  NotOnTmdb: "notOnTmdb",
});
export type ImdbUnmatchedReason =
  (typeof ImdbUnmatchedReason)[keyof typeof ImdbUnmatchedReason];

/** A film on the reader's IMDb lists that couldn't be added. */
export type ImdbUnmatchedFilm = {
  list: "watchlist" | "seen";
  name: string;
  year?: number;
  /** Its IMDb id, `tt` and digits; the page builds its address. */
  imdbId: string;
  reason: ImdbUnmatchedReason;
};

/** An IMDb title id: `tt` and digits. */
export function isImdbTitleId(value: unknown): value is string {
  return typeof value === "string" && /^tt[0-9]{1,12}$/.test(value);
}

/** How many runs the ledger keeps, newest first. */
export const MAX_IMDB_RUNS = 30;

/**
 * How many unmatched films the ledger keeps: enough to show, and a bound on
 * a document with a 1 MiB limit.
 */
export const MAX_IMDB_UNMATCHED_FILMS = 200;

/**
 * The ledger: the reader's recent runs, newest first, and the films the last
 * run that read IMDb couldn't add.
 */
export type ImdbLedger = {
  runs: ImdbRun[];
  unmatched: ImdbUnmatchedFilm[];
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const OUTCOMES: readonly unknown[] = Object.values(ImdbRunOutcome);
const REASONS: readonly unknown[] = Object.values(ImdbUnmatchedReason);

function readRun(value: unknown): ImdbRun | null {
  if (!isRecord(value)) return null;
  const { on, at, outcome, added, remaining, watchlistPrivate, reason } = value;
  if (typeof on !== "string" || !DATE.test(on)) return null;
  if (typeof at !== "number" || !OUTCOMES.includes(outcome)) return null;
  return {
    on,
    at,
    outcome: outcome as ImdbRunOutcome,
    ...(isRecord(added) &&
      typeof added.watchlist === "number" &&
      typeof added.seen === "number" && {
        added: { watchlist: added.watchlist, seen: added.seen },
      }),
    ...(typeof remaining === "number" && { remaining }),
    ...(watchlistPrivate === true && { watchlistPrivate }),
    ...(typeof reason === "string" && { reason }),
  };
}

function readUnmatched(value: unknown): ImdbUnmatchedFilm | null {
  if (!isRecord(value)) return null;
  const { list, name, year, imdbId, reason } = value;
  if (list !== "watchlist" && list !== "seen") return null;
  if (typeof name !== "string" || !isImdbTitleId(imdbId)) return null;
  if (!REASONS.includes(reason)) return null;
  return {
    list,
    name,
    ...(typeof year === "number" && { year }),
    imdbId,
    reason: reason as ImdbUnmatchedReason,
  };
}

/** The ledger, or one with no runs when there isn't one yet. */
export function parseImdbLedger(data: unknown): ImdbLedger {
  if (!isRecord(data)) return { runs: [], unmatched: [] };
  const runs = Array.isArray(data.runs)
    ? data.runs
        .map(readRun)
        .filter((run): run is ImdbRun => run !== null)
        .sort((a, b) => b.at - a.at)
        .slice(0, MAX_IMDB_RUNS)
    : [];
  const unmatched = Array.isArray(data.unmatched)
    ? data.unmatched
        .map(readUnmatched)
        .filter((film): film is ImdbUnmatchedFilm => film !== null)
        .slice(0, MAX_IMDB_UNMATCHED_FILMS)
    : [];
  return { runs, unmatched };
}
