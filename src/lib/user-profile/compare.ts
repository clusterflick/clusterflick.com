import {
  UserListId,
  type UserListEntry,
  type UserLists,
} from "@/lib/user-lists";
import { ProfileSectionId, type ProfileSections } from ".";

export type ComparedFilm = { id: string; entry: UserListEntry };

/**
 * What a signed-in visitor has in common with a profile's owner, from the
 * visitor's own lists against what the profile shows. Nothing is sent for
 * it: the visitor's lists are already in their browser, and the owner's are
 * the ones on the page.
 *
 * Only what the owner shows is compared. A hidden list arrives empty, except
 * the Seen list with only the stats shown, which arrives for them; saying
 * which films "you've both seen" would then name films from a list the owner
 * chose to hide, so Seen is compared only when the list itself is shown.
 */
export type ProfileComparison = {
  /** On both watchlists. */
  bothWant: ComparedFilm[];
  /** On both Seen lists. */
  bothSeen: ComparedFilm[];
  /** Seen by the owner, on the visitor's watchlist. */
  theyveSeenYouWant: ComparedFilm[];
  /** Seen by the visitor, on the owner's watchlist. */
  youveSeenTheyWant: ComparedFilm[];
};

function overlap(
  shown: Record<string, UserListEntry>,
  theirs: Record<string, UserListEntry>,
): ComparedFilm[] {
  return Object.entries(shown)
    .filter(([id]) => id in theirs)
    .map(([id, entry]) => ({ id, entry }))
    .sort((a, b) => a.entry.title.localeCompare(b.entry.title));
}

export function compareProfileLists(
  owner: UserLists,
  sections: ProfileSections,
  visitor: UserLists,
): ProfileComparison {
  const ownerWatchlist = sections[ProfileSectionId.Watchlist]
    ? owner[UserListId.Watchlist]
    : {};
  const ownerSeen = sections[ProfileSectionId.Seen]
    ? owner[UserListId.Seen]
    : {};
  return {
    bothWant: overlap(ownerWatchlist, visitor[UserListId.Watchlist]),
    bothSeen: overlap(ownerSeen, visitor[UserListId.Seen]),
    theyveSeenYouWant: overlap(ownerSeen, visitor[UserListId.Watchlist]),
    youveSeenTheyWant: overlap(ownerWatchlist, visitor[UserListId.Seen]),
  };
}

export const isEmptyComparison = (comparison: ProfileComparison) =>
  Object.values(comparison).every((films) => films.length === 0);
