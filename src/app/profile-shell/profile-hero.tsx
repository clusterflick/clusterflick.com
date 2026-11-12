"use client";

import { useMemo, type ReactNode } from "react";
import Link from "next/link";
import clsx from "clsx";
import MoviePoster from "@/components/movie-poster";
import OutlineHeading from "@/components/outline-heading";
import { useCinemaData } from "@/state/cinema-data-context";
import { getMovieUrl } from "@/utils/get-movie-url";
import { GENRES } from "@/data/genres";
import { UserListId, type UserLists } from "@/lib/user-lists";
import type { FilmDetailsData } from "@/lib/user-lists/film-details";
import { getSeenStats } from "@/lib/user-lists/seen-stats";
import {
  getTasteLine,
  ProfileSectionId,
  type FavouriteFilm,
  type ProfileLinks,
  type ProfileSections,
} from "@/lib/user-profile";
import { MIN_STATS_FILMS } from "@/app/personalise/seen-stats";
import { getProfileHeading, ProfileLinksRow } from "./profile-view";
import styles from "./profile-hero.module.css";

const GENRE_NAMES = Object.fromEntries(
  GENRES.map(({ id, name }) => [id, name]),
);

const posterUrl = (path: string) => `https://image.tmdb.org/t/p/w342${path}`;

/**
 * The top of a profile: the reader's favourite films fanned out large over
 * a blurred wash of their posters, as the home page's carousel washes its
 * poster behind it, then the name, the line under it, a line of their taste
 * from the stats, and their links. The favourites make each profile look
 * like its owner, which a heading alone can't. Without favourites it's the
 * name over the site's usual backdrop.
 *
 * Drawn by the profile page and by the preview beside the settings, so the
 * two can't differ.
 */
export default function ProfileHero({
  handle,
  displayName,
  links,
  favourites,
  sections,
  lists,
  filmDetails,
  actions,
}: {
  handle: string;
  displayName?: string;
  links: ProfileLinks;
  favourites: FavouriteFilm[];
  sections: ProfileSections;
  lists: UserLists;
  filmDetails: FilmDetailsData;
  /** The owner's own buttons, under everything else. */
  actions?: ReactNode;
}) {
  const { movies } = useCinemaData();
  const { title, subtitle } = getProfileHeading({
    handle,
    displayName,
    sections,
    lists,
  });

  // Only with the stats shown, since it's drawn from them, and from as many
  // films as the stats themselves need.
  const seen = lists[UserListId.Seen];
  const taste = useMemo(() => {
    if (!sections[ProfileSectionId.SeenStats]) return null;
    if (Object.keys(seen).length < MIN_STATS_FILMS) return null;
    return getTasteLine(getSeenStats(seen, filmDetails, GENRE_NAMES));
  }, [sections, seen, filmDetails]);

  // A film that's showing may have a newer poster than its snapshot.
  const posters = favourites.map((film) => ({
    film,
    showing: movies[film.id],
    posterPath: movies[film.id]?.posterPath ?? film.posterPath,
  }));
  const washed = posters.flatMap(({ posterPath }) =>
    posterPath ? [posterPath] : [],
  );

  return (
    <header className={clsx(styles.hero, posters.length > 0 && styles.withFan)}>
      <div className={styles.wash} aria-hidden="true">
        {washed.length > 0 ? (
          washed.map((path, index) => (
            <div
              key={path}
              className={styles.washLayer}
              style={{
                backgroundImage: `url(${posterUrl(path)})`,
                left: `${(index / washed.length) * 100}%`,
                width: `${100 / washed.length}%`,
              }}
            />
          ))
        ) : (
          <div className={clsx(styles.washLayer, styles.washDefault)} />
        )}
      </div>

      <div className={styles.content}>
        {posters.length > 0 && (
          <ol
            className={styles.fan}
            aria-label="Favourite films"
            data-count={posters.length}
          >
            {posters.map(({ film, showing, posterPath }, index) => {
              const poster = (
                <MoviePoster
                  title={film.title}
                  posterPath={posterPath}
                  showOverlay={!posterPath}
                  interactive={false}
                  fluid
                  priority={index === 0}
                  headingLevel="h3"
                />
              );
              const label = film.year
                ? `${film.title} (${film.year})`
                : film.title;
              return (
                <li key={film.id} className={styles.fanItem}>
                  {showing ? (
                    <Link
                      href={getMovieUrl(showing)}
                      className={styles.fanLink}
                      aria-label={`${label}, showing now`}
                      title={label}
                    >
                      {poster}
                    </Link>
                  ) : (
                    <span
                      className={styles.fanLink}
                      role="img"
                      aria-label={label}
                      title={label}
                    >
                      {poster}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        )}

        <OutlineHeading className={styles.title}>{title}</OutlineHeading>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        {taste && <p className={styles.taste}>{taste}</p>}
        <ProfileLinksRow links={links} />
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </header>
  );
}
