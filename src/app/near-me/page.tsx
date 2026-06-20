import type { Metadata } from "next";
import { getStaticData } from "@/utils/get-static-data";
import {
  getNearMeVenues,
  getNearMeFilmClubs,
  type NearMeVenue,
  type NearMeFilmClub,
} from "@/utils/get-near-me-data";
import { getFestivalUrl } from "@/utils/get-festival-url";
import { getFestivalImagePath } from "@/utils/get-festival-image";
import {
  getFestivalMovies,
  getFestivalDateRange,
  isFestivalCurrentlyShowing,
} from "@/utils/get-festival-movies";
import { groupVenuesByBorough } from "@/utils/get-borough-venues";
import { LONDON_BOROUGHS } from "@/data/london-boroughs";
import { FESTIVALS } from "@/data/festivals";
import { AccessibilityFeature } from "@/types";
import NearMePageContent from "./page-content";

export const metadata: Metadata = {
  title: "Near Me — Discover Cinemas, Film Clubs & Festivals in Your Borough",
  description:
    "Find cinemas, film clubs, festivals, and accessible screenings near you. Use your location or choose your London borough to discover what's showing nearby.",
  alternates: {
    canonical: "/near-me",
  },
  openGraph: {
    title: "Near Me — What's On Near You | Clusterflick",
    description:
      "Discover cinemas, film clubs, festivals, and accessible screenings near you in London.",
    url: "https://clusterflick.com/near-me",
    siteName: "Clusterflick",
  },
  twitter: {
    card: "summary",
    title: "Near Me — What's On Near You | Clusterflick",
    description:
      "Discover cinemas, film clubs, festivals, and accessible screenings near you in London.",
    creator: "@clusterflick",
  },
};

export type { NearMeVenue, NearMeFilmClub };

export type NearMeFestival = {
  id: string;
  name: string;
  href: string;
  imagePath: string | null;
  seoDescription: string | null;
  movieCount: number;
  venueIds: string[];
  dateFrom: number | null;
  dateTo: number | null;
};

export type NearMeBorough = {
  name: string;
  slug: string;
  lat: number;
  lon: number;
  radiusMiles: number;
  venueCount: number;
};

export default async function NearMePage() {
  const data = await getStaticData();
  const venuesByBorough = groupVenuesByBorough(data.venues);

  const venues = getNearMeVenues(data);
  const filmClubs = await getNearMeFilmClubs(data);

  // Pre-compute festival data
  const festivals: NearMeFestival[] = await Promise.all(
    FESTIVALS.flatMap((festival) => {
      if (!isFestivalCurrentlyShowing(festival, data.movies)) return [];

      const movies = getFestivalMovies(festival, data.movies);
      const { dateFrom, dateTo } = getFestivalDateRange(movies);

      const venueIdSet = new Set<string>();
      for (const movie of Object.values(movies)) {
        for (const perf of movie.performances) {
          const showing = movie.showings[perf.showingId];
          if (showing) venueIdSet.add(showing.venueId);
        }
      }

      return [
        (async () => {
          let seoDescription: string | null = null;
          try {
            const mod = await import(`@/components/festivals/${festival.id}`);
            seoDescription = mod.seoDescription ?? null;
          } catch {
            // No blurb component
          }
          return {
            id: festival.id,
            name: festival.name,
            href: getFestivalUrl(festival),
            imagePath: getFestivalImagePath(festival.id),
            seoDescription,
            movieCount: Object.keys(movies).length,
            venueIds: [...venueIdSet],
            dateFrom,
            dateTo,
          };
        })(),
      ];
    }),
  );

  // Pre-compute accessibility features available per venue
  const venueAccessibility: Record<string, AccessibilityFeature[]> = {};
  const allFeatures = Object.values(AccessibilityFeature);

  for (const movie of Object.values(data.movies)) {
    for (const perf of movie.performances) {
      const showing = movie.showings[perf.showingId];
      if (!showing) continue;
      for (const feature of allFeatures) {
        if (perf.accessibility?.[feature]) {
          if (!venueAccessibility[showing.venueId]) {
            venueAccessibility[showing.venueId] = [];
          }
          if (!venueAccessibility[showing.venueId].includes(feature)) {
            venueAccessibility[showing.venueId].push(feature);
          }
        }
      }
    }
  }

  // Build borough list for picker
  const boroughs: NearMeBorough[] = LONDON_BOROUGHS.filter((b) =>
    venuesByBorough.has(b.slug),
  )
    .map((b) => ({
      name: b.name,
      slug: b.slug,
      lat: b.center.lat,
      lon: b.center.lon,
      radiusMiles: b.radiusMiles,
      venueCount: venuesByBorough.get(b.slug)!.length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <NearMePageContent
      venues={venues}
      filmClubs={filmClubs}
      festivals={festivals}
      boroughs={boroughs}
      venueAccessibility={venueAccessibility}
    />
  );
}
