import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStaticData } from "@/utils/get-static-data";
import { FORMATS, resolveFormat, type FormatDefinition } from "@/data/formats";
import { getFormatUrl } from "@/utils/get-format-url";
import { getFormatMovies } from "@/utils/get-format-movies";
import {
  getFormatCollectionName,
  getFormatPageTitle,
  getFormatCinemasTitle,
} from "@/utils/format-labels";
import { getVenueUrl } from "@/utils/get-venue-url";
import { getVenueImagePath } from "@/utils/get-venue-image";
import { getMovieUrl } from "@/utils/get-movie-url";
import EventDetailPageContent from "@/components/event-detail-page-content";
import styles from "./page.module.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return FORMATS.flatMap((f) => [
    { slug: f.slug },
    ...(f.aliases ?? []).map((alias) => ({ slug: alias })),
  ]);
}

/** Query string (no leading `?`) that filters to this format's performances. */
function formatFilterParams(format: FormatDefinition): string {
  return `${format.kind}=${format.id}&allDates=true&allCategories=true`;
}

/** Deep link into the live, filtered film list for this format. */
function browseHref(format: FormatDefinition): string {
  return `/films?${formatFilterParams(format)}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resolved = resolveFormat(slug);

  if (!resolved) {
    return { title: "Format Not Found" };
  }

  const { format } = resolved;
  const title = getFormatPageTitle(format.id);
  const description = format.seoDescription;
  const canonicalUrl = getFormatUrl(format);

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

export default async function FormatDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const resolved = resolveFormat(slug);

  if (!resolved) {
    notFound();
  }

  const { format, isAlias } = resolved;
  const canonicalUrl = getFormatUrl(format);

  const data = await getStaticData();
  const nowTs = new Date(data.generatedAt).getTime();

  const formatMovies = getFormatMovies(format, data.movies, nowTs);
  formatMovies.sort((a, b) => {
    if (b.performanceCount !== a.performanceCount) {
      return b.performanceCount - a.performanceCount;
    }
    return a.movie.normalizedTitle.localeCompare(b.movie.normalizedTitle);
  });

  const movieCount = formatMovies.length;
  const performanceCount = formatMovies.reduce(
    (sum, { performanceCount: count }) => sum + count,
    0,
  );

  // Aggregate the cinemas across this format's upcoming performances.
  // `formatMovies` is already pruned to matching performances, so every
  // performance here is in this format. (No accessibility section: accessible
  // screenings and special formats are largely disjoint programming.)
  const venueFilmSets = new Map<string, Set<string>>();
  const venuePerfCounts = new Map<string, number>();

  for (const { movie } of formatMovies) {
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

  const formatVenues = [...venueFilmSets.entries()]
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

  const GRID_MOVIE_LIMIT = 72;
  const gridMovies = formatMovies.slice(0, GRID_MOVIE_LIMIT);
  const gridMoviesTruncated = formatMovies.length > GRID_MOVIE_LIMIT;

  // Use the poster of the most-performed film (formatMovies is sorted by
  // performance count) as the hero backdrop, falling back to the next film that
  // has a usable poster. Empty formats fall back to the default hero background.
  const backdropPoster = formatMovies
    .map(
      ({ movie }) =>
        movie.posterPath ??
        movie.includedMovies?.find((m) => m.posterPath)?.posterPath,
    )
    .find(Boolean);
  const heroBackgroundImage = backdropPoster
    ? `https://image.tmdb.org/t/p/w780${backdropPoster}`
    : undefined;

  const collectionName = getFormatCollectionName(format.id);

  // The "About" blurb lives inside the hero so it fills the space and lets the
  // poster backdrop read. A paragraph of unique copy plus a deep link into the
  // live, filtered film list — a plain <a> forces a full navigation so the
  // filter provider re-reads the format URL params (same pattern as /genres).
  const heroBlurb = (
    <div className={styles.heroBlurb}>
      <p>{format.seoDescription}</p>
      <p>
        <a href={browseHref(format)}>Browse all {format.name} films →</a>
      </p>
    </div>
  );

  const fullCanonicalUrl = `https://clusterflick.com${canonicalUrl}`;
  const formatJsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: getFormatPageTitle(format.id),
      description: format.seoDescription,
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
          name: "Formats",
          item: "https://clusterflick.com/formats",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: format.name,
          item: fullCanonicalUrl,
        },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(formatJsonLd) }}
      />
      <EventDetailPageContent
        name={collectionName}
        url=""
        imagePath={null}
        movieCount={movieCount}
        performanceCount={performanceCount}
        backUrl="/formats"
        backText="All formats"
        gridMovies={gridMovies}
        gridMoviesTruncated={gridMoviesTruncated}
        movieUrlParams={formatFilterParams(format)}
        Blurb={null}
        heroChildren={heroBlurb}
        venuesLayout="grid"
        isAlias={isAlias}
        canonicalUrl={canonicalUrl}
        venues={formatVenues}
        cinemasSectionTitle={getFormatCinemasTitle(format.id)}
        filmsSectionTitle={getFormatPageTitle(format.id)}
        filmsExploreHref={browseHref(format)}
        filmsExploreLabel={`Start exploring ${format.name} films`}
        heroBackgroundImage={heroBackgroundImage}
        heroBackgroundImageAlt={`${format.name} films showing in London`}
      />
    </>
  );
}
