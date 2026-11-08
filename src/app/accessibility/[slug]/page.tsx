import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStaticData } from "@/utils/get-static-data";
import {
  ACCESSIBILITY_FEATURES,
  resolveAccessibilityFeature,
  getRelatedAccessibilityFeatures,
} from "@/data/accessibility-features";
import {
  getAccessibilityFeatureUrl,
  getAccessibilityFilterParams,
  getAccessibilityFilterUrl,
} from "@/utils/get-accessibility-feature-url";
import { getAccessibilityMovies } from "@/utils/get-accessibility-movies";
import { getVenueUrl } from "@/utils/get-venue-url";
import { getVenueImagePath } from "@/utils/get-venue-image";
import { getMovieUrl } from "@/utils/get-movie-url";
import EventDetailPageContent from "@/components/event-detail-page-content";
import styles from "./page.module.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return ACCESSIBILITY_FEATURES.map((feature) => ({ slug: feature.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const feature = resolveAccessibilityFeature(slug);

  if (!feature) {
    return { title: "Accessibility Feature Not Found" };
  }

  const title = `${feature.title} in London`;
  const description = feature.seoDescription;
  const canonicalUrl = getAccessibilityFeatureUrl(feature.id);

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

export default async function AccessibilityFeaturePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const feature = resolveAccessibilityFeature(slug);

  if (!feature) {
    notFound();
  }

  const canonicalUrl = getAccessibilityFeatureUrl(feature.id);
  const browseHref = getAccessibilityFilterUrl(feature.id);
  const pageTitle = `${feature.title} in London`;

  const data = await getStaticData();
  const nowTs = new Date(data.generatedAt).getTime();

  // A fresh array, so sorting it leaves the shared dataset alone.
  const featureMovies = getAccessibilityMovies(feature.id, data.movies, nowTs);
  featureMovies.sort((a, b) => {
    if (b.performanceCount !== a.performanceCount) {
      return b.performanceCount - a.performanceCount;
    }
    return a.movie.normalizedTitle.localeCompare(b.movie.normalizedTitle);
  });

  const movieCount = featureMovies.length;
  const performanceCount = featureMovies.reduce(
    (sum, { performanceCount: count }) => sum + count,
    0,
  );

  // `featureMovies` is pruned to matching performances, so every performance
  // here carries the feature.
  const venueFilmSets = new Map<string, Set<string>>();
  const venuePerfCounts = new Map<string, number>();

  for (const { movie } of featureMovies) {
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

  const featureVenues = [...venueFilmSets.entries()]
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
  const gridMovies = featureMovies.slice(0, GRID_MOVIE_LIMIT);
  const gridMoviesTruncated = featureMovies.length > GRID_MOVIE_LIMIT;

  const backdropPoster = featureMovies
    .map(
      ({ movie }) =>
        movie.posterPath ??
        movie.includedMovies?.find((m) => m.posterPath)?.posterPath,
    )
    .find(Boolean);
  const heroBackgroundImage = backdropPoster
    ? `https://image.tmdb.org/t/p/w780${backdropPoster}`
    : undefined;

  const relatedFeatures = getRelatedAccessibilityFeatures(feature);
  const heroBlurb = (
    <div className={styles.heroBlurb}>
      <p>{feature.description}</p>
      <p>
        <Link href={browseHref}>
          Browse all {feature.title.toLowerCase()} →
        </Link>
      </p>
      <p className={styles.relatedFeatures}>
        See also:{" "}
        {relatedFeatures.map((related) => (
          <span key={related.id}>
            <Link href={getAccessibilityFeatureUrl(related.id)}>
              {related.title}
            </Link>
            {", "}
          </span>
        ))}
        <Link href="/accessibility">every accessible screening</Link>
      </p>
    </div>
  );

  const fullCanonicalUrl = `https://clusterflick.com${canonicalUrl}`;
  const featureJsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: pageTitle,
      description: feature.seoDescription,
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
          name: "Accessible Cinema",
          item: "https://clusterflick.com/accessibility",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: feature.title,
          item: fullCanonicalUrl,
        },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(featureJsonLd) }}
      />
      <EventDetailPageContent
        name={feature.title}
        url=""
        imagePath={null}
        movieCount={movieCount}
        performanceCount={performanceCount}
        backUrl="/accessibility"
        backText="All accessible screenings"
        gridMovies={gridMovies}
        gridMoviesTruncated={gridMoviesTruncated}
        movieUrlParams={getAccessibilityFilterParams(feature.id)}
        Blurb={null}
        heroChildren={heroBlurb}
        venuesLayout="grid"
        isAlias={false}
        canonicalUrl={canonicalUrl}
        venues={featureVenues}
        cinemasSectionTitle={`Cinemas with ${feature.title.toLowerCase()}`}
        filmsSectionTitle={pageTitle}
        filmsExploreHref={browseHref}
        filmsExploreLabel={`Start exploring ${feature.title.toLowerCase()}`}
        heroBackgroundImage={heroBackgroundImage}
        heroBackgroundImageAlt={pageTitle}
      />
    </>
  );
}
