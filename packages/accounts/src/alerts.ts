/**
 * A reader's email alerts, as the site writes them and the alerts Worker
 * (clusterflick/api-alerts) reads them, and the ledger the Worker keeps of
 * each reader's runs, which the site shows. One shape for both sides, parsed
 * from plain values: the site passes a snapshot's data, a Worker passes
 * `decodeFields` of what Firestore sent.
 *
 * - `users/{uid}/meta/alerts` is the reader's: whether alerts are on, what
 *   each alert is for, and the address they go to, which the rules hold to
 *   the verified address the reader is signed in with. `firestore.rules` repeats its shape, held to this
 *   module by a test. The Worker also writes it, only to switch alerts off
 *   when the reader unsubscribes or their address bounces.
 * - `users/{uid}/meta/alert-ledger` is the Worker's: the reader may read and
 *   delete it, never write it.
 *
 * Anything that can't be read is dropped rather than guessed at, as the lists
 * are: an unknown trigger, an alert of an unknown type, a run with no date.
 * The one default is an alert's `newVenueScope`, which settings saved before
 * it existed don't have, and which reads as what they did then.
 *
 * Two kinds of alert: the reader's watchlist, and saved searches. A saved
 * search's `query` is the catalogue's own query string, kept opaque here:
 * `@clusterflick/catalogue/filters/saved-search` is what reads it, so a
 * filter the catalogue renames drops out of the search rather than failing
 * the reader's whole settings.
 */

export const alertSettingsPath = (uid: string) => `users/${uid}/meta/alerts`;
export const alertLedgerPath = (uid: string) =>
  `users/${uid}/meta/alert-ledger`;

/**
 * What makes a watchlist film worth an email, chosen per alert, since a film
 * showing across a chain gets new performances almost every run.
 */
export const AlertTrigger = Object.freeze({
  /** Not showing anywhere for 30 days, and now listed. */
  FirstListing: "firstListing",
  /** Showing somewhere it wasn't. */
  NewVenue: "newVenue",
  /** Any performance added. */
  NewPerformance: "newPerformance",
});
export type AlertTrigger = (typeof AlertTrigger)[keyof typeof AlertTrigger];

/** In the order the site offers them. */
export const ALERT_TRIGGERS: readonly AlertTrigger[] =
  Object.values(AlertTrigger);

/** A watchlist alert's triggers until the reader chooses: the quiet two. */
export const DEFAULT_WATCHLIST_TRIGGERS: readonly AlertTrigger[] = [
  AlertTrigger.FirstListing,
  AlertTrigger.NewVenue,
];

/**
 * Where a showing counts as somewhere new, for `newVenue`: any cinema, or
 * only the reader's favourite venues, since a film on general release
 * reaches more multiplexes almost every night.
 */
export const AlertVenueScope = Object.freeze({
  Any: "any",
  Favourites: "favourites",
});
export type AlertVenueScope =
  (typeof AlertVenueScope)[keyof typeof AlertVenueScope];

/** In the order the site offers them. */
export const ALERT_VENUE_SCOPES: readonly AlertVenueScope[] =
  Object.values(AlertVenueScope);

/** What sets an alert off, whichever kind it is. */
type AlertTriggers = {
  notify: AlertTrigger[];
  /**
   * Narrows `newVenue`, and nothing else. Settings saved before there was a
   * choice read as `any`, which is what they did.
   */
  newVenueScope: AlertVenueScope;
};

/** The films on the reader's watchlist. At most one per reader. */
export type WatchlistAlert = { type: "watchlist" } & AlertTriggers;

/** A catalogue search the reader saved. */
export type SearchAlert = {
  type: "search";
  /** Stable, so the ledger can keep each search's memory by it. */
  id: string;
  /** The catalogue's query string for the search, without a leading "?". */
  query: string;
  /** The reader's name for it; without one, the search is described. */
  label?: string;
} & AlertTriggers;

export type Alert = WatchlistAlert | SearchAlert;

/**
 * How many alerts a reader may have: the watchlist and four searches. Raising
 * it is this and the rules' copy: nothing stored has to change.
 */
export const MAX_ALERTS = 5;

