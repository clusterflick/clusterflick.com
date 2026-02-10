import { type ComponentType } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import slugify from "@sindresorhus/slugify";
import { getStaticData } from "@/utils/get-static-data";
import { getVenueAttributes } from "@/utils/get-venue-attributes";
import { getVenueImagePath, getVenueMapPath } from "@/utils/get-venue-image";
import { getVenueUrl } from "@/utils/get-venue-url";
import type { Movie, Venue } from "@/types";
import VenueDetailPageContent from "./page-content";

export const dynamicParams = false;

let slugMap: Map<string, Venue> | null = null;

async function getSlugMap(): Promise<Map<string, Venue>> {
  if (slugMap) return slugMap;

  const data = await getStaticData();
  slugMap = new Map();

  for (const venue of Object.values(data.venues)) {
    slugMap.set(slugify(venue.name), venue);
  }

  return slugMap;
}

export async function generateStaticParams() {
  const map = await getSlugMap();
  return Array.from(map.keys()).map((slug) => ({ slug }));
}

function getVenueMovieCounts(venue: Venue, movies: Record<string, Movie>) {
  let movieCount = 0;
  let performanceCount = 0;

  for (const movie of Object.values(movies)) {
    const venueShowingIds = new Set<string>();
    for (const [showingId, showing] of Object.entries(movie.showings)) {
      if (showing.venueId === venue.id) {
        venueShowingIds.add(showingId);
      }
    }
    if (venueShowingIds.size > 0) {
      movieCount++;
      for (const perf of movie.performances) {
        if (venueShowingIds.has(perf.showingId)) {
          performanceCount++;
        }
      }
    }
  }

  return { movieCount, performanceCount };
}

function buildVenueDescription(
  venue: Venue,
  movieCount: number,
  performanceCount: number,
): string {
  const typePart =
    venue.type.toLowerCase() !== "unknown" ? venue.type : "venue";

  if (movieCount > 0) {
    const filmWord = movieCount === 1 ? "film" : "films";
    const showingWord = performanceCount === 1 ? "showing" : "showings";
    return `${venue.name} is a London ${typePart} tracked by Clusterflick. Currently listing ${movieCount} ${filmWord} across ${performanceCount} ${showingWord}. View screenings, location, and more.`;
  }

  return `${venue.name} is a London ${typePart} tracked by Clusterflick. View screenings, location, and more.`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const map = await getSlugMap();
  const venue = map.get(slug);

  if (!venue) {
    return { title: "Venue Not Found" };
  }

  const data = await getStaticData();
  const { movieCount, performanceCount } = getVenueMovieCounts(
    venue,
    data.movies,
  );
  const description = buildVenueDescription(
    venue,
    movieCount,
    performanceCount,
  );
  const imagePath = getVenueImagePath(venue.id);
  const venueUrl = `https://clusterflick.com${getVenueUrl(venue)}`;

  return {
    title: venue.name,
    description,
    openGraph: {
      title: `${venue.name} | Clusterflick`,
      description,
      url: venueUrl,
      siteName: "Clusterflick",
      images: imagePath
        ? [
            {
              url: imagePath,
              alt: `${venue.name} logo`,
            },
          ]
        : undefined,
    },
    twitter: {
      card: imagePath ? "summary_large_image" : "summary",
      title: `${venue.name} | Clusterflick`,
      description,
      creator: "@clusterflick",
      images: imagePath ? [imagePath] : undefined,
    },
  };
}

export default async function VenueDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const map = await getSlugMap();
  const venue = map.get(slug);

  if (!venue) {
    notFound();
  }

  const data = await getStaticData();
  const attributes = getVenueAttributes(venue.id);
  const imagePath = getVenueImagePath(venue.id);
  const mapImagePath = getVenueMapPath(venue.id);

  let movieCount = 0;
  let performanceCount = 0;
  const venueMovies: { movie: Movie; performanceCount: number }[] = [];

  for (const movie of Object.values(data.movies)) {
    const venueShowingIds = new Set<string>();
    for (const [showingId, showing] of Object.entries(movie.showings)) {
      if (showing.venueId === venue.id) {
        venueShowingIds.add(showingId);
      }
    }
    if (venueShowingIds.size > 0) {
      movieCount++;
      let moviePerfCount = 0;
      for (const perf of movie.performances) {
        if (venueShowingIds.has(perf.showingId)) {
          performanceCount++;
          moviePerfCount++;
        }
      }
      venueMovies.push({ movie, performanceCount: moviePerfCount });
    }
  }

  // Sort by number of performances (most showings first), then alphabetically
  venueMovies.sort((a, b) => {
    if (b.performanceCount !== a.performanceCount) {
      return b.performanceCount - a.performanceCount;
    }
    return a.movie.title.localeCompare(b.movie.title);
  });

  const gridMovies = venueMovies.slice(0, 72);

  let VenueBlurb: ComponentType | null = null;
  try {
    const mod = await import(`@/components/venues/${venue.id}`);
    VenueBlurb = mod.default;
  } catch {
    // No blurb component for this venue
  }

  // Build JSON-LD structured data for this venue
  const venueJsonLd = {
    "@context": "https://schema.org",
    "@type": "MovieTheater",
    name: venue.name,
    address: {
      "@type": "PostalAddress",
      streetAddress: venue.address,
      addressLocality: "London",
      addressCountry: "GB",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: venue.geo.lat,
      longitude: venue.geo.lon,
    },
    url: attributes?.url || venue.url,
    image: imagePath ? `https://clusterflick.com${imagePath}` : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(venueJsonLd),
        }}
      />
      <VenueDetailPageContent
        venue={venue}
        attributes={attributes}
        imagePath={imagePath}
        mapImagePath={mapImagePath}
        movieCount={movieCount}
        performanceCount={performanceCount}
        gridMovies={gridMovies}
        VenueBlurb={VenueBlurb}
      />
    </>
  );
}
