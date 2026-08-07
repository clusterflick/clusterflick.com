import type { Metadata } from "next";
import Link from "next/link";
import StandardPageLayout from "@/components/standard-page-layout";
import OutlineHeading from "@/components/outline-heading";
import MoviePoster from "@/components/movie-poster";
import StackedPoster from "@/components/stacked-poster";
import EmptyState from "@/components/empty-state";
import { getStaticData } from "@/utils/get-static-data";
import {
  buildUpdates,
  pluralise,
  readDiffBlobs,
  summariseRelease,
} from "@/utils/get-updates";
import type { UpdateFilm } from "@/utils/get-updates";
import { formatDateLong, formatShowingTime } from "@/utils/format-date";
import VenueList from "./venue-list";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Recently Added London Cinema Listings",
  description:
    "New films, new showings and new venues added to Clusterflick's London cinema listings, updated with every run of the data pipeline.",
  alternates: {
    canonical: "/updates",
    // Autodiscovery: this is what a reader looks for when given the page URL,
    // and matters more than the feed's path.
    types: {
      "application/rss+xml": [
        { url: "/updates/feed.xml", title: "Clusterflick — Updates" },
      ],
    },
  },
  openGraph: {
    title: "Recently Added London Cinema Listings | Clusterflick",
    description:
      "New films, new showings and new venues added to Clusterflick's London cinema listings.",
    url: "https://clusterflick.com/updates",
    siteName: "Clusterflick",
  },
  twitter: {
    card: "summary",
    title: "Recently Added London Cinema Listings | Clusterflick",
    description:
      "New films, new showings and new venues added to Clusterflick's London cinema listings.",
    creator: "@clusterflick",
  },
};

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

export default async function UpdatesPage() {
  const data = await getStaticData();
  const releases = buildUpdates(readDiffBlobs(), data);

  return (
    <StandardPageLayout
      title="Updates"
      subtitle="New films, new showings and new venues, each time the listings are refreshed."
      heroExtra={
        <p className={styles.heroNote}>
          Listings are refreshed automatically throughout the day —{" "}
          <Link href="/about#behind-the-scenes">see how it works</Link>, or{" "}
          <a
            href="/updates/feed.xml"
            type="application/rss+xml"
            target="_blank"
            className={styles.feedLink}
          >
            subscribe via RSS
          </a>
          .
        </p>
      }
      backUrl="/"
      backText="Back to home"
    >
      {releases.length === 0 ? (
        <EmptyState
          variant="contained"
          icon={{
            src: "/images/icons/neon-clapper.svg",
            width: 120,
            height: 120,
          }}
          title="Nothing new yet"
          message="Updates appear here after the next run of the listings pipeline."
        />
      ) : (
        <ol className={styles.timeline}>
          {releases.map((release) => {
            const published = new Date(release.asOf);
            return (
              <li key={release.tag} id={release.tag} className={styles.release}>
                <OutlineHeading
                  as="h2"
                  color="blue"
                  className={styles.releaseHeading}
                >
                  {`${formatDateLong(published)} @ ${formatShowingTime(
                    published.getTime(),
                  )}`}
                </OutlineHeading>
                <p className={styles.releaseSummary}>
                  {summariseRelease(release)}
                </p>

                {release.newVenues.length > 0 && (
                  <section className={styles.section}>
                    <h3 className={styles.sectionHeading}>
                      {release.newVenues.length === 1
                        ? "New venue"
                        : "New venues"}
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
                    <ul className={styles.tiles}>
                      {release.newFilms.map((film) => (
                        <FilmTile key={film.key} film={film} />
                      ))}
                    </ul>
                  </section>
                )}

                {release.moreShowings.length > 0 && (
                  <section className={styles.section}>
                  <h3 className={styles.sectionHeading}>More showings</h3>
                    <ul className={styles.showings}>
                      {release.moreShowings.map((film) => (
                        <li key={film.key} className={styles.showing}>
                          {film.href ? (
                            <Link href={film.href}>{film.title}</Link>
                          ) : (
                            film.title
                          )}
                          {" — "}
                          {pluralise(film.performanceCount, "new showing")}
                          {" at "}
                          {/* One venue names itself; more than one leads with
                              the count, so the reach is clear before the list */}
                          {film.venues.length > 1 && (
                            <>{pluralise(film.venues.length, "venue")}: </>
                          )}
                          <VenueList
                            venues={film.venues}
                            className={styles.venueLinks}
                          />
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </StandardPageLayout>
  );
}