/** A search alert's id: short, and safe as a key in the ledger. */
export const ALERT_ID_PATTERN = /^[a-z0-9-]{1,32}$/;
/** The longest query a search alert keeps. */
export const SEARCH_QUERY_MAX_LENGTH = 2000;
/** The longest name a reader can give a search alert. */
export const ALERT_LABEL_MAX_LENGTH = 80;

/**
 * An id for a new search alert, unused by any of `alerts`: `s1`, `s2`, …
 * Never reused while the alert holding it exists, so the ledger's memory for
 * a deleted search can't be mistaken for a new one's.
 */
export function nextSearchAlertId(alerts: readonly Alert[]): string {
  const taken = new Set(
    alerts.flatMap((alert) => (alert.type === "search" ? [alert.id] : [])),
  );
  let n = 1;
  while (taken.has(`s${n}`)) n++;
  return `s${n}`;
}

export type AlertSettings = {
  /** Off sends nothing, whatever the alerts say. */
  enabled: boolean;
  alerts: Alert[];
};

/** What a reader starts from: off, with the watchlist alert ready. */
export const DEFAULT_ALERT_SETTINGS: AlertSettings = {
  enabled: false,
  alerts: [
    {
      type: "watchlist",
      notify: [...DEFAULT_WATCHLIST_TRIGGERS],
      newVenueScope: AlertVenueScope.Any,
    },
  ],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readTriggers(value: Record<string, unknown>): AlertTriggers | null {
  const saved: unknown[] = Array.isArray(value.notify) ? value.notify : [];
  const notify = ALERT_TRIGGERS.filter((trigger) => saved.includes(trigger));
  // An unknown scope is the one choice there was before there were two.
  const newVenueScope =
    ALERT_VENUE_SCOPES.find((scope) => scope === value.newVenueScope) ??
    AlertVenueScope.Any;
  // An alert that nothing sets off isn't one.
  return notify.length > 0 ? { notify, newVenueScope } : null;
}

function readAlert(value: unknown): Alert | null {
  if (!isRecord(value)) return null;
  const triggers = readTriggers(value);
  if (!triggers) return null;
  if (value.type === "watchlist") return { type: "watchlist", ...triggers };
  if (value.type !== "search") return null;
  const { id, query, label } = value;
  if (typeof id !== "string" || !ALERT_ID_PATTERN.test(id)) return null;
  if (
    typeof query !== "string" ||
    query.length === 0 ||
    query.length > SEARCH_QUERY_MAX_LENGTH
  ) {
    return null;
  }
  // A name that can't be read is dropped, not the search: it's described.
  const name = typeof label === "string" ? label.trim() : "";
  return {
    type: "search",
    id,
    query,
    ...(name && name.length <= ALERT_LABEL_MAX_LENGTH && { label: name }),
    ...triggers,
  };
}

/**
 * The alerts a reader keeps, in their order: at most one watchlist alert and
 * one alert per id, the first of each kept, and at most `MAX_ALERTS`.
 */
function keepAlerts(alerts: readonly (Alert | null)[]): Alert[] {
  const kept: Alert[] = [];
  const ids = new Set<string>();
  for (const alert of alerts) {
    if (!alert || kept.length === MAX_ALERTS) continue;
    const key = alert.type === "search" ? `search:${alert.id}` : "watchlist";
    if (ids.has(key)) continue;
    ids.add(key);
    kept.push(alert);
  }
  return kept;
}

/**
 * The saved settings, or null when there are none: the reader has never
 * saved any, and is shown the defaults.
 */
export function parseAlertSettings(data: unknown): AlertSettings | null {
  if (!isRecord(data)) return null;
  const alerts = Array.isArray(data.alerts)
    ? keepAlerts(data.alerts.map(readAlert))
    : [];
  return { enabled: data.enabled === true, alerts };
}

/**
 * The document as the rules accept it: the triggers deduplicated, in order,
 * one alert per id, an empty name left out, and the address the reader is
 * signed in with, which the Worker sends to.
 */
export function toAlertSettingsDocument(
  settings: AlertSettings,
  email: string,
) {
  return {
    enabled: settings.enabled,
    email,
    alerts: keepAlerts(settings.alerts).map((alert) => {
      const triggers = {
        notify: ALERT_TRIGGERS.filter((trigger) =>
          alert.notify.includes(trigger),
        ),
        newVenueScope: alert.newVenueScope,
      };
      if (alert.type === "watchlist") return { type: alert.type, ...triggers };
      const label = alert.label?.trim();
      return {
        type: alert.type,
        id: alert.id,
        query: alert.query,
        ...(label && { label }),
        ...triggers,
      };
    }),
  };
}

/**
 * The address alerts go to, or null if there's none: settings saved before
 * the address was, which the Worker doesn't guess at.
 */
export function readAlertEmail(data: unknown): string | null {
  return isRecord(data) && typeof data.email === "string" && data.email
    ? data.email
    : null;
}

/** What one night's run did for a reader. */
export const AlertRunOutcome = Object.freeze({
  /** An email went, naming `films` films. */
  Sent: "sent",
  /** Checked, and nothing matched. */
  NothingNew: "nothingNew",
  /** Not checked: alerts were off, or the capability gone. */
  Skipped: "skipped",
  /** Couldn't be done; `reason` says why. */
  Failed: "failed",
  /**
   * A retry found the email marked as sending, and didn't send it again: it
   * may or may not have gone.
   */
  NotResent: "notResent",
  /**
   * While alerts are being tried out: worked out like a send, naming
   * `films` films, and not sent.
   */
  Previewed: "previewed",
});
export type AlertRunOutcome =
  (typeof AlertRunOutcome)[keyof typeof AlertRunOutcome];

export type AlertRun = {
  /** The digest's date, `YYYY-MM-DD` in London. */
  on: string;
  /** When it ran, epoch milliseconds. */
  at: number;
  outcome: AlertRunOutcome;
  /** For `sent` and `previewed`. */
  films?: number;
  /** For `failed`, `skipped` and `notResent`, as the reader is shown it. */
  reason?: string;
};

/** Why the Worker switched a reader's alerts off. */
export const AlertStopReason = Object.freeze({
  Unsubscribed: "unsubscribed",
  /** Their mail server refused the address for good. */
  Bounced: "bounced",
  /** They marked an email as spam. */
  Complained: "complained",
});
export type AlertStopReason =
  (typeof AlertStopReason)[keyof typeof AlertStopReason];

export type AlertStop = {
  reason: AlertStopReason;
  /** Epoch milliseconds. */
  at: number;
  /** The date of the email it came from, `YYYY-MM-DD`, when known. */
  emailOn?: string;
};

/** How many runs the ledger keeps, newest first. */
export const MAX_ALERT_RUNS = 30;

/**
 * The ledger as the site shows it: the reader's recent runs, newest first,
 * and why alerts were last switched off for them, if the Worker did it. The
 * Worker also keeps what it has already told the reader about there, which
 * the site has no use for and isn't read here.
 */
export type AlertLedger = { runs: AlertRun[]; stopped?: AlertStop };

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const OUTCOMES: readonly unknown[] = Object.values(AlertRunOutcome);
const STOP_REASONS: readonly unknown[] = Object.values(AlertStopReason);

function readRun(value: unknown): AlertRun | null {
  if (!isRecord(value)) return null;
  const { on, at, outcome, films, reason } = value;
  if (typeof on !== "string" || !DATE.test(on)) return null;
  if (typeof at !== "number" || !OUTCOMES.includes(outcome)) return null;
  return {
    on,
    at,
    outcome: outcome as AlertRunOutcome,
    ...(typeof films === "number" && { films }),
    ...(typeof reason === "string" && { reason }),
  };
}

function readStop(value: unknown): AlertStop | undefined {
  if (!isRecord(value)) return undefined;
  const { reason, at, emailOn } = value;
  if (!STOP_REASONS.includes(reason) || typeof at !== "number") {
    return undefined;
  }
  return {
    reason: reason as AlertStopReason,
    at,
    ...(typeof emailOn === "string" && DATE.test(emailOn) && { emailOn }),
  };
}

/** The ledger, or one with no runs when there isn't one yet. */
export function parseAlertLedger(data: unknown): AlertLedger {
  if (!isRecord(data)) return { runs: [] };
  const runs = Array.isArray(data.runs)
    ? data.runs
        .map(readRun)
        .filter((run): run is AlertRun => run !== null)
        .sort((a, b) => b.at - a.at)
        .slice(0, MAX_ALERT_RUNS)
    : [];
  const stopped = readStop(data.stopped);
  return { runs, ...(stopped && { stopped }) };
}
