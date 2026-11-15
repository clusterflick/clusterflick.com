import type { Firestore, WriteBatch } from "firebase/firestore/lite";
import { loadFirebase } from ".";

/**
 * The profiles Worker's purge (clusterflick/api-profiles): it drops the cached
 * copies of the signed-in reader's public profile, which it finds by their
 * uid, so a change shows on the next view rather than up to five minutes on.
 */
export const PROFILE_PURGE_PATH = "/api/profiles/purge";

/** After the first attempt; a purge that fails them all just leaves a copy. */
const PURGE_RETRY_DELAYS_MS = [500, 2000];

export type UserWriteResult = {
  /**
   * Whether the profile's cached copies were dropped. False leaves them to
   * expire within five minutes: harmless for a list change, worth telling the
   * reader about when the write made their profile private.
   */
  purged: boolean;
};

export type UserWriteOptions = {
  /**
   * Handles whose copies the Worker can't find by uid, which only a profile
   * save has: the handle given up, and one just taken, which a visitor may
   * have found empty.
   */
  purgeHandles?: string[];
  /** For tests, so retries don't wait. */
  sleep?: (ms: number) => Promise<void>;
};

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function purgeProfile(
  handles: string[],
  sleep: (ms: number) => Promise<void>,
): Promise<boolean> {
  const { auth } = await loadFirebase();
  const user = auth.currentUser;
  if (!user) return false;
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await fetch(PROFILE_PURGE_PATH, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${await user.getIdToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(handles.length > 0 ? { handles } : {}),
      });
      if (response.ok) return true;
      throw new Error(`Purge answered ${response.status}`);
    } catch (error) {
      if (attempt >= PURGE_RETRY_DELAYS_MS.length) {
        console.error("Couldn't purge the cached profile", error);
        return false;
      }
      await sleep(PURGE_RETRY_DELAYS_MS[attempt]);
    }
  }
}

/**
 * The one way the site writes a reader's data: `build` adds the writes to a
 * batch, which is committed, and then the reader's cached public profile is
 * purged so it shows the change. Writing to Firestore any other way is
 * refused by lint (`eslint.config.mjs`), because a write that skips the
 * purge leaves a profile showing what it no longer holds.
 *
 * A failed commit throws, as it always has. A failed purge doesn't: the
 * write happened, and the copy expires on its own. The result says which.
 */
export async function commitUserWrite(
  db: Firestore,
  build: (batch: WriteBatch) => void | Promise<void>,
  { purgeHandles = [], sleep = wait }: UserWriteOptions = {},
): Promise<UserWriteResult> {
  const { writeBatch } = await import("firebase/firestore/lite");
  const batch = writeBatch(db);
  await build(batch);
  await batch.commit();
  return { purged: await purgeProfile([...new Set(purgeHandles)], sleep) };
}
