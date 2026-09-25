import type { Movie } from "@/types";
import type { Firestore } from "firebase/firestore/lite";

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

/*
 * Storage: one document per user at `users/{uid}`, holding every list as a
 * map. One read per session, and a list would need thousands of films to near
 * the 1MB document limit. `firestore.rules` confines each user to their own.
 */

async function getUserDocRef(db: Firestore, uid: string) {
  const { doc } = await import("firebase/firestore/lite");
  return doc(db, "users", uid);
}

export async function fetchUserLists(
  db: Firestore,
  uid: string,
): Promise<UserLists> {
  const { getDoc } = await import("firebase/firestore/lite");
  const snapshot = await getDoc(await getUserDocRef(db, uid));
  const data = snapshot.data() ?? {};
  return {
    [UserListId.Watchlist]: data[UserListId.Watchlist] ?? {},
    [UserListId.Seen]: data[UserListId.Seen] ?? {},
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

export async function deleteUserLists(
  db: Firestore,
  uid: string,
): Promise<void> {
  const { deleteDoc } = await import("firebase/firestore/lite");
  await deleteDoc(await getUserDocRef(db, uid));
}
