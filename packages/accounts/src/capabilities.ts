import { CapabilityId } from "./capability-ids.mjs";
import { isUid, type Firestore } from "./firestore";
import { UpstreamError } from "./google-auth";

export { CAPABILITY_IDS, CapabilityId } from "./capability-ids.mjs";

/** A capability's id: a value of `CapabilityId`. */
export type Capability = (typeof CapabilityId)[keyof typeof CapabilityId];

/** Where a reader's capabilities are kept. */
export const capabilitiesPath = (uid: string) =>
  `users/${uid}/meta/capabilities`;

/**
 * Whether a capabilities document grants `id`: the key being there, as the
 * site's rules read it, whatever it holds. No document grants nothing.
 */
export function isGranted(
  capabilities: Record<string, unknown> | null | undefined,
  id: Capability,
): boolean {
  return capabilities != null && id in capabilities;
}

/**
 * Whether `uid` has `id`, asked of Firestore. Throws `UpstreamError` when it
 * can't be asked, rather than guessing either way, and for anything that
 * isn't a uid, which isn't put in a path.
 */
export async function hasCapability(
  db: Firestore,
  uid: string,
  id: Capability,
): Promise<boolean> {
  if (!isUid(uid)) throw new UpstreamError(`Not a uid: ${uid}`);
  return isGranted(await db.get(capabilitiesPath(uid)), id);
}

/**
 * `hasCapability`, remembered for `ttlMs` per reader in this isolate: for a
 * Worker that checks on every call, which would otherwise read Firestore on
 * every call. A revoked capability stops a reader within `ttlMs`. Make one at
 * module scope, so the isolate's requests share it.
 */
export class RememberedCapability {
  private readonly answers = new Map<
    string,
    { granted: boolean; checkedAt: number }
  >();

  constructor(
    readonly id: Capability,
    readonly ttlMs: number,
  ) {}

  /**
   * `fresh` asks Firestore whatever was remembered: at sign-in, say, so a
   * reader granted it a minute ago gets in.
   */
  async has(
    db: Firestore,
    uid: string,
    { fresh = false, now = Date.now() } = {},
  ): Promise<boolean> {
    const known = this.answers.get(uid);
    if (!fresh && known && now - known.checkedAt < this.ttlMs) {
      return known.granted;
    }
    const granted = await hasCapability(db, uid, this.id);
    this.answers.set(uid, { granted, checkedAt: now });
    return granted;
  }

  /** Forget every answer, as a new isolate would: for tests. */
  clear() {
    this.answers.clear();
  }
}
