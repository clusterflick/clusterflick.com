import Link from "next/link";
import OutlineHeading from "@/components/outline-heading";
import MoviePoster from "@/components/movie-poster";
import StackedPoster from "@/components/stacked-poster";
import { pluralise, summariseRelease } from "@/utils/get-updates";
import type { UpdateFilm, UpdateRelease } from "@/utils/get-updates";
import { formatDateLong, formatShowingTime } from "@/utils/format-date";
import VenueList from "./venue-list";
import CappedList from "./capped-list";
import styles from "./updates.module.css";

/**
 * How much of a run opens on the page before the reader asks for the rest.
 *
 * A season announcement can add over a hundred films in one run, which is worth
 * a page of its own only if the reader wants it — four rows of posters, or a
 * screenful of showings, is enough to see what kind of run this was.
 */
const INITIAL_FILMS = 24;
const INITIAL_SHOWINGS = 30;

/**
 * A compact poster tile. Venues collapse to a count past the first so a season
 * announcement of thirty films stays scannable rather than filling the page
 * with venue lists.
 *
 * Multi-film events never carry artwork of their own, so they take it from the
 * films inside — stacked when there is more than one to show, as everywhere
 * else on the site, and otherwise the single poster that exists. Only an event
 * with no poster anywhere falls back to the placeholder.
 */
function FilmTile({ film }: { film: UpdateFilm }) {
  const venueLabel =
    film.venues.length === 1
      ? film.venues[0].name
      : pluralise(film.venues.length, "venue");

  const meta = pluralise(film.performanceCount, "showing");

  const includedMovies = film.includedMovies;
  const includedWithPosters = includedMovies?.filter((m) => m.posterPath) ?? [];
  const totalPosters = (film.posterPath ? 1 : 0) + includedWithPosters.length;
  const useStackedPoster =
    includedMovies && includedMovies.length > 1 && totalPosters >= 2;

  const body = (
    <>
      {useStackedPoster ? (
        <StackedPoster
          mainPosterPath={film.posterPath}
          mainTitle={film.title}
          includedMovies={includedMovies}
          size="xsmall"
          interactive={!!film.href}
        />
      ) : (
        <MoviePoster
          posterPath={film.posterPath || includedWithPosters[0]?.posterPath}
          title={film.title}
          size="xsmall"
          interactive={!!film.href}
        />
      )}
      <h4 className={styles.tileTitle}>{film.title}</h4>
      <p className={styles.tileVenue}>{venueLabel}</p>
      <p className={styles.tileMeta}>{meta}</p>
    </>
  );

  return (
    <li className={styles.tile}>
      {film.href ? (
        // The whole tile is one target rather than separate poster and title
        // links. The label replaces the accessible name so a screen reader
        // reads it once, instead of the poster's alt text and the title in turn.
        <Link
          href={film.href}
          className={styles.tileLink}
          aria-label={`${film.title} — ${venueLabel}, ${meta}`}
        >
          {body}
        </Link>
      ) : (
        body
      )}
    </li>
  );
}

/**
 * One pipeline run, headed with its time and anchored at its release tag.
 *
 * Shared by the index — which shows the latest day — and the dated pages, so a
 * run reads identically wherever it is met, and the anchor the feed links to
 * resolves on whichever page happens to be carrying it.
 */
export default function ReleaseSection({
  release,
}: {
  release: UpdateRelease;
}) {
  const published = new Date(release.asOf);

  return (
    <li id={release.tag} className={styles.release}>
      <OutlineHeading as="h2" color="blue" className={styles.releaseHeading}>
        {`${formatDateLong(published)} @ ${formatShowingTime(published.getTime())}`}
      </OutlineHeading>
      <p className={styles.releaseSummary}>{summariseRelease(release)}</p>

      {release.newVenues.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionHeading}>
            {release.newVenues.length === 1 ? "New venue" : "New venues"}
          </h3>
          <p className={styles.prose}>
            <VenueList venues={release.newVenues} />
          </p>
        </section>
      )}

      {release.newFilms.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionHeading}>
            {pluralise(release.newFilms.length, "new film")}
          </h3>
          <CappedList
            className={styles.tiles}
            initialCount={INITIAL_FILMS}
            showAllLabel={`Show all ${pluralise(release.newFilms.length, "new film")}`}
            items={release.newFilms.map((film) => (
              <FilmTile key={film.key} film={film} />
            ))}
          />
        </section>
      )}

      {release.moreShowings.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.sectionHeading}>More showings</h3>
          <CappedList
            className={styles.showings}
            initialCount={INITIAL_SHOWINGS}
            showAllLabel={`Show all ${pluralise(release.moreShowings.length, "film")}`}
            items={release.moreShowings.map((film) => (
              <li key={film.key} className={styles.showing}>
                {film.href ? (
                  <Link href={film.href}>{film.title}</Link>
                ) : (
                  film.title
                )}
                {" — "}
                {pluralise(film.performanceCount, "new showing")}
                {" at "}
                {/* One venue names itself; more than one leads with the count,
                    so the reach is clear before the list */}
                {film.venues.length > 1 && (
                  <>{pluralise(film.venues.length, "venue")}: </>
                )}
                <VenueList venues={film.venues} className={styles.venueLinks} />
              </li>
            ))}
          />
        </section>
      )}
    </li>
  );
}
