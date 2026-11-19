import type { Firestore } from "firebase/firestore/lite";
import { commitUserWrite } from "@/lib/firebase/commit-user-write";
import {
  parseImdbLedger,
  parseImdbLink,
  type ImdbLedger,
  type ImdbLink,
} from "@clusterflick/accounts/imdb";

export * from "@clusterflick/accounts/imdb";

/**
 * A reader's IMDb sync on the site: the IMDb user linked, and the ledger the
 * sync Worker (clusterflick/api-imdb) keeps of each night's run. The same
 * arrangement as the Letterboxd sync's (`@/lib/user-letterboxd`): both are the
 * Worker's to write, it links a user only once IMDb has confirmed them
 * (`linkImdb`), and the reader may read both and delete them. Unlinking is
 * deleting the link. Allowed by the `imdbSync` capability, which the Worker
 * checks on every link and every run.
 */

async function getLinkDocRef(db: Firestore, uid: string) {
  const { doc } = await import("firebase/firestore/lite");
  return doc(db, "users", uid, "meta", "imdb");
}

async function getLedgerDocRef(db: Firestore, uid: string) {
  const { doc } = await import("firebase/firestore/lite");
  return doc(db, "users", uid, "meta", "imdb-ledger");
}

/** Null when no IMDb user is linked. */
export async function fetchImdbLink(
  db: Firestore,
  uid: string,
): Promise<ImdbLink | null> {
  const { getDoc } = await import("firebase/firestore/lite");
  const snapshot = await getDoc(await getLinkDocRef(db, uid));
  return parseImdbLink(snapshot.data());
}

/** Empty before the Worker has run for them. */
export async function fetchImdbLedger(
  db: Firestore,
  uid: string,
): Promise<ImdbLedger> {
  const { getDoc } = await import("firebase/firestore/lite");
  const snapshot = await getDoc(await getLedgerDocRef(db, uid));
  return parseImdbLedger(snapshot.data());
}

/**
 * Stops the sync. The ledger stays, so the reader can still see what was
 * added; films already added stay on their lists.
 */
export async function unlinkImdb(db: Firestore, uid: string): Promise<void> {
  await commitUserWrite(db, async (batch) => {
    batch.delete(await getLinkDocRef(db, uid));
  });
}

/** For account deletion: the link and the ledger, together. */
export async function deleteImdbSync(
  db: Firestore,
  uid: string,
): Promise<void> {
  await commitUserWrite(db, async (batch) => {
    batch.delete(await getLinkDocRef(db, uid));
    batch.delete(await getLedgerDocRef(db, uid));
  });
}

/**
 * The sync Worker (clusterflick/api-imdb), same-origin with the site as the
 * TMDB search is. `next dev` rewrites it to the Worker's `wrangler dev` on
 * port 8792.
 */
export const IMDB_LINK_PATH = "/api/imdb/link";

/** Why the Worker refused to link an IMDb user, as it answers. */
export type ImdbLinkRefusal =
  | "invalid_user"
  | "not_confirmed"
  | "not_granted"
  | "unavailable";

export type ImdbLinkResult =
  | { ok: true; link: ImdbLink }
  | { ok: false; error: ImdbLinkRefusal };

/** An IMDb user's profile page, from the id in the link. */
export const getImdbProfileUrl = (link: ImdbLink) =>
  `https://www.imdb.com/user/${encodeURIComponent(link.profileId)}/`;

/** A title's page on IMDb. */
export const getImdbTitleUrl = (imdbId: string) =>
  `https://www.imdb.com/title/${encodeURIComponent(imdbId)}/`;

/**
 * Asks the Worker to link an IMDb user, given as either id or a profile's
 * address: it looks the user up on IMDb and writes the link. A refusal it
 * can explain is returned; anything else throws.
 */
export async function linkImdb(
  idToken: string,
  user: string,
): Promise<ImdbLinkResult> {
  const response = await fetch(IMDB_LINK_PATH, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user }),
  });
  const body = (await response.json().catch(() => null)) as {
    error?: string;
    link?: unknown;
  } | null;
  const link = parseImdbLink({ enabled: true, ...(body?.link as object) });
  if (response.ok && link) return { ok: true, link };
  const known: ImdbLinkRefusal[] = [
    "invalid_user",
    "not_confirmed",
    "not_granted",
    "unavailable",
  ];
  if (body?.error && (known as string[]).includes(body.error)) {
    return { ok: false, error: body.error as ImdbLinkRefusal };
  }
  throw new Error(`Linking failed: ${response.status}`);
}
