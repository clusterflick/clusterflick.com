import { type ComponentType } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import slugify from "@sindresorhus/slugify";
import { getStaticData } from "@/utils/get-static-data";
import { getVenueAttributes } from "@/utils/get-venue-attributes";
import { getVenueImagePath, getVenueMapPath } from "@/utils/get-venue-image";
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

  const description = `Find film screenings at ${venue.name}. View listings, location, and more.`;

  return {
    title: venue.name,
    description,
    openGraph: {
      title: `${venue.name} | Clusterflick`,
      description,
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

  return (
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
  );
}
