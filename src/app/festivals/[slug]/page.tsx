import { type ComponentType } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStaticData } from "@/utils/get-static-data";
import { getFestivalUrl } from "@/utils/get-festival-url";
import { getFestivalImagePath } from "@/utils/get-festival-image";
import { getFestivalMovies } from "@/utils/get-festival-movies";
import { getVenueUrl } from "@/utils/get-venue-url";
import { getVenueImagePath } from "@/utils/get-venue-image";
import { FESTIVALS, type Festival } from "@/data/festivals";
import type { Movie } from "@/types";
import FestivalDetailPageContent from "./page-content";

export const dynamicParams = false;

function resolveFestival(
  idParam: string,
): { festival: Festival; isAlias: boolean } | null {
  const direct = FESTIVALS.find((f) => f.id === idParam);
  if (direct) return { festival: direct, isAlias: false };

  const byAlias = FESTIVALS.find((f) => f.aliases.includes(idParam));
  if (byAlias) return { festival: byAlias, isAlias: true };

  return null;
}

export function generateStaticParams() {
  return FESTIVALS.flatMap((f) => [
    { slug: f.id },
    ...f.aliases.map((alias) => ({ slug: alias })),
  ]);
}

function buildFestivalDescription(
  festival: Festival,
  movieCount: number,
  seoDescription?: string,
  seoHighlights?: string,
): string {
  const filmWord = movieCount === 1 ? "film" : "films";

  if (seoDescription && seoHighlights && movieCount > 0) {
    return `${festival.name} — ${seoDescription}. ${movieCount} ${filmWord} showing, including ${seoHighlights}. Find screenings and book tickets.`;
  }

  if (seoDescription) {
    return `${festival.name} — ${seoDescription}. Find screenings and book tickets.`;
  }

  if (movieCount > 0) {
    return `${festival.name} is a London film festival. ${movieCount} ${filmWord} showing. Find screenings and book tickets.`;
  }

  return `${festival.name} is a London film festival. Find screenings and book tickets.`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resolved = resolveFestival(slug);

  if (!resolved) {
    return { title: "Festival Not Found" };
  }

  const { festival } = resolved;
  const data = await getStaticData();
  const festivalMovies = getFestivalMovies(festival, data.movies);
  const movieCount = Object.keys(festivalMovies).length;

  let seoDescription: string | undefined;
  let seoHighlights: string | undefined;
  try {
    const mod = await import(`@/components/festivals/${festival.id}`);
    seoDescription = mod.seoDescription;
    seoHighlights = mod.seoHighlights;
  } catch {
    // No blurb component for this festival
  }

  const description = buildFestivalDescription(
    festival,
    movieCount,
    seoDescription,
    seoHighlights,
  );
  const imagePath = getFestivalImagePath(festival.id);
  const canonicalUrl = getFestivalUrl(festival);
  const fullCanonicalUrl = `https://clusterflick.com${canonicalUrl}`;

  return {
    title: festival.name,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${festival.name} | Clusterflick`,
      description,
      url: fullCanonicalUrl,
      siteName: "Clusterflick",
      images: imagePath
        ? [{ url: imagePath, alt: `${festival.name} logo` }]
        : undefined,
    },
    twitter: {
      card: imagePath ? "summary_large_image" : "summary",
      title: `${festival.name} | Clusterflick`,
      description,
      creator: "@clusterflick",
      images: imagePath ? [imagePath] : undefined,
    },
  };
}

export default async function FestivalDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const resolved = resolveFestival(slug);

  if (!resolved) {
    notFound();
  }

  const { festival, isAlias } = resolved;
  const canonicalUrl = getFestivalUrl(festival);

  const data = await getStaticData();
  const imagePath = getFestivalImagePath(festival.id);

  const festivalMovies = getFestivalMovies(festival, data.movies);

  let movieCount = 0;
  let performanceCount = 0;
  const festivalMovieList: { movie: Movie; performanceCount: number }[] = [];

  for (const movie of Object.values(festivalMovies)) {
    movieCount++;
    const perfCount = movie.performances.length;
    performanceCount += perfCount;
    festivalMovieList.push({ movie, performanceCount: perfCount });
  }

  festivalMovieList.sort((a, b) => {
    if (b.performanceCount !== a.performanceCount) {
      return b.performanceCount - a.performanceCount;
    }
    return a.movie.title.localeCompare(b.movie.title);
  });

  // Collect the venues showing this festival
  const venueFilmSets = new Map<string, Set<string>>();
  const venuePerfCounts = new Map<string, number>();

  for (const movie of Object.values(festivalMovies)) {
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

  const festivalVenues = [...venueFilmSets.entries()]
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
    .sort((a, b) => b.filmCount - a.filmCount || a.name.localeCompare(b.name));

  const GRID_MOVIE_LIMIT = 72;
  const gridMovies = festivalMovieList.slice(0, GRID_MOVIE_LIMIT);
  const gridMoviesTruncated = festivalMovieList.length > GRID_MOVIE_LIMIT;

  let FestivalBlurb: ComponentType | null = null;
  try {
    const mod = await import(`@/components/festivals/${festival.id}`);
    FestivalBlurb = mod.default;
  } catch {
    // No blurb component for this festival
  }

  const festivalJsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Festival",
      name: festival.name,
      location: {
        "@type": "City",
        name: "London",
        addressCountry: "GB",
      },
      url: `https://clusterflick.com${canonicalUrl}`,
      image: imagePath ? `https://clusterflick.com${imagePath}` : undefined,
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
          name: "Festivals",
          item: "https://clusterflick.com/festivals",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: festival.name,
          item: `https://clusterflick.com${canonicalUrl}`,
        },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(festivalJsonLd) }}
      />
      <FestivalDetailPageContent
        festival={festival}
        imagePath={imagePath}
        movieCount={movieCount}
        performanceCount={performanceCount}
        gridMovies={gridMovies}
        gridMoviesTruncated={gridMoviesTruncated}
        FestivalBlurb={FestivalBlurb}
        isAlias={isAlias}
        canonicalUrl={canonicalUrl}
        venues={festivalVenues}
      />
    </>
  );
}
