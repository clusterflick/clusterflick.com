import type { Firestore } from "firebase/firestore/lite";
import { commitUserWrite } from "@/lib/firebase/commit-user-write";
import {
  parseAlertLedger,
  parseAlertSettings,
  toAlertSettingsDocument,
  type AlertLedger,
  type AlertSettings,
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

export async function saveAlertSettings(
  db: Firestore,
  uid: string,
  settings: AlertSettings,
): Promise<void> {
  await commitUserWrite(db, async (batch) => {
    batch.set(
      await getSettingsDocRef(db, uid),
      toAlertSettingsDocument(settings),
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
