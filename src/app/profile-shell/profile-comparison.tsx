"use client";

import { useMemo, useState, type CSSProperties } from "react";
import Button, { ButtonLink } from "@/components/button";
import ContentSection from "@/components/content-section";
import PosterStack, { type PosterStackItem } from "@/components/poster-stack";
import PosterTile, { PosterTileList } from "@/components/poster-tile";
import { CloseIcon } from "@/components/icons";
import { useCinemaData } from "@/state/cinema-data-context";
import { useUserContext } from "@/state/user-context";
import { getMovieUrl } from "@/utils/get-movie-url";
import { getMoviesFilterUrl } from "@/lib/filters/modules/movies";
import type { UserLists } from "@/lib/user-lists";
import { ProfileSectionId, type ProfileSections } from "@/lib/user-profile";
import {
  compareProfileLists,
  type ComparedFilm,
} from "@/lib/user-profile/compare";
import { getBookable } from "@/lib/user-profile/showing-this-week";
import personaliseStyles from "@/app/personalise/page.module.css";
import {
  dismissComparison,
  dismissSignUp,
  isComparisonDismissed,
  isSignUpDismissed,
} from "./comparison-dismissals";
import styles from "./profile-comparison.module.css";

const PERSONALISE_PATH = "/personalise/";

/** Most a group's share of the row is sized for; past it, it's a pile. */
const GROUP_WIDTH_LIMIT = 8;

/**
 * What a visitor has in common with the profile's owner, offered rather than
 * shown: they came to see the owner, so the top of the page is a small card
 * they can act on or dismiss, not the overlap itself.
 *
 * - Signed out, the card invites them to keep lists of their own, the
 *   comparison being the clearest reason to, and leads to /personalise.
 * - Signed in, it says how many films they share and offers to compare;
 *   comparing swaps the card for the films, in groups (both want to see,
 *   with the planner on those showing; both seen; and each one's films the
 *   other has seen). Hiding them brings the card back.
 *
 * Either card can be dismissed: the sign-up one for every profile, the
 * compare one for this profile only, since another reader's overlap may be
 * wanted. Remembered in this browser, as a preference about the page rather
 * than anything about the reader's lists. Never drawn for the owner, nor
 * when the profile shows neither list; see `compareProfileLists` for why
 * only lists shown are compared.
 */
