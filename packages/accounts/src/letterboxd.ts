/**
 * A reader's Letterboxd sync, as the sync Worker (clusterflick/api-letterboxd)
 * writes it and the site reads it: which Letterboxd member is linked, and the
 * ledger of each night's run. One shape for both sides, parsed from plain
 * values: the site passes a snapshot's data, a Worker passes `decodeFields` of
 * what Firestore sent.
 *
 * - `users/{uid}/meta/letterboxd` is the link. Only the Worker writes it,
 *   after looking the username up on Letterboxd, so what it holds is a
 *   member that exists; the reader may read it, and unlinks by deleting it.
 *   `enabled` is always true while it's there: the nightly run finds readers
 *   by it, with the collection-group index the alerts already use.
 * - `users/{uid}/meta/letterboxd-ledger` is the Worker's: the reader may read
 *   and delete it, never write it.
 *
 * Anything that can't be read is dropped rather than guessed at, as the lists
 * are.
 */

export const letterboxdLinkPath = (uid: string) =>
  `users/${uid}/meta/letterboxd`;
export const letterboxdLedgerPath = (uid: string) =>
  `users/${uid}/meta/letterboxd-ledger`;

/**
 * A Letterboxd username, as Letterboxd's API documents them: 2 to 15
 * letters, numbers or underscores. Checked before one is sent anywhere.
 */
export function isLetterboxdUsername(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_]{2,15}$/.test(value);
}

/**
 * A Letterboxd ID (LID), as Letterboxd's API returns them: short and
 * alphanumeric. Checked before one is put in a path.
 */
export function isLetterboxdId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9]{1,16}$/.test(value);
}

export type LetterboxdLink = {
  /** As the reader typed it, once Letterboxd confirmed it. */
  username: string;
  /** The member's LID, which stays the same if they rename. */
  memberId: string;
  /** Epoch milliseconds. */
  linkedAt: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** The link as the Worker writes it. */
export function toLetterboxdLinkDocument(link: LetterboxdLink) {
  return { enabled: true, ...link };
}

/** The link, or null when there's none or it can't be read. */
export function parseLetterboxdLink(data: unknown): LetterboxdLink | null {
  if (!isRecord(data) || data.enabled !== true) return null;
  const { username, memberId, linkedAt } = data;
  if (!isLetterboxdUsername(username) || !isLetterboxdId(memberId)) {
    return null;
  }
  if (typeof linkedAt !== "number") return null;
  return { username, memberId, linkedAt };
}

/** What one night's run did for a reader. */
export const LetterboxdRunOutcome = Object.freeze({
  /** Films were added; `added` says how many to each list. */
  Synced: "synced",
  /** Read, and everything was already on the lists. */
  NothingNew: "nothingNew",
  /** Not run: the capability is gone. */
  Skipped: "skipped",
  /** Couldn't be done; `reason` says why. */
  Failed: "failed",
});
export type LetterboxdRunOutcome =
  (typeof LetterboxdRunOutcome)[keyof typeof LetterboxdRunOutcome];

export type LetterboxdRun = {
  /** The run's date, `YYYY-MM-DD` in London. */
  on: string;
  /** When it ran, epoch milliseconds. */
  at: number;
  outcome: LetterboxdRunOutcome;
  /** For `synced`: films added to each list. */
  added?: { watchlist: number; seen: number };
  /**
   * For `synced`: films taken off the watchlist here because they moved to
   * Seen on Letterboxd (watched, and off the Letterboxd watchlist).
   */
  moved?: number;
  /**
   * For `synced` and `nothingNew`: films found new on Letterboxd and left for
   * the next run, since one run adds at most so many.
   */
  remaining?: number;
  /** The watchlist is private on Letterboxd, so only Seen was synced. */
  watchlistPrivate?: boolean;
  /** For `failed` and `skipped`, as the reader is shown it. */
  reason?: string;
};

/** Why a film on Letterboxd wasn't added. */
export const UnmatchedReason = Object.freeze({
  /** Letterboxd gives no TheMovieDB film for it. */
  NoTmdbFilm: "noTmdbFilm",
  /** TheMovieDB has no such film any more. */
  NotOnTmdb: "notOnTmdb",
});
export type UnmatchedReason =
  (typeof UnmatchedReason)[keyof typeof UnmatchedReason];

/** A film on the reader's Letterboxd lists that couldn't be added. */
export type UnmatchedFilm = {
  list: "watchlist" | "seen";
  name: string;
  year?: number;
  /** Its page on Letterboxd. */
  url: string;
  reason: UnmatchedReason;
};

/** How many runs the ledger keeps, newest first. */
export const MAX_LETTERBOXD_RUNS = 30;

/**
 * How many unmatched films the ledger keeps: enough to show, and a bound on
 * a document with a 1 MiB limit.
 */
export const MAX_UNMATCHED_FILMS = 200;

/**
 * The ledger: the reader's recent runs, newest first, and the films the last
 * run that read Letterboxd couldn't add.
 */
export type LetterboxdLedger = {
  runs: LetterboxdRun[];
  unmatched: UnmatchedFilm[];
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const OUTCOMES: readonly unknown[] = Object.values(LetterboxdRunOutcome);
const REASONS: readonly unknown[] = Object.values(UnmatchedReason);

function readRun(value: unknown): LetterboxdRun | null {
  if (!isRecord(value)) return null;
  const { on, at, outcome, added, moved, remaining, watchlistPrivate, reason } =
    value;
  if (typeof on !== "string" || !DATE.test(on)) return null;
  if (typeof at !== "number" || !OUTCOMES.includes(outcome)) return null;
  return {
    on,
    at,
    outcome: outcome as LetterboxdRunOutcome,
    ...(isRecord(added) &&
      typeof added.watchlist === "number" &&
      typeof added.seen === "number" && {
        added: { watchlist: added.watchlist, seen: added.seen },
      }),
    ...(typeof moved === "number" && moved > 0 && { moved }),
    ...(typeof remaining === "number" && { remaining }),
    ...(watchlistPrivate === true && { watchlistPrivate }),
    ...(typeof reason === "string" && { reason }),
  };
}

function readUnmatched(value: unknown): UnmatchedFilm | null {
  if (!isRecord(value)) return null;
  const { list, name, year, url, reason } = value;
  if (list !== "watchlist" && list !== "seen") return null;
  if (typeof name !== "string" || typeof url !== "string") return null;
  if (!REASONS.includes(reason)) return null;
  return {
    list,
    name,
    ...(typeof year === "number" && { year }),
    url,
    reason: reason as UnmatchedReason,
  };
}

/** The ledger, or one with no runs when there isn't one yet. */
export function parseLetterboxdLedger(data: unknown): LetterboxdLedger {
  if (!isRecord(data)) return { runs: [], unmatched: [] };
  const runs = Array.isArray(data.runs)
    ? data.runs
        .map(readRun)
        .filter((run): run is LetterboxdRun => run !== null)
        .sort((a, b) => b.at - a.at)
        .slice(0, MAX_LETTERBOXD_RUNS)
    : [];
  const unmatched = Array.isArray(data.unmatched)
    ? data.unmatched
        .map(readUnmatched)
        .filter((film): film is UnmatchedFilm => film !== null)
        .slice(0, MAX_UNMATCHED_FILMS)
    : [];
  return { runs, unmatched };
}
