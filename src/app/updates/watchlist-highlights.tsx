"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import Button from "@/components/button";
import EventPoster from "@/components/event-poster";
import { useUserContext } from "@/state/user-context";
import { UserListId } from "@/lib/user-lists";
// From its module rather than the filters barrel, which would bundle the whole
// filter engine into this page
import { getMoviesFilterUrl } from "@clusterflick/catalogue/filters/modules/movies";
import type { DayFilm } from "@/utils/get-updates";
import styles from "./updates.module.css";

/** A watchlist rarely meets a day this often; past two rows, ask first. */
const INITIAL_COUNT = 6;

/** Films shown on a phone before the button, where the grid is one column and
 *  six made the panel a screen tall above the day's runs. Matches
 *  `.watchlistPhoneCapped` in updates.module.css, which can't read it:
 *  `nth-child` takes no variables. CSS rather than a smaller slice, as in
 *  `CappedList`, so the cap follows the width without a resize listener. */
const PHONE_COUNT = 3;

// get-updates.ts reads from disk, so its `pluralise` can't come to the browser
const count = (value: number, word: string) =>
  `${value.toLocaleString("en-GB")} ${word}${value === 1 ? "" : "s"}`;

/**
 * The films on the reader's watchlist that the day changed, above the day's
 * runs: the one thing on the page that is about them.
 *
 * Signed-in only, and drawn once the lists have loaded, so the static HTML
 * (always signed out) is unchanged and nobody sees an empty slot. Hidden when
 * the day touched nothing on the list. The same films are marked where they
 * appear below, on the poster or after the title, so the panel and the runs
 * agree about which they are.
 */
export default function WatchlistHighlights({
  films,
  headingLevel,
}: {
  films: DayFilm[];
  /** 3 on the index, under the day's h2; 2 on a day's own page. */
  headingLevel: 2 | 3;
}) {
  const { status, lists } = useUserContext();
  const [showAll, setShowAll] = useState(false);

  if (status !== "signed-in" || !lists) return null;
  const watchlist = lists[UserListId.Watchlist];
  const matches = films.filter(({ movieId }) => watchlist[movieId]);
  if (matches.length === 0) return null;

  // Collapsing to hide a single film costs a click and saves nothing
  const isCollapsed = !showAll && matches.length > INITIAL_COUNT + 1;
  const visible = isCollapsed ? matches.slice(0, INITIAL_COUNT) : matches;
  const isPhoneCollapsed = !showAll && matches.length > PHONE_COUNT + 1;
  const Heading = `h${headingLevel}` as const;

  return (
    <section
      className={styles.watchlist}
      aria-labelledby="watchlist-highlights"
    >
      <div className={styles.watchlistHeader}>
        <div className={styles.watchlistTitles}>
          <p className={styles.watchlistEyebrow}>From your watchlist</p>
          <Heading
            id="watchlist-highlights"
            className={styles.watchlistHeading}
          >
            {count(matches.length, "film")} on your watchlist got new screenings
          </Heading>
        </div>
        <Link
          href={getMoviesFilterUrl(
            "/planner",
            matches.map(({ movieId }) => movieId),
          )}
        >
          {matches.length === 1 ? "Plan this film" : "Plan these films"}
        </Link>
      </div>

      <ul
        className={clsx(
          styles.watchlistFilms,
          isPhoneCollapsed && styles.watchlistPhoneCapped,
        )}
      >
        {visible.map((film) => (
          <li key={film.movieId} className={styles.watchlistFilm}>
            <div className={styles.watchlistPoster}>
              <EventPoster
                title={film.title}
                posterPath={film.posterPath}
                includedMovies={film.includedMovies}
                size="xsmall"
                fluid
                interactive={false}
              />
            </div>
            <div className={styles.watchlistText}>
              {film.href ? (
                <Link href={film.href}>{film.title}</Link>
              ) : (
                <span className={styles.watchlistTitle}>{film.title}</span>
              )}
              <span>
                {film.isNew
                  ? `Now showing: ${count(film.performanceCount, "screening")}`
                  : count(film.performanceCount, "new screening")}
              </span>
              <span className={styles.watchlistVenue}>
                {film.soleVenue ?? count(film.venueCount, "venue")}
              </span>
            </div>
          </li>
        ))}
      </ul>

      {(isCollapsed || isPhoneCollapsed) && (
        <div
          className={clsx(
            styles.watchlistMore,
            !isCollapsed && styles.showMorePhoneOnly,
          )}
        >
          <Button variant="secondary" onClick={() => setShowAll(true)}>
            {`Show all ${count(matches.length, "film")}`}
          </Button>
        </div>
      )}
    </section>
  );
}
