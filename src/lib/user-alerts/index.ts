import type { Firestore } from "firebase/firestore/lite";
import { commitUserWrite } from "@/lib/firebase/commit-user-write";
import {
  parseAlertLedger,
  parseAlertSettings,
  toAlertSettingsDocument,
  type AlertLedger,
  type AlertSettings,
  type AlertTrigger,
  type AlertVenueScope,
} from "@clusterflick/accounts/alerts";

export * from "@clusterflick/accounts/alerts";

/**
 * A reader's email alerts on the site: their settings, which they write, and
 * the ledger the alerts Worker keeps of each night's run, which they can only
 * read. The shapes are `@clusterflick/accounts/alerts`', which the Worker
 * reads too. Allowed by the `emailAlerts` capability: the rules refuse
 * switching alerts on without it, and the Worker checks it again before
 * sending anything.
 *
 * Written through `commitUserWrite`, as every write of a reader's data is,
 * though nothing the profiles Worker caches shows their alerts: the purge
 * costs a request, and keeps one way of writing.
 */

async function getSettingsDocRef(db: Firestore, uid: string) {
  const { doc } = await import("firebase/firestore/lite");
  return doc(db, "users", uid, "meta", "alerts");
}

async function getLedgerDocRef(db: Firestore, uid: string) {
  const { doc } = await import("firebase/firestore/lite");
  return doc(db, "users", uid, "meta", "alert-ledger");
}

/** Null when they've never saved any. */
export async function fetchAlertSettings(
  db: Firestore,
  uid: string,
): Promise<AlertSettings | null> {
  const { getDoc } = await import("firebase/firestore/lite");
  const snapshot = await getDoc(await getSettingsDocRef(db, uid));
  return parseAlertSettings(snapshot.data());
}

/**
 * `email` is the address the reader is signed in with: the rules refuse any
 * other, and the Worker sends to it.
 */
export async function saveAlertSettings(
  db: Firestore,
  uid: string,
  settings: AlertSettings,
  email: string,
): Promise<void> {
  await commitUserWrite(db, async (batch) => {
    batch.set(
      await getSettingsDocRef(db, uid),
      toAlertSettingsDocument(settings, email),
    );
  });
}

/** Empty before the Worker has run for them. */
export async function fetchAlertLedger(
  db: Firestore,
  uid: string,
): Promise<AlertLedger> {
  const { getDoc } = await import("firebase/firestore/lite");
  const snapshot = await getDoc(await getLedgerDocRef(db, uid));
  return parseAlertLedger(snapshot.data());
}

/** For account deletion: the settings and the ledger, together. */
export async function deleteAlerts(db: Firestore, uid: string): Promise<void> {
  await commitUserWrite(db, async (batch) => {
    batch.delete(await getSettingsDocRef(db, uid));
    batch.delete(await getLedgerDocRef(db, uid));
  });
}

/**
 * The alerts Worker (clusterflick/api-alerts), on the host the emails come
 * from. `NEXT_PUBLIC_ALERTS_ORIGIN` points a local build at `wrangler dev`.
 */
export const ALERTS_ORIGIN =
  process.env.NEXT_PUBLIC_ALERTS_ORIGIN || "https://alerts.clusterflick.com";

/**
 * What a preview shows: tonight's email so far, against the Worker's last
 * run, or one with every watchlist film that's showing, to see the email
 * with real listings before any run.
 */
export type PreviewMode = "sinceLastRun" | "everythingShowing";

export type AlertPreview = {
  mode: PreviewMode;
  /** No run has remembered the watchlist yet, so there's nothing to compare. */
  baseline: boolean;
  /** The date of the Worker's last run for the reader, `YYYY-MM-DD`. */
  lastRun: string | null;
  /** Null when there'd be no email. */
  digest: { subject: string; html: string; text: string; films: number } | null;
};

/**
 * Asks the alerts Worker to remember the reader's watchlist as it stands,
 * when they switch alerts on, so that night's email has what's new since
 * then; without it, the first night only remembers. Throws on any refusal:
 * the alerts are on either way.
 */
export async function rememberWatchlist(idToken: string): Promise<void> {
  const response = await fetch(`${ALERTS_ORIGIN}/remember`, {
    method: "POST",
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!response.ok) throw new Error(`Remembering failed: ${response.status}`);
}

/**
 * The email the reader's alerts would send, with the triggers and new-venue
 * scope being edited, worked out by the Worker now and never sent. Throws on
 * any refusal.
 */
export async function previewAlerts(
  idToken: string,
  mode: PreviewMode,
  notify: AlertTrigger[],
  newVenueScope: AlertVenueScope,
  signal?: AbortSignal,
): Promise<AlertPreview> {
  const response = await fetch(`${ALERTS_ORIGIN}/preview`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ mode, notify, newVenueScope }),
    signal,
  });
  if (!response.ok) throw new Error(`Preview failed: ${response.status}`);
  return (await response.json()) as AlertPreview;
}
