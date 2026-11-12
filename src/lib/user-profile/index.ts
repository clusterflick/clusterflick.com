import type { Firestore } from "firebase/firestore/lite";
import reservedHandles from "./reserved-handles.json";
import {
  type ProfileLinks,
  readDisplayName,
  readProfileLinks,
} from "./identity";
import { type FavouriteFilm, readFavourites } from "./favourites";

export * from "./identity";
export * from "./favourites";

/**
 * A reader's public profile settings: the handle their page lives at
 * (`/u/<handle>/`) and whether it is shown. Allowed by the `publicProfile`
 * capability, but the capability publishes nothing: only `public: true` does,
 * and the profile Worker checks both before serving a page.
 *
 * Handles are lowercase everywhere — the address, the document ids and what
 * the page shows — so there is one spelling of each to keep in step.
 */
export type UserProfile = {
  handle: string;
  public: boolean;
  /**
   * What the page shows. Absent until the reader has chosen, and a profile
   * can't be made public before they have (the rules refuse it). A profile
   * made public before the choice existed has none and shows everything,
   * as it did then.
   */
  sections?: ProfileSections;
  /** Shown in place of the handle, with the handle beside it. */
  displayName?: string;
  /** Left out when there are none. */
  links?: ProfileLinks;
  /** Up to four, in order. Left out when there are none. */
  favourites?: FavouriteFilm[];
};

/**
 * The parts of a profile a reader can show or hide. Repeated in
 * `firestore.rules` and in the profiles Worker, which leaves a hidden
 * section's data out of the page rather than only not drawing it.
 */
export enum ProfileSectionId {
  SeenStats = "seenStats",
  Watchlist = "watchlist",
  FavouriteVenues = "favouriteVenues",
  Seen = "seen",
}

export type ProfileSections = Record<ProfileSectionId, boolean>;

/** In the order the page shows them. */
export const PROFILE_SECTION_IDS: readonly ProfileSectionId[] =
  Object.values(ProfileSectionId);

/**
 * What a reader starts from: everything, as every profile showed before the
 * choice. Starting from everything is fine because nothing goes public until
 * they have saved a choice.
 */
export const ALL_PROFILE_SECTIONS: ProfileSections = {
  [ProfileSectionId.SeenStats]: true,
  [ProfileSectionId.Watchlist]: true,
  [ProfileSectionId.FavouriteVenues]: true,
  [ProfileSectionId.Seen]: true,
};

/**
 * A saved `sections` map, or undefined if there isn't a whole one. Every key
 * must be a boolean, as the rules require.
 */
export function parseProfileSections(
  value: unknown,
): ProfileSections | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }
  const map = value as Record<string, unknown>;
  if (PROFILE_SECTION_IDS.some((id) => typeof map[id] !== "boolean")) {
    return undefined;
  }
  return Object.fromEntries(
    PROFILE_SECTION_IDS.map((id) => [id, map[id]]),
  ) as ProfileSections;
}

/** What a profile shows: a saved choice, or everything before there is one. */
export function getShownSections(profile: UserProfile): ProfileSections {
  return profile.sections ?? ALL_PROFILE_SECTIONS;
}

export const HANDLE_MIN_LENGTH = 3;
export const HANDLE_MAX_LENGTH = 30;

/** Repeated in `firestore.rules`, which can't import it. */
const HANDLE_PATTERN = /^[a-z0-9_-]+$/;

/**
 * Handles nobody may claim. Short and curated rather than a published
 * blocklist: profiles sit under `/u/`, so a handle can't collide with a page,
 * and what's left to guard against is impersonating the site. Repeated in
 * `firestore.rules`, held to this list by a test.
 */
export const RESERVED_HANDLES: ReadonlySet<string> = new Set(reservedHandles);

/** What the reader typed, as it would be saved. */
export function normaliseHandle(input: string): string {
  return input.trim().toLowerCase();
}

export type HandleProblem =
  | "too-short"
  | "too-long"
  | "characters"
  | "reserved";

/** Why a (normalised) handle can't be claimed, or null if it can. */
export function getHandleProblem(handle: string): HandleProblem | null {
  if (handle.length < HANDLE_MIN_LENGTH) return "too-short";
  if (handle.length > HANDLE_MAX_LENGTH) return "too-long";
  if (!HANDLE_PATTERN.test(handle)) return "characters";
  if (RESERVED_HANDLES.has(handle)) return "reserved";
  return null;
}

