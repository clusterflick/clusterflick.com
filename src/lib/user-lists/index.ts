import type { Movie, Venue } from "@/types";
import type { Firestore } from "firebase/firestore/lite";

/**
 * Set on sign-in, cleared on sign-out. Carries no personal data: it exists so
 * a visitor who has never signed in never downloads the SDK just to be told
 * so. If it outlives the session, the SDK loads, reports nobody, and clears it.
 *
 * Lives here rather than in the user context so server components can read it:
 * the home page's inline script checks it before the page paints.
 */
export const SIGNED_IN_FLAG_KEY = "clusterflick-signed-in";

export enum UserListId {
  Watchlist = "watchlist",
  Seen = "seen",
}

/**
 * What a list keeps about each film. Enough to draw and link it without our
 * dataset, because a film on a watchlist outlives its run: once it leaves the
 * dataset (and later its departed page), this snapshot is all we have. The id
 * is the map key — TheMovieDB's id, or the pipeline's generated one for an
 * unmatched film; either is the stable id the film's URL is built from, and the
 * slug is derived from `title` the same way `getMovieUrl` derives it.
 */
export type UserListEntry = {
  title: string;
  year?: string;
  posterPath?: string;
  /** Epoch milliseconds. */
  addedAt: number;
};

export type UserLists = Record<UserListId, Record<Movie["id"], UserListEntry>>;

export const EMPTY_USER_LISTS: UserLists = {
  [UserListId.Watchlist]: {},
  [UserListId.Seen]: {},
};

export function toUserListEntry(
  movie: Pick<Movie, "title" | "year" | "posterPath">,
): UserListEntry {
  // Firestore rejects `undefined` values, so absent fields are left out.
  return {
    title: movie.title,
    ...(movie.year && { year: movie.year }),
    ...(movie.posterPath && { posterPath: movie.posterPath }),
    addedAt: Date.now(),
  };
}

/**
 * The field holding the reader's favourite venues ("My Venues"). Not a
 * `UserListId`: those are films, keyed by movie id, and everything built on
 * them — markers, import and export, the watchlist links — assumes so.
 */
export const FAVOURITE_VENUES_FIELD = "favouriteVenues";

/**
 * What a favourite keeps about its venue. The name is a snapshot for the same
 * reason a film's title is: a venue can close or drop out of the dataset, and
 * the entry is kept (it may come back), so it has to be nameable without it.
 */
export type FavouriteVenueEntry = {
  name: string;
  /** Epoch milliseconds. */
  addedAt: number;
};

export type FavouriteVenues = Record<Venue["id"], FavouriteVenueEntry>;

export type UserData = {
  lists: UserLists;
  favouriteVenues: FavouriteVenues;
};

/*
 * Storage: one document per user at `users/{uid}`, holding every list as a
 * map. One read per session, and a list would need thousands of films to near
 * the 1MB document limit. `firestore.rules` confines each user to their own.
 */

async function getUserDocRef(db: Firestore, uid: string) {
  const { doc } = await import("firebase/firestore/lite");
  return doc(db, "users", uid);
}

export async function fetchUserData(
  db: Firestore,
  uid: string,
): Promise<UserData> {
  const { getDoc } = await import("firebase/firestore/lite");
  const snapshot = await getDoc(await getUserDocRef(db, uid));
  const data = snapshot.data() ?? {};
  return {
    lists: {
      [UserListId.Watchlist]: data[UserListId.Watchlist] ?? {},
      [UserListId.Seen]: data[UserListId.Seen] ?? {},
    },
    favouriteVenues: data[FAVOURITE_VENUES_FIELD] ?? {},
  };
}

export async function addToUserList(
  db: Firestore,
  uid: string,
  listId: UserListId,
  movieId: Movie["id"],
  entry: UserListEntry,
  /** Lists the film leaves in the same write, so the two can't disagree. */
  removeFrom: UserListId[] = [],
): Promise<void> {
  const { setDoc, deleteField } = await import("firebase/firestore/lite");
  // Merge rather than update: the document doesn't exist until the first add.
  await setDoc(
    await getUserDocRef(db, uid),
    {
      [listId]: { [movieId]: entry },
      ...Object.fromEntries(
        removeFrom.map((otherId) => [otherId, { [movieId]: deleteField() }]),
      ),
    },
    { merge: true },
  );
}

/**
 * Adds many films in one write — an import. Films in `removeFrom` leave it in
 * the same write, as with a single add.
 */
export async function addManyToUserList(
  db: Firestore,
  uid: string,
  listId: UserListId,
  entries: Record<Movie["id"], UserListEntry>,
  removeFrom: UserListId[] = [],
): Promise<void> {
  const { setDoc, deleteField } = await import("firebase/firestore/lite");
  const ids = Object.keys(entries);
  await setDoc(
    await getUserDocRef(db, uid),
    {
      [listId]: entries,
      ...Object.fromEntries(
        removeFrom.map((otherId) => [
          otherId,
          Object.fromEntries(ids.map((id) => [id, deleteField()])),
        ]),
      ),
    },
    { merge: true },
  );
}

export async function removeFromUserList(
  db: Firestore,
  uid: string,
  listId: UserListId,
  movieId: Movie["id"],
): Promise<void> {
  const { updateDoc, deleteField, FieldPath } =
    await import("firebase/firestore/lite");
  // FieldPath rather than a dotted string, so an id can never be misread as a
  // nested path.
  await updateDoc(
    await getUserDocRef(db, uid),
    new FieldPath(listId, movieId),
    deleteField(),
  );
}

export async function addFavouriteVenue(
  db: Firestore,
  uid: string,
  venueId: Venue["id"],
  entry: FavouriteVenueEntry,
): Promise<void> {
  const { setDoc } = await import("firebase/firestore/lite");
  // Merge rather than update: the document doesn't exist until the first add.
  await setDoc(
    await getUserDocRef(db, uid),
    { [FAVOURITE_VENUES_FIELD]: { [venueId]: entry } },
    { merge: true },
  );
}

export async function removeFavouriteVenue(
  db: Firestore,
  uid: string,
  venueId: Venue["id"],
): Promise<void> {
  const { updateDoc, deleteField, FieldPath } =
    await import("firebase/firestore/lite");
  await updateDoc(
    await getUserDocRef(db, uid),
    new FieldPath(FAVOURITE_VENUES_FIELD, venueId),
    deleteField(),
  );
}

export async function deleteUserLists(
  db: Firestore,
  uid: string,
): Promise<void> {
  const { deleteDoc } = await import("firebase/firestore/lite");
  await deleteDoc(await getUserDocRef(db, uid));
}