export default function ProfileComparison({
  handle,
  ownerName,
  lists,
  sections,
  isOwner,
}: {
  handle: string;
  ownerName: string;
  lists: UserLists;
  sections: ProfileSections;
  isOwner: boolean;
}) {
  const { status, lists: visitorLists } = useUserContext();
  const { movies } = useCinemaData();
  // Fixed for the visit, as the lists' own "now" is.
  const [now] = useState(() => Date.now());
  // The page is drawn only in the browser, after its data is read, so
  // storage can be read as it mounts.
  const [signUpDismissed, setSignUpDismissed] = useState(isSignUpDismissed);
  const [comparisonDismissed, setComparisonDismissed] = useState(() =>
    isComparisonDismissed(handle),
  );
  const [comparing, setComparing] = useState(false);

  const comparison = useMemo(
    () => visitorLists && compareProfileLists(lists, sections, visitorLists),
    [lists, sections, visitorLists],
  );

  const showsAList =
    sections[ProfileSectionId.Watchlist] || sections[ProfileSectionId.Seen];
  if (isOwner || !showsAList || status === "checking") return null;

  if (status !== "signed-in") {
    if (signUpDismissed) return null;
    return (
      <Card
        onDismiss={() => {
          dismissSignUp();
          setSignUpDismissed(true);
        }}
      >
        <p className={styles.cardText}>
          Keep a watchlist of your own to see what you have in common with{" "}
          <span className={styles.name}>{ownerName}</span>.
        </p>
        <ButtonLink href={PERSONALISE_PATH} size="sm">
          Start your lists
        </ButtonLink>
      </Card>
    );
  }

  // Still loading the visitor's lists.
  if (!comparison) return null;

  const inCommon = new Set(
    Object.values(comparison).flatMap((films) => films.map(({ id }) => id)),
  ).size;

  if (!comparing) {
    if (comparisonDismissed) return null;
    return (
      <Card
        onDismiss={() => {
          dismissComparison(handle);
          setComparisonDismissed(true);
        }}
      >
        <p className={styles.cardText}>
          {inCommon === 0 ? (
            <>
              No films in common with{" "}
              <span className={styles.name}>{ownerName}</span> yet.
            </>
          ) : (
            <>
              You have {inCommon === 1 ? "1 film" : `${inCommon} films`} in
              common with <span className={styles.name}>{ownerName}</span>.
            </>
          )}
        </p>
        {inCommon > 0 && (
          <Button size="sm" onClick={() => setComparing(true)}>
            Compare
          </Button>
        )}
      </Card>
    );
  }

  // The films both want to see that can be booked come first, with the
  // planner on just those: the reason to go together.
  const bothWantShowing = getBookable(
    movies,
    comparison.bothWant.map(({ id }) => id),
    now,
  );
  const showing = new Set(bothWantShowing);
  const bothWant = [
    ...comparison.bothWant.filter(({ id }) => showing.has(id)),
    ...comparison.bothWant.filter(({ id }) => !showing.has(id)),
  ];

  const groups: {
    title: string;
    films: ComparedFilm[];
    after?: React.ReactNode;
  }[] = [
    {
      title: "You both want to see",
      films: bothWant,
      after: bothWantShowing.length > 0 && (
        <p className={styles.plan}>
          <span>
            {bothWantShowing.length === 1
              ? "1 is showing."
              : `${bothWantShowing.length} are showing.`}
          </span>
          <ButtonLink
            href={getMoviesFilterUrl("/planner", bothWantShowing)}
            size="sm"
          >
            Plan together
          </ButtonLink>
        </p>
      ),
    },
    { title: "You've both seen", films: comparison.bothSeen },
    {
      title: `On your watchlist, seen by ${ownerName}`,
      films: comparison.theyveSeenYouWant,
    },
    {
      title: `Seen by you, on ${ownerName}'s watchlist`,
      films: comparison.youveSeenTheyWant,
    },
  ];

  const toStackItems = (films: ComparedFilm[]): PosterStackItem[] =>
    films.map(({ id, entry }) => ({
      id,
      title: entry.title,
      posterPath: movies[id]?.posterPath ?? entry.posterPath,
      includedMovies: movies[id]?.includedMovies,
    }));

  return (
    <ContentSection
      title={`You and ${ownerName}`}
      action={
        <Button variant="link" onClick={() => setComparing(false)}>
          Hide
        </Button>
      }
    >
      <div className={styles.groups}>
        {groups
          .filter(({ films }) => films.length > 0)
          .map(({ title, films, after }) => (
            <div
              key={title}
              className={styles.group}
              style={
                {
                  "--count": Math.min(films.length, GROUP_WIDTH_LIMIT),
                } as CSSProperties
              }
            >
              <h3 className={personaliseStyles.groupTitle}>
                {title}{" "}
                <span className={styles.groupCount}>{films.length}</span>
              </h3>
              {/* Long groups close to a pile, as the watchlist's do; short
                  ones are drawn as they are. */}
              <PosterStack items={toStackItems(films)} label={title}>
                <div className={personaliseStyles.lane}>
                  <PosterTileList>
                    {films.map(({ id, entry }) => {
                      const film = movies[id];
                      return (
                        <PosterTile
                          key={id}
                          title={entry.title}
                          posterPath={film?.posterPath ?? entry.posterPath}
                          includedMovies={film?.includedMovies}
                          href={film ? getMovieUrl(film) : undefined}
                          details={entry.year ? [entry.year] : undefined}
                        />
                      );
                    })}
                  </PosterTileList>
                </div>
              </PosterStack>
              {after}
            </div>
          ))}
      </div>
    </ContentSection>
  );
}

/** The small card the comparison is offered in, with its dismiss button. */
function Card({
  children,
  onDismiss,
}: {
  children: React.ReactNode;
  onDismiss: () => void;
}) {
  return (
    <aside className={styles.card}>
      <div className={styles.cardBody}>{children}</div>
      <button
        type="button"
        className={styles.dismiss}
        onClick={onDismiss}
        aria-label="Dismiss"
      >
        <CloseIcon size={18} />
      </button>
    </aside>
  );
}
