import type { Firestore } from "firebase/firestore/lite";

/**
 * Features granted to a reader one account at a time, rather than switched on
 * for everyone. A capability says a reader *may* use a feature; whether they
 * do is their own setting, so everything acting on one checks both — the
 * alerts job looks for the capability and then the reader's alerts, the
 * profile Worker for the capability and then the profile being public.
 * Revoking a capability switches the feature off without touching the
 * reader's settings.
 *
 * Granted with `npm run grant-capability`, never by the reader: the rules let
 * them read their capabilities and nothing more. Hiding a page here is a
 * convenience, not a guard — the site is static, so the rules and whatever
 * runs the feature are what enforce it.
 */
export enum CapabilityId {
  EmailAlerts = "emailAlerts",
  PublicProfile = "publicProfile",
}

export type CapabilityGrant = {
  /** Epoch milliseconds. */
  grantedAt: number;
};

export type UserCapabilities = Partial<Record<CapabilityId, CapabilityGrant>>;

export type CapabilityDefinition = {
  title: string;
  /**
   * Shown on /personalise while the feature is still being built; null once
   * it has settings of its own there.
   */
  comingSoon: string | null;
};

/**
 * Every capability and how /personalise describes it. A `Record`, so a new
 * capability won't compile until it has its copy. The grant script keeps its
 * own list of ids (it can't load TypeScript), held to this one by a test.
 */
export const CAPABILITIES: Record<CapabilityId, CapabilityDefinition> = {
  [CapabilityId.EmailAlerts]: {
    title: "Email alerts",
    comingSoon:
      "Soon you'll be able to get an email when a film on your watchlist gets new showings, or is about to finish its run.",
  },
  [CapabilityId.PublicProfile]: {
    title: "Public profile",
    comingSoon: null,
  },
};

const CAPABILITY_IDS = new Set<string>(Object.values(CapabilityId));

/**
 * The document's capabilities that this build knows. One it
 * doesn't know was granted by a newer script or is a typo in a hand edit:
 * worth a warning, but not worth breaking the page over.
 */
export function parseCapabilities(
  data: Record<string, unknown> | undefined,
): UserCapabilities {
  const capabilities: UserCapabilities = {};
  for (const [id, grant] of Object.entries(data ?? {})) {
    if (!CAPABILITY_IDS.has(id)) {
      console.warn(`Ignoring unknown capability "${id}"`);
      continue;
    }
    capabilities[id as CapabilityId] = grant as CapabilityGrant;
  }
  return capabilities;
}

/** The granted capabilities, in the registry's order. */
export function getGrantedCapabilities(
  capabilities: UserCapabilities,
): CapabilityId[] {
  return Object.values(CapabilityId).filter((id) => id in capabilities);
}

/*
 * Storage: `users/{uid}/meta/capabilities`, a map of capability id → grant.
 * Its own document, not a field of `users/{uid}`: the reader writes that one,
 * and its rule allows only the list fields, so a capability there would make
 * every later list write fail.
 */

async function getCapabilitiesDocRef(db: Firestore, uid: string) {
  const { doc } = await import("firebase/firestore/lite");
  return doc(db, "users", uid, "meta", "capabilities");
}

export async function fetchCapabilities(
  db: Firestore,
  uid: string,
): Promise<UserCapabilities> {
  const { getDoc } = await import("firebase/firestore/lite");
  const snapshot = await getDoc(await getCapabilitiesDocRef(db, uid));
  return parseCapabilities(snapshot.data());
}

/** For account deletion: the rules let a reader delete it, never write it. */
export async function deleteCapabilities(
  db: Firestore,
  uid: string,
): Promise<void> {
  const { deleteDoc } = await import("firebase/firestore/lite");
  await deleteDoc(await getCapabilitiesDocRef(db, uid));
}
