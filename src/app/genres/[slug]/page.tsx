import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStaticData } from "@/utils/get-static-data";
import { GENRES, resolveGenre, type GenreDefinition } from "@/data/genres";
import { getGenreUrl } from "@/utils/get-genre-url";
import { getGenreMovies } from "@/utils/get-genre-movies";
import { getVenueUrl } from "@/utils/get-venue-url";
import { getVenueImagePath } from "@/utils/get-venue-image";
import { getMovieUrl } from "@/utils/get-movie-url";
import { AccessibilityFeature } from "@/types";
import EventDetailPageContent from "@/components/event-detail-page-content";
import styles from "./page.module.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return GENRES.flatMap((g) => [
    { slug: g.slug },
    ...(g.aliases ?? []).map((alias) => ({ slug: alias })),
  ]);
}

function pageTitle(genre: GenreDefinition): string {
  return `${genre.name} Films Showing in London`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resolved = resolveGenre(slug);

  if (!resolved) {
    return { title: "Genre Not Found" };
  }

  const { genre } = resolved;
  const title = pageTitle(genre);
  const description = genre.seoDescription;
  const canonicalUrl = getGenreUrl(genre);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${title} | Clusterflick`,
      description,
      url: `https://clusterflick.com${canonicalUrl}`,
      siteName: "Clusterflick",
    },
    twitter: {
      card: "summary",
      title: `${title} | Clusterflick`,
      description,
      creator: "@clusterflick",
    },
  };
}

export default async function GenreDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const resolved = resolveGenre(slug);

  if (!resolved) {
    notFound();
  }

  const { genre, isAlias } = resolved;
  const canonicalUrl = getGenreUrl(genre);

  const data = await getStaticData();
  const nowTs = new Date(data.generatedAt).getTime();

  const genreMovies = getGenreMovies(genre.id, data.movies, nowTs);
  genreMovies.sort((a, b) => {
    if (b.performanceCount !== a.performanceCount) {
      return b.performanceCount - a.performanceCount;
    }
    return a.movie.normalizedTitle.localeCompare(b.movie.normalizedTitle);
  });

  const movieCount = genreMovies.length;
  const performanceCount = genreMovies.reduce(
    (sum, { performanceCount: count }) => sum + count,
    0,
  );

  // Aggregate the cinemas and accessibility features across this genre's
  // upcoming performances.
  const venueFilmSets = new Map<string, Set<string>>();
  const venuePerfCounts = new Map<string, number>();
  const accessibilityFeatures = Object.values(AccessibilityFeature);
  const accessibilityFilmSets = new Map(
    accessibilityFeatures.map((f) => [f, new Set<string>()]),
  );
  const accessibilityPerfCounts = new Map(
    accessibilityFeatures.map((f) => [f, 0]),
  );

  for (const { movie } of genreMovies) {
    for (const perf of movie.performances) {
      if (perf.time < nowTs) continue;
      const showing = movie.showings[perf.showingId];
      if (showing) {
        const { venueId } = showing;
        if (!venueFilmSets.has(venueId)) venueFilmSets.set(venueId, new Set());
        venueFilmSets.get(venueId)!.add(movie.id);
        venuePerfCounts.set(venueId, (venuePerfCounts.get(venueId) ?? 0) + 1);
      }
      for (const feature of accessibilityFeatures) {
        if (perf.accessibility?.[feature]) {
          accessibilityFilmSets.get(feature)!.add(movie.id);
          accessibilityPerfCounts.set(
            feature,
            (accessibilityPerfCounts.get(feature) ?? 0) + 1,
          );
        }
      }
    }
  }

  const genreVenues = [...venueFilmSets.entries()]
    .map(([venueId, films]) => {
      const venue = data.venues[venueId];
      return {
        id: venueId,
        name: venue?.name ?? venueId,
        href: venue ? getVenueUrl(venue) : "#",
        type: venue?.type ?? "Unknown",
        imagePath: getVenueImagePath(venueId),
        filmCount: films.size,
        performanceCount: venuePerfCounts.get(venueId) ?? 0,
      };
    })
    .sort((a, b) => b.filmCount - a.filmCount || a.name.localeCompare(b.name))
    .slice(0, 24);

  const genreAccessibilityStats = accessibilityFeatures
    .map((feature) => ({
      feature,
      filmCount: accessibilityFilmSets.get(feature)!.size,
      performanceCount: accessibilityPerfCounts.get(feature) ?? 0,
    }))
    .filter((s) => s.filmCount > 0);

  const GRID_MOVIE_LIMIT = 72;
  const gridMovies = genreMovies.slice(0, GRID_MOVIE_LIMIT);
  const gridMoviesTruncated = genreMovies.length > GRID_MOVIE_LIMIT;

  // Use the poster of the most-performed film (genreMovies is sorted by
  // performance count) as the hero backdrop, falling back to the next film that
  // has a usable poster. Empty genres fall back to the default hero background.
  const backdropPoster = genreMovies
    .map(
      ({ movie }) =>
        movie.posterPath ??
        movie.includedMovies?.find((m) => m.posterPath)?.posterPath,
    )
    .find(Boolean);
  const heroBackgroundImage = backdropPoster
    ? `https://image.tmdb.org/t/p/w780${backdropPoster}`
    : undefined;

  // The "About" blurb lives inside the hero so it fills the space and lets the
  // poster backdrop read. A paragraph of unique copy plus a deep link into the
  // live, filtered film list — a plain <a> forces a full navigation so the
  // filter provider re-reads the genre URL param (same pattern as /accessibility).
  const heroBlurb = (
    <div className={styles.heroBlurb}>
      <p>{genre.seoDescription}</p>
      <p>
        <a href={`/films?genres=${genre.id}&allDates=true&allCategories=true`}>
          Browse all {genre.name.toLowerCase()} films →
        </a>
      </p>
    </div>
  );

  const fullCanonicalUrl = `https://clusterflick.com${canonicalUrl}`;
  const genreJsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: pageTitle(genre),
      description: genre.seoDescription,
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
        {
          "@type": "ListItem",
          position: 2,
          name: "Genres",
          item: "https://clusterflick.com/genres",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: genre.name,
          item: fullCanonicalUrl,
        },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(genreJsonLd) }}
      />
      <EventDetailPageContent
        name={`${genre.name} Films`}
        url=""
        imagePath={null}
        movieCount={movieCount}
        performanceCount={performanceCount}
        backUrl="/genres"
        backText="All genres"
        gridMovies={gridMovies}
        gridMoviesTruncated={gridMoviesTruncated}
        Blurb={null}
        heroChildren={heroBlurb}
        venuesLayout="grid"
        isAlias={isAlias}
        canonicalUrl={canonicalUrl}
        venues={genreVenues}
        cinemasSectionTitle={`Cinemas showing ${genre.name} films`}
        accessibilityStats={genreAccessibilityStats}
        filmsSectionTitle={`${genre.name} Films Showing in London`}
        filmsExploreHref={`/films?genres=${genre.id}&allDates=true&allCategories=true`}
        filmsExploreLabel={`Start exploring ${genre.name.toLowerCase()} films`}
        heroBackgroundImage={heroBackgroundImage}
        heroBackgroundImageAlt={`${genre.name} films showing in London`}
      />
    </>
  );
}
