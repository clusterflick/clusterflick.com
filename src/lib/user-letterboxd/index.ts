import type { Firestore } from "firebase/firestore/lite";
import { commitUserWrite } from "@/lib/firebase/commit-user-write";
import {
  parseLetterboxdLedger,
  parseLetterboxdLink,
  type LetterboxdLedger,
  type LetterboxdLink,
} from "@clusterflick/accounts/letterboxd";

export * from "@clusterflick/accounts/letterboxd";

/**
 * A reader's Letterboxd sync on the site: the member linked, and the ledger
 * the sync Worker (clusterflick/api-letterboxd) keeps of each night's run.
 * Both are the Worker's to write: it links a member only once Letterboxd has
 * confirmed them (`linkLetterboxd`), and the reader may read both and delete
 * them. Unlinking is deleting the link. Allowed by the `letterboxdSync`
 * capability, which the Worker checks on every link and every run.
 */

async function getLinkDocRef(db: Firestore, uid: string) {
  const { doc } = await import("firebase/firestore/lite");
  return doc(db, "users", uid, "meta", "letterboxd");
}

async function getLedgerDocRef(db: Firestore, uid: string) {
  const { doc } = await import("firebase/firestore/lite");
  return doc(db, "users", uid, "meta", "letterboxd-ledger");
}

/** Null when no member is linked. */
export async function fetchLetterboxdLink(
  db: Firestore,
  uid: string,
): Promise<LetterboxdLink | null> {
  const { getDoc } = await import("firebase/firestore/lite");
  const snapshot = await getDoc(await getLinkDocRef(db, uid));
  return parseLetterboxdLink(snapshot.data());
}

/** Empty before the Worker has run for them. */
export async function fetchLetterboxdLedger(
  db: Firestore,
  uid: string,
): Promise<LetterboxdLedger> {
  const { getDoc } = await import("firebase/firestore/lite");
  const snapshot = await getDoc(await getLedgerDocRef(db, uid));
  return parseLetterboxdLedger(snapshot.data());
}

/**
 * Stops the sync. The ledger stays, so the reader can still see what was
 * added; films already added stay on their lists.
 */
export async function unlinkLetterboxd(
  db: Firestore,
  uid: string,
): Promise<void> {
  await commitUserWrite(db, async (batch) => {
    batch.delete(await getLinkDocRef(db, uid));
  });
}

/** For account deletion: the link and the ledger, together. */
export async function deleteLetterboxdSync(
  db: Firestore,
  uid: string,
): Promise<void> {
  await commitUserWrite(db, async (batch) => {
    batch.delete(await getLinkDocRef(db, uid));
    batch.delete(await getLedgerDocRef(db, uid));
  });
}

/**
 * The sync Worker (clusterflick/api-letterboxd).
 * `NEXT_PUBLIC_LETTERBOXD_SYNC_ORIGIN` points a local build at `wrangler dev`.
 */
export const LETTERBOXD_SYNC_ORIGIN =
  process.env.NEXT_PUBLIC_LETTERBOXD_SYNC_ORIGIN ||
  "https://letterboxd.clusterflick.com";

/** Why the Worker refused to link a username, as it answers. */
export type LinkRefusal =
  | "invalid_username"
  | "not_found"
  | "not_granted"
  | "unavailable";

export type LinkResult =
  | { ok: true; link: LetterboxdLink; watchlistPrivate: boolean }
  | { ok: false; error: LinkRefusal };

/**
 * Asks the Worker to link a Letterboxd username: it looks the member up on
 * Letterboxd and writes the link. A refusal it can explain is returned;
 * anything else throws.
 */
export async function linkLetterboxd(
  idToken: string,
  username: string,
): Promise<LinkResult> {
  const response = await fetch(`${LETTERBOXD_SYNC_ORIGIN}/link`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username }),
  });
  const body = (await response.json().catch(() => null)) as {
    error?: string;
    link?: LetterboxdLink;
    watchlistPrivate?: boolean;
  } | null;
  if (response.ok && body?.link) {
    return {
      ok: true,
      link: body.link,
      watchlistPrivate: body.watchlistPrivate === true,
    };
  }
  const known: LinkRefusal[] = [
    "invalid_username",
    "not_found",
    "not_granted",
    "unavailable",
  ];
  if (body?.error && (known as string[]).includes(body.error)) {
    return { ok: false, error: body.error as LinkRefusal };
  }
  throw new Error(`Linking failed: ${response.status}`);
}
