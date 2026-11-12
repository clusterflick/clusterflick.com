"use client";

import {
  UserListId,
  type FavouriteVenues,
  type UserLists,
} from "@/lib/user-lists";
import type { FilmDetailsData } from "@/lib/user-lists/film-details";
import { ProfileSectionId, type ProfileSections } from "@/lib/user-profile";
import {
  FavouriteVenuesSection,
  UserListSection,
} from "@/app/personalise/page-content";
import SeenStats, {
  type MovieListProgressItem,
} from "@/app/personalise/seen-stats";
import personaliseStyles from "@/app/personalise/page.module.css";

function plural(count: number, one: string, many: string) {
  return `${count.toLocaleString("en-GB")} ${count === 1 ? one : many}`;
}

/**
 * The line under the handle: the counts the shown sections give away anyway.
 * The stats count the Seen list, so they show its count too. Undefined when
 * nothing shown has one.
 */
export function getProfileSubtitle(
  sections: ProfileSections,
  lists: UserLists,
): string | undefined {
  const parts = [
    ...(sections[ProfileSectionId.Seen] || sections[ProfileSectionId.SeenStats]
      ? [
          `${plural(
            Object.keys(lists[UserListId.Seen]).length,
            "film",
            "films",
          )} seen`,
        ]
      : []),
    ...(sections[ProfileSectionId.Watchlist]
      ? [
          `${plural(
            Object.keys(lists[UserListId.Watchlist]).length,
            "film",
            "films",
          )} on the watchlist`,
        ]
      : []),
  ];
  return parts.length > 0 ? parts.join(", ") : undefined;
}

/**
 * A public profile's sections, read only, as `/personalise` shows the owner
 * their own: the Seen stats, the watchlist, the favourite venues and the Seen
 * list, in that order, each only if shown. Drawn by the profile page and by
 * the preview beside the profile settings, so the preview is the page.
 */
export default function ProfileView({
  sections,
  lists,
  favouriteVenues,
  filmDetails,
  venueImagePaths,
  movieLists,
}: {
  sections: ProfileSections;
  lists: UserLists;
  favouriteVenues: FavouriteVenues;
  filmDetails: FilmDetailsData;
  venueImagePaths: Record<string, string>;
  movieLists: MovieListProgressItem[];
}) {
  const shown = (id: ProfileSectionId) => sections[id];
  return (
    <div className={personaliseStyles.wide}>
      {shown(ProfileSectionId.SeenStats) && (
        <SeenStats
          seen={lists[UserListId.Seen]}
          movieLists={movieLists}
          details={filmDetails}
        />
      )}
      {shown(ProfileSectionId.Watchlist) && (
        <UserListSection
          listId={UserListId.Watchlist}
          lists={lists}
          showEditing={false}
          publicView
        />
      )}
      {shown(ProfileSectionId.FavouriteVenues) && (
        <FavouriteVenuesSection
          favouriteVenues={favouriteVenues}
          showEditing={false}
          venueImagePaths={venueImagePaths}
          publicView
        />
      )}
      {shown(ProfileSectionId.Seen) && (
        <UserListSection
          listId={UserListId.Seen}
          lists={lists}
          showEditing={false}
          publicView
        />
      )}
    </div>
  );
}
