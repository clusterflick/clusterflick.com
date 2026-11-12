"use client";

import { useMemo, useState } from "react";
import { ButtonLink } from "@/components/button";
import ContentSection from "@/components/content-section";
import PosterTile, { PosterTileList } from "@/components/poster-tile";
import { useCinemaData } from "@/state/cinema-data-context";
import { useUserContext } from "@/state/user-context";
import { getMovieUrl } from "@/utils/get-movie-url";
import { getMoviesFilterUrl } from "@/lib/filters/modules/movies";
import type { UserLists } from "@/lib/user-lists";
import { ProfileSectionId, type ProfileSections } from "@/lib/user-profile";
import {
  compareProfileLists,
  isEmptyComparison,
  type ComparedFilm,
} from "@/lib/user-profile/compare";
import { getBookable } from "@/lib/user-profile/showing-this-week";
import personaliseStyles from "@/app/personalise/page.module.css";
import styles from "./profile-comparison.module.css";

/** Posters drawn per group before the rest are counted. */
const GROUP_LIMIT = 8;

const PERSONALISE_PATH = "/personalise/";

/**
 * What the visitor has in common with the profile's owner, above the
 * owner's lists: films they both want to see, with the planner on those
 * that are showing, films they've both seen, and each one's films the other
 * has seen. Worked out in the visitor's browser from their own lists, which
 * every page already has, against what the profile shows; see
 * `compareProfileLists` for why only the lists shown are compared.
 *
 * Signed out, it's an invitation instead, since the comparison is the
 * clearest reason to keep lists of one's own. Not drawn for the owner, nor
 * when the profile shows neither list.
 */
export default function ProfileComparison({
  ownerName,
  lists,
  sections,
  isOwner,
}: {
  ownerName: string;
  lists: UserLists;
  sections: ProfileSections;
  isOwner: boolean;
}) {
  const { status, lists: visitorLists } = useUserContext();
  const { movies } = useCinemaData();
  // Fixed for the visit, as the lists' own "now" is.
  const [now] = useState(() => Date.now());

  const comparison = useMemo(
    () => visitorLists && compareProfileLists(lists, sections, visitorLists),
    [lists, sections, visitorLists],
  );

  const showsAList =
    sections[ProfileSectionId.Watchlist] || sections[ProfileSectionId.Seen];
  if (isOwner || !showsAList) return null;

  if (status !== "signed-in") {
    if (status === "checking") return null;
    return (
      <aside className={styles.invitation}>
        <p className={styles.invitationText}>
          Keep a watchlist of your own to see what you have in common with{" "}
          {ownerName}: the films you both want to see, and the ones you&apos;ve
          both seen.
        </p>
        <ButtonLink href={PERSONALISE_PATH} size="sm">
          Start your lists
        </ButtonLink>
      </aside>
    );
  }

  // Still loading the visitor's lists.
  if (!comparison) return null;

  const title = `You and ${ownerName}`;
  if (isEmptyComparison(comparison)) {
    return (
      <ContentSection title={title}>
        <p className={styles.nothing}>
          No films in common yet. Anything you both want to see, or have both
          seen, will show here.
        </p>
      </ContentSection>
    );
  }

  // The films both want to see that can be booked, first, and the planner
  // on just those: the reason to go together.
  const bothWantShowing = getBookable(
    movies,
    comparison.bothWant.map(({ id }) => id),
    now,
  );
  const showingFirst = (films: ComparedFilm[]) => {
    const showing = new Set(bothWantShowing);
    return [
      ...films.filter(({ id }) => showing.has(id)),
      ...films.filter(({ id }) => !showing.has(id)),
    ];
  };

  const groups: {
    key: string;
    title: string;
    films: ComparedFilm[];
    action?: React.ReactNode;
  }[] = [
    {
      key: "both-want",
      title: "You both want to see",
      films: showingFirst(comparison.bothWant),
      action: bothWantShowing.length > 0 && (
        <span className={styles.groupAction}>
          <span className={styles.groupNote}>
            {bothWantShowing.length === 1
              ? "1 is showing"
              : `${bothWantShowing.length} are showing`}
          </span>
          <ButtonLink
            href={getMoviesFilterUrl("/planner", bothWantShowing)}
            size="sm"
          >
            Plan together
          </ButtonLink>
        </span>
      ),
    },
    {
      key: "both-seen",
      title: "You've both seen",
      films: comparison.bothSeen,
    },
    {
      key: "theyve-seen",
      title: `On your watchlist, seen by ${ownerName}`,
      films: comparison.theyveSeenYouWant,
    },
    {
      key: "youve-seen",
      title: `Seen by you, on ${ownerName}'s watchlist`,
      films: comparison.youveSeenTheyWant,
    },
  ];

  return (
    <ContentSection title={title}>
      <div className={styles.groups}>
        {groups
          .filter(({ films }) => films.length > 0)
          .map(({ key, title: groupTitle, films, action }) => (
            <div
              key={key}
              className={styles.group}
              style={
                {
                  "--count": Math.min(films.length, GROUP_LIMIT),
                } as React.CSSProperties
              }
            >
              <div className={styles.groupHeader}>
                <h3 className={personaliseStyles.groupTitle}>
                  {groupTitle}{" "}
                  <span className={styles.groupCount}>{films.length}</span>
                </h3>
                {action}
              </div>
              <div className={personaliseStyles.lane}>
                <PosterTileList className={styles.tiles}>
                  {films.slice(0, GROUP_LIMIT).map(({ id, entry }) => {
                    const showing = movies[id];
                    return (
                      <PosterTile
                        key={id}
                        title={entry.title}
                        posterPath={showing?.posterPath ?? entry.posterPath}
                        includedMovies={showing?.includedMovies}
                        href={showing ? getMovieUrl(showing) : undefined}
                        details={entry.year ? [entry.year] : undefined}
                      />
                    );
                  })}
                </PosterTileList>
              </div>
              {films.length > GROUP_LIMIT && (
                <p className={styles.more}>
                  And {films.length - GROUP_LIMIT} more.
                </p>
              )}
            </div>
          ))}
      </div>
    </ContentSection>
  );
}