export const HANDLE_PROBLEM_MESSAGES: Record<HandleProblem, string> = {
  "too-short": `At least ${HANDLE_MIN_LENGTH} characters`,
  "too-long": `At most ${HANDLE_MAX_LENGTH} characters`,
  characters: "Only letters, numbers, - and _",
  reserved: "That handle isn't available",
};

/** Where a profile is shown. Always lowercase, with the trailing slash. */
export function getProfilePath(handle: string): string {
  return `/u/${handle}/`;
}

export function parseProfile(
  data: Record<string, unknown> | undefined,
): UserProfile | null {
  if (!data || typeof data.handle !== "string") return null;
  const sections = parseProfileSections(data.sections);
  const displayName = readDisplayName(data.displayName);
  const links = readProfileLinks(data.links);
  const favourites = readFavourites(data.favourites);
  return {
    handle: data.handle,
    public: data.public === true,
    ...(sections && { sections }),
    ...(displayName && { displayName }),
    ...(Object.keys(links).length > 0 && { links }),
    ...(favourites.length > 0 && { favourites }),
  };
}

/*
 * Storage: two documents that name each other, and the rules only accept
 * writes that keep them in step.
 *
 * - `handles/{handle}` holds `{ uid }`. A document id exists once, so it is
 *   what makes a handle unique, and it is the Worker's lookup from address to
 *   reader. Any signed-in reader may get one (to be told it's taken), nobody
 *   may list them.
 * - `users/{uid}/meta/profile` holds `{ handle, public, sections,
 *   displayName, links, favourites }`, the owner's own record, which only
 *   they can read.
 *
 * So every change is one batch over both: claiming creates the handle and the
 * profile, renaming deletes the old handle and creates the new one, and
 * deleting removes both.
 */

async function getProfileDocRef(db: Firestore, uid: string) {
  const { doc } = await import("firebase/firestore/lite");
  return doc(db, "users", uid, "meta", "profile");
}

async function getHandleDocRef(db: Firestore, handle: string) {
  const { doc } = await import("firebase/firestore/lite");
  return doc(db, "handles", handle);
}

export async function fetchProfile(
  db: Firestore,
  uid: string,
): Promise<UserProfile | null> {
  const { getDoc } = await import("firebase/firestore/lite");
  const snapshot = await getDoc(await getProfileDocRef(db, uid));
  return parseProfile(snapshot.data());
}

/** Whether someone other than `uid` holds the handle. */
export async function isHandleTaken(
  db: Firestore,
  handle: string,
  uid: string,
): Promise<boolean> {
  const { getDoc } = await import("firebase/firestore/lite");
  const snapshot = await getDoc(await getHandleDocRef(db, handle));
  return snapshot.exists() && snapshot.data().uid !== uid;
}

/**
 * Saves the profile, claiming its handle and releasing the one it replaces in
 * the same batch. `previous` is the profile as last read; if it is out of
 * date the rules refuse the batch, as they do when another reader has claimed
 * the handle in between.
 */
export async function saveProfile(
  db: Firestore,
  uid: string,
  next: UserProfile,
  previous: UserProfile | null,
): Promise<void> {
  const { writeBatch } = await import("firebase/firestore/lite");
  const batch = writeBatch(db);
  if (previous?.handle !== next.handle) {
    if (previous) batch.delete(await getHandleDocRef(db, previous.handle));
    batch.set(await getHandleDocRef(db, next.handle), { uid });
  }
  batch.set(await getProfileDocRef(db, uid), {
    handle: next.handle,
    public: next.public,
    ...(next.sections && { sections: next.sections }),
    ...(next.displayName && { displayName: next.displayName }),
    ...(next.links &&
      Object.keys(next.links).length > 0 && { links: next.links }),
    ...(next.favourites &&
      next.favourites.length > 0 && { favourites: next.favourites }),
  });
  await batch.commit();
}

/** For account deletion: the profile and its handle, together. */
export async function deleteProfile(db: Firestore, uid: string): Promise<void> {
  const { writeBatch } = await import("firebase/firestore/lite");
  const profile = await fetchProfile(db, uid);
  if (!profile) return;
  const batch = writeBatch(db);
  batch.delete(await getHandleDocRef(db, profile.handle));
  batch.delete(await getProfileDocRef(db, uid));
  await batch.commit();
}
