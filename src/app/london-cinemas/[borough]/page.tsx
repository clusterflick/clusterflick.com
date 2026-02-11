import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStaticData } from "@/utils/get-static-data";
import { getVenueUrl } from "@/utils/get-venue-url";
import { getVenueImagePath } from "@/utils/get-venue-image";
import { getDistanceInMiles } from "@/utils/geo-distance";
import { LONDON_BOROUGHS } from "@/data/london-boroughs";
import { groupVenuesByBorough } from "@/utils/get-borough-venues";
import { getBoroughUrl } from "@/utils/get-borough-url";
import type { Venue } from "@/types";
import BoroughPageContent from "./page-content";

export const dynamicParams = false;

let cachedBoroughVenues: Map<string, Venue[]> | null = null;

async function getBoroughVenuesMap(): Promise<Map<string, Venue[]>> {
  if (cachedBoroughVenues) return cachedBoroughVenues;
  const data = await getStaticData();
  cachedBoroughVenues = groupVenuesByBorough(data.venues);
  return cachedBoroughVenues;
}

export async function generateStaticParams() {
  const map = await getBoroughVenuesMap();
  return LONDON_BOROUGHS.filter((b) => map.has(b.slug)).map((b) => ({
    borough: b.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ borough: string }>;
}): Promise<Metadata> {
  const { borough: slug } = await params;
  const borough = LONDON_BOROUGHS.find((b) => b.slug === slug);

  if (!borough) {
    return { title: "Borough Not Found" };
  }

  const map = await getBoroughVenuesMap();
  const venues = map.get(slug) || [];
  const venueCount = venues.length;
  const venueWord = venueCount === 1 ? "cinema" : "cinemas";
  const description = `Discover ${venueCount} ${venueWord} in ${borough.name}, London. Browse showtimes, compare screenings and find independent, arthouse and multiplex venues across the borough.`;

  return {
    title: `Cinemas in ${borough.name}, London`,
    description,
    alternates: {
      canonical: getBoroughUrl(borough),
    },
    openGraph: {
      title: `Cinemas in ${borough.name}, London | Clusterflick`,
      description,
      url: `https://clusterflick.com${getBoroughUrl(borough)}`,
      siteName: "Clusterflick",
    },
    twitter: {
      card: "summary",
      title: `Cinemas in ${borough.name}, London | Clusterflick`,
      description,
      creator: "@clusterflick",
    },
  };
}

export default async function BoroughPage({
  params,
}: {
  params: Promise<{ borough: string }>;
}) {
  const { borough: slug } = await params;
  const borough = LONDON_BOROUGHS.find((b) => b.slug === slug);

  if (!borough) {
    notFound();
  }

  const data = await getStaticData();
  const map = groupVenuesByBorough(data.venues);
  const boroughVenues = map.get(slug) || [];

  if (boroughVenues.length === 0) {
    notFound();
  }

  // Count movies and performances per venue
  const eventCounts = new Map<string, number>();
  const perfCounts = new Map<string, number>();
  for (const movie of Object.values(data.movies)) {
    const venueIds = new Set<string>();
    for (const showing of Object.values(movie.showings)) {
      venueIds.add(showing.venueId);
    }
    for (const venueId of venueIds) {
      eventCounts.set(venueId, (eventCounts.get(venueId) || 0) + 1);
    }
    for (const perf of movie.performances) {
      const showing = movie.showings[perf.showingId];
      if (showing) {
        perfCounts.set(
          showing.venueId,
          (perfCounts.get(showing.venueId) || 0) + 1,
        );
      }
    }
  }

  const venueItems = boroughVenues
    .map((venue) => ({
      id: venue.id,
      name: venue.name,
      href: getVenueUrl(venue),
      type: venue.type,
      eventCount: eventCounts.get(venue.id) || 0,
      performanceCount: perfCounts.get(venue.id) || 0,
      imagePath: getVenueImagePath(venue.id),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Count total unique movies across all borough venues
  const boroughVenueIds = new Set(boroughVenues.map((v) => v.id));
  const boroughMovieIds = new Set<string>();
  for (const movie of Object.values(data.movies)) {
    for (const showing of Object.values(movie.showings)) {
      if (boroughVenueIds.has(showing.venueId)) {
        boroughMovieIds.add(movie.id);
        break;
      }
    }
  }

  // Get neighboring boroughs (boroughs that are geographically adjacent)
  const neighborBoroughs = LONDON_BOROUGHS.filter((b) => {
    if (b.slug === slug) return false;
    if (!map.has(b.slug)) return false;
    const distance = getDistanceInMiles(borough.center, b.center);
    return distance <= borough.radiusMiles + b.radiusMiles + 1;
  })
    .map((b) => ({
      name: b.name,
      href: getBoroughUrl(b),
      venueCount: (map.get(b.slug) || []).length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // JSON-LD structured data
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `Cinemas in ${borough.name}, London`,
      description: `Cinema and screening venues in ${borough.name}, London`,
      numberOfItems: venueItems.length,
      itemListElement: venueItems.map((venue, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "MovieTheater",
          name: venue.name,
          url: `https://clusterflick.com${venue.href}`,
        },
      })),
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
          name: "London Cinemas",
          item: "https://clusterflick.com/london-cinemas",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: borough.name,
          item: `https://clusterflick.com${getBoroughUrl(borough)}`,
        },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BoroughPageContent
        boroughName={borough.name}
        boroughSlug={slug}
        boroughDescription={borough.description}
        venues={venueItems}
        totalMovies={boroughMovieIds.size}
        neighborBoroughs={neighborBoroughs}
      />
    </>
  );
}
