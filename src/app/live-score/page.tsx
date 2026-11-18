import type { Metadata } from "next";
import Link from "next/link";
import { getStaticData } from "@/utils/get-static-data";
import {
  getLiveScoreMovies,
  LIVE_SCORE_FILTER_PARAMS,
  LIVE_SCORE_URL,
} from "@/utils/get-live-score-movies";
import { getOccasionsUrl } from "@/utils/get-discovery-movies";
import { buildHubScreeningEvents } from "@/utils/build-hub-screening-events";
import { getVenueUrl } from "@clusterflick/catalogue/utils/get-venue-url";
import { getVenueImagePath } from "@/utils/get-venue-image";
import { getMovieUrl } from "@clusterflick/catalogue/utils/get-movie-url";
import EventDetailPageContent from "@/components/event-detail-page-content";
import styles from "./page.module.css";

/**
 * Films screened with live music: silents with a pianist or band, and films
 * "in concert" with an orchestra. A landing page for a search other listings
 * serve badly, built like a format page. The occasion is the pipeline's
 * (`performance.occasions.liveScore`), so the page is exactly what the
 * catalogue's live-score filter finds.
 */

/** The `<title>`: what a reader searches for, silents being most of it. */
const PAGE_TITLE = "Silent Film & Live Score Screenings in London";
const HEADING = "Films with a Live Score";
const DESCRIPTION =
  "Silent films with live piano, band or orchestra, and films in concert, across London — every screening with a live score, and the venues running them, updated daily.";
const BROWSE_HREF = `/catalogue?${LIVE_SCORE_FILTER_PARAMS}`;

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: DESCRIPTION,
  alternates: { canonical: LIVE_SCORE_URL },
  openGraph: {
    title: `${PAGE_TITLE} | Clusterflick`,
    description: DESCRIPTION,
    url: `https://clusterflick.com${LIVE_SCORE_URL}`,
    siteName: "Clusterflick",
  },
  twitter: {
    card: "summary",
    title: `${PAGE_TITLE} | Clusterflick`,
    description: DESCRIPTION,
    creator: "@clusterflick",
  },
};

export default async function LiveScorePage() {
  const data = await getStaticData();
  const nowTs = new Date(data.generatedAt).getTime();

  // Soonest first, not busiest: nearly every one is a single night, so the
  // order that matters is which is coming up. A fresh array, so sorting it
  // leaves the shared dataset alone.
  const liveScoreMovies = getLiveScoreMovies(data.movies, nowTs);
  const nextTime = ({ movie }: (typeof liveScoreMovies)[number]) =>
    Math.min(...movie.performances.map((perf) => perf.time));
  liveScoreMovies.sort(
    (a, b) =>
      nextTime(a) - nextTime(b) ||
      a.movie.normalizedTitle.localeCompare(b.movie.normalizedTitle),
  );

  const movieCount = liveScoreMovies.length;
  const performanceCount = liveScoreMovies.reduce(
    (sum, { performanceCount: count }) => sum + count,
    0,
  );

  // `liveScoreMovies` is pruned to live-score performances, so every
  // performance here has one.
  const venueFilmSets = new Map<string, Set<string>>();
  const venuePerfCounts = new Map<string, number>();

  for (const { movie } of liveScoreMovies) {
    for (const perf of movie.performances) {
      const showing = movie.showings[perf.showingId];
      if (showing) {
        const { venueId } = showing;
        if (!venueFilmSets.has(venueId)) venueFilmSets.set(venueId, new Set());
        venueFilmSets.get(venueId)!.add(movie.id);
        venuePerfCounts.set(venueId, (venuePerfCounts.get(venueId) ?? 0) + 1);
      }
    }
  }

  const venues = [...venueFilmSets.entries()]
    .map(([venueId, films]) => {
      const venue = data.venues[venueId];
      return {
        id: venueId,
        name: venue?.name ?? venueId,
        href: venue ? getVenueUrl(venue) : "#",
        type: venue?.type ?? "Other",
        imagePath: getVenueImagePath(venueId),
        filmCount: films.size,
        performanceCount: venuePerfCounts.get(venueId) ?? 0,
      };
    })
    .sort((a, b) => b.filmCount - a.filmCount || a.name.localeCompare(b.name))
    .slice(0, 24);

  const GRID_MOVIE_LIMIT = 72;
  const gridMovies = liveScoreMovies.slice(0, GRID_MOVIE_LIMIT);
  const gridMoviesTruncated = liveScoreMovies.length > GRID_MOVIE_LIMIT;

  const backdropPoster = liveScoreMovies
    .map(
      ({ movie }) =>
        movie.posterPath ??
        movie.includedMovies?.find((m) => m.posterPath)?.posterPath,
    )
    .find(Boolean);
  const heroBackgroundImage = backdropPoster
    ? `https://image.tmdb.org/t/p/w780${backdropPoster}`
    : undefined;

  const heroBlurb = (
    <div className={styles.heroBlurb}>
      <p>
        Screenings with the music played live in the room: silent films
        accompanied by a pianist, a band or an orchestra, as they were first
        shown, and films &ldquo;in concert&rdquo;, with an orchestra playing the
        score under the picture. Most are a single night, so they&apos;re listed
        soonest first.
      </p>
      <p>
        <Link href={BROWSE_HREF}>Browse every live score screening →</Link>
      </p>
      <p className={styles.related}>
        See also: <Link href="/formats/35mm">35mm</Link>,{" "}
        <Link href="/formats/16mm">16mm</Link>,{" "}
        <Link href={getOccasionsUrl()}>
          every screening that&apos;s more than a screening
        </Link>
      </p>
    </div>
  );

  const fullCanonicalUrl = `https://clusterflick.com${LIVE_SCORE_URL}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: PAGE_TITLE,
      description: DESCRIPTION,
      url: fullCanonicalUrl,
      isPartOf: {
        "@type": "WebSite",
        name: "Clusterflick",
        url: "https://clusterflick.com",
      },
      ...(movieCount > 0 && {
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: movieCount,
          itemListElement: gridMovies.slice(0, 50).map(({ movie }, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: `https://clusterflick.com${getMovieUrl(movie)}`,
            name: movie.title,
          })),
        },
      }),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://clusterflick.com",
        },
        // Filed under formats, which link to it: a live score is how a
        // film is presented, if not a format the data records as one.
        {
          "@type": "ListItem",
          position: 2,
          name: "Formats",
          item: "https://clusterflick.com/formats",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: HEADING,
          item: fullCanonicalUrl,
        },
      ],
    },
    ...buildHubScreeningEvents(
      liveScoreMovies.map(({ movie }) => movie),
      data.venues,
    ),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <EventDetailPageContent
        name={HEADING}
        url=""
        imagePath={null}
        movieCount={movieCount}
        performanceCount={performanceCount}
        updatedAt={data.generatedAt}
        backUrl="/formats"
        backText="All formats"
        gridMovies={gridMovies}
        gridMoviesTruncated={gridMoviesTruncated}
        movieUrlParams={LIVE_SCORE_FILTER_PARAMS}
        Blurb={null}
        heroChildren={heroBlurb}
        venuesLayout="grid"
        isAlias={false}
        canonicalUrl={LIVE_SCORE_URL}
        venues={venues}
        cinemasSectionTitle="Venues with live score screenings"
        filmsSectionTitle={PAGE_TITLE}
        filmsExploreHref={BROWSE_HREF}
        filmsExploreLabel="Start exploring live score screenings"
        heroBackgroundImage={heroBackgroundImage}
        heroBackgroundImageAlt={PAGE_TITLE}
      />
    </>
  );
}
