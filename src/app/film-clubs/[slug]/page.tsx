import { type ComponentType } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStaticData } from "@/utils/get-static-data";
import { getFilmClubUrl } from "@/utils/get-film-club-url";
import { getFilmClubImagePath } from "@/utils/get-film-club-image";
import {
  getFilmClubMovies,
  getFilmClubCurrentMovies,
} from "@/utils/get-film-club-movies";
import { getVenueUrl } from "@/utils/get-venue-url";
import { getVenueImagePath } from "@/utils/get-venue-image";
import { FILM_CLUBS, type FilmClub } from "@/data/film-clubs";
import { AccessibilityFeature, type Movie } from "@/types";
import EventDetailPageContent from "@/components/event-detail-page-content";

export const dynamicParams = false;

function resolveFilmClub(
  idParam: string,
): { club: FilmClub; isAlias: boolean } | null {
  const direct = FILM_CLUBS.find((c) => c.id === idParam);
  if (direct) return { club: direct, isAlias: false };

  const byAlias = FILM_CLUBS.find((c) => c.aliases.includes(idParam));
  if (byAlias) return { club: byAlias, isAlias: true };

  return null;
}

export function generateStaticParams() {
  return FILM_CLUBS.flatMap((c) => [
    { slug: c.id },
    ...c.aliases.map((alias) => ({ slug: alias })),
  ]);
}

function buildFilmClubDescription(
  club: FilmClub,
  movieCount: number,
  seoDescription?: string,
  seoHighlights?: string,
): string {
  const filmWord = movieCount === 1 ? "film" : "films";

  if (seoDescription && seoHighlights && movieCount > 0) {
    return `${club.name} — ${seoDescription}. ${movieCount} ${filmWord} showing, including ${seoHighlights}. Find screenings and book tickets.`;
  }

  if (seoDescription) {
    return `${club.name} — ${seoDescription}. Find screenings and book tickets.`;
  }

  if (movieCount > 0) {
    return `${club.name} is a London film club. ${movieCount} ${filmWord} showing. Find screenings and book tickets.`;
  }

  return `${club.name} is a London film club. Find screenings and book tickets.`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resolved = resolveFilmClub(slug);

  if (!resolved) {
    return { title: "Film Club Not Found" };
  }

  const { club } = resolved;
  const data = await getStaticData();
  const currentMovies = getFilmClubCurrentMovies(club, data.movies);
  const movieCount = Object.keys(currentMovies).length;

  let seoDescription: string | undefined;
  let seoHighlights: string | undefined;
  try {
    const mod = await import(`@/components/film-clubs/${club.id}`);
    seoDescription = mod.seoDescription;
    seoHighlights = mod.seoHighlights;
  } catch {
    // No blurb component for this club
  }

  const description = buildFilmClubDescription(
    club,
    movieCount,
    seoDescription,
    seoHighlights,
  );
  const imagePath = getFilmClubImagePath(club.id);
  const canonicalUrl = getFilmClubUrl(club);
  const fullCanonicalUrl = `https://clusterflick.com${canonicalUrl}`;

  return {
    title: club.name,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${club.name} | Clusterflick`,
      description,
      url: fullCanonicalUrl,
      siteName: "Clusterflick",
      images: imagePath
        ? [{ url: imagePath, alt: `${club.name} logo` }]
        : undefined,
    },
    twitter: {
      card: imagePath ? "summary_large_image" : "summary",
      title: `${club.name} | Clusterflick`,
      description,
      creator: "@clusterflick",
      images: imagePath ? [imagePath] : undefined,
    },
  };
}

export default async function FilmClubDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const resolved = resolveFilmClub(slug);

  if (!resolved) {
    notFound();
  }

  const { club, isAlias } = resolved;
  const canonicalUrl = getFilmClubUrl(club);

  const data = await getStaticData();
  const imagePath = getFilmClubImagePath(club.id);

  // Show only currently-showing films in the grid
  const currentMovies = getFilmClubCurrentMovies(club, data.movies);
  // Also fetch all-time films for the hero stats
  const allClubMovies = getFilmClubMovies(club, data.movies);

  let movieCount = 0;
  let performanceCount = 0;
  const clubMovieList: { movie: Movie; performanceCount: number }[] = [];

  for (const movie of Object.values(currentMovies)) {
    movieCount++;
    const perfCount = movie.performances.length;
    performanceCount += perfCount;
    clubMovieList.push({ movie, performanceCount: perfCount });
  }

  clubMovieList.sort((a, b) => {
    if (b.performanceCount !== a.performanceCount) {
      return b.performanceCount - a.performanceCount;
    }
    return a.movie.title.localeCompare(b.movie.title);
  });

  // Collect the venues showing this club's current films
  const venueFilmSets = new Map<string, Set<string>>();
  const venuePerfCounts = new Map<string, number>();

  for (const movie of Object.values(currentMovies)) {
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

  const clubVenues = [...venueFilmSets.entries()]
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

  const accessibilityFeatures = Object.values(AccessibilityFeature);
  const accessibilityFilmSets = new Map(
    accessibilityFeatures.map((f) => [f, new Set<string>()]),
  );
  const accessibilityPerfCounts = new Map(
    accessibilityFeatures.map((f) => [f, 0]),
  );

  for (const movie of Object.values(currentMovies)) {
    for (const perf of movie.performances) {
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

  const clubAccessibilityStats = accessibilityFeatures
    .map((feature) => ({
      feature,
      filmCount: accessibilityFilmSets.get(feature)!.size,
      performanceCount: accessibilityPerfCounts.get(feature) ?? 0,
    }))
    .filter((s) => s.filmCount > 0);

  const GRID_MOVIE_LIMIT = 72;
  const gridMovies = clubMovieList.slice(0, GRID_MOVIE_LIMIT);
  const gridMoviesTruncated = clubMovieList.length > GRID_MOVIE_LIMIT;

  // Use all-time total for hero count when nothing is currently showing
  const heroMovieCount =
    movieCount > 0 ? movieCount : Object.keys(allClubMovies).length;

  let FilmClubBlurb: ComponentType | null = null;
  try {
    const mod = await import(`@/components/film-clubs/${club.id}`);
    FilmClubBlurb = mod.default;
  } catch {
    // No blurb component for this club
  }

  const clubJsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: club.name,
      location: {
        "@type": "City",
        name: "London",
        addressCountry: "GB",
      },
      url: `https://clusterflick.com${canonicalUrl}`,
      image: imagePath ? `https://clusterflick.com${imagePath}` : undefined,
      sameAs: club.url || undefined,
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
          name: "Film Clubs",
          item: "https://clusterflick.com/film-clubs",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: club.name,
          item: `https://clusterflick.com${canonicalUrl}`,
        },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(clubJsonLd) }}
      />
      <EventDetailPageContent
        name={club.name}
        url={club.url}
        imagePath={imagePath}
        movieCount={heroMovieCount}
        performanceCount={performanceCount}
        backUrl="/film-clubs"
        backText="All film clubs"
        gridMovies={gridMovies}
        gridMoviesTruncated={gridMoviesTruncated}
        Blurb={FilmClubBlurb}
        isAlias={isAlias}
        canonicalUrl={canonicalUrl}
        venues={clubVenues}
        accessibilityStats={clubAccessibilityStats}
      />
    </>
  );
}
