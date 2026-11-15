/**
 * A reader's email alerts, as the site writes them and the alerts Worker
 * (clusterflick/api-alerts) reads them, and the ledger the Worker keeps of
 * each reader's runs, which the site shows. One shape for both sides, parsed
 * from plain values: the site passes a snapshot's data, a Worker passes
 * `decodeFields` of what Firestore sent.
 *
 * - `users/{uid}/meta/alerts` is the reader's: whether alerts are on, and
 *   what each alert is for. `firestore.rules` repeats its shape, held to this
 *   module by a test. The Worker also writes it, only to switch alerts off
 *   when the reader unsubscribes or their address bounces.
 * - `users/{uid}/meta/alert-ledger` is the Worker's: the reader may read and
 *   delete it, never write it.
 *
 * Anything that can't be read is dropped rather than guessed at, as the lists
 * are: an unknown trigger, an alert of an unknown type, a run with no date.
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

/** The films on the reader's watchlist. The only kind there is, for now. */
export type WatchlistAlert = { type: "watchlist"; notify: AlertTrigger[] };

export type Alert = WatchlistAlert;

/** How many alerts a reader may have: one watchlist alert, for now. */
export const MAX_ALERTS = 1;

export type AlertSettings = {
  /** Off sends nothing, whatever the alerts say. */
  enabled: boolean;
  alerts: Alert[];
};

/** What a reader starts from: off, with the watchlist alert ready. */
export const DEFAULT_ALERT_SETTINGS: AlertSettings = {
  enabled: false,
  alerts: [{ type: "watchlist", notify: [...DEFAULT_WATCHLIST_TRIGGERS] }],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readAlert(value: unknown): Alert | null {
  if (!isRecord(value) || value.type !== "watchlist") return null;
  const saved: unknown[] = Array.isArray(value.notify) ? value.notify : [];
  const notify = ALERT_TRIGGERS.filter((trigger) => saved.includes(trigger));
  // An alert that nothing sets off isn't one.
  return notify.length > 0 ? { type: "watchlist", notify } : null;
}

/**
 * The saved settings, or null when there are none: the reader has never
 * saved any, and is shown the defaults.
 */
export function parseAlertSettings(data: unknown): AlertSettings | null {
  if (!isRecord(data)) return null;
  const alerts = Array.isArray(data.alerts)
    ? data.alerts
        .map(readAlert)
        .filter((alert): alert is Alert => alert !== null)
        .slice(0, MAX_ALERTS)
    : [];
  return { enabled: data.enabled === true, alerts };
}

/** The document as the rules accept it: the triggers deduplicated, in order. */
export function toAlertSettingsDocument(settings: AlertSettings) {
  return {
    enabled: settings.enabled,
    alerts: settings.alerts.slice(0, MAX_ALERTS).map((alert) => ({
      type: alert.type,
      notify: ALERT_TRIGGERS.filter((trigger) =>
        alert.notify.includes(trigger),
      ),
    })),
  };
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
});
export type AlertRunOutcome =
  (typeof AlertRunOutcome)[keyof typeof AlertRunOutcome];

export type AlertRun = {
  /** The digest's date, `YYYY-MM-DD` in London. */
  on: string;
  /** When it ran, epoch milliseconds. */
  at: number;
  outcome: AlertRunOutcome;
  /** For `sent`. */
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
