import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStaticData } from "@/utils/get-static-data";
import { getVenueUrl } from "@/utils/get-venue-url";
import { getVenueImagePath } from "@/utils/get-venue-image";
import { getVenueGroupMapPath } from "@/utils/get-venue-group-image";
import { getVenueAttributes } from "@/utils/get-venue-attributes";
import {
  getVenueGroupUrl,
  getVenueGroupTitle,
} from "@/utils/get-venue-group-url";
import { groupVenuesByGroup } from "@/utils/get-venue-group-venues";
import { getGroupCorporateSocials } from "@/utils/get-group-socials";
import { buildVenueSchema } from "@/utils/build-venue-schema";
import { VENUE_GROUPS } from "@/data/venue-groups";
import type { Venue } from "@/types";
import GroupPageContent from "./page-content";

export const dynamicParams = false;

let cachedGroupVenues: Map<string, Venue[]> | null = null;

async function getGroupVenuesMap(): Promise<Map<string, Venue[]>> {
  if (cachedGroupVenues) return cachedGroupVenues;
  const data = await getStaticData();
  cachedGroupVenues = groupVenuesByGroup(data.venues);
  return cachedGroupVenues;
}

export async function generateStaticParams() {
  const map = await getGroupVenuesMap();
  return VENUE_GROUPS.filter((group) => map.has(group.slug)).map((group) => ({
    slug: group.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const group = VENUE_GROUPS.find((g) => g.slug === slug);

  if (!group) {
    return { title: "Cinema Group Not Found" };
  }

  const title = getVenueGroupTitle(group.name);
  const description = group.description;
  const canonical = getVenueGroupUrl(group);

  const mapPath = getVenueGroupMapPath(group.slug);
  const ogImage = mapPath
    ? {
        url: mapPath,
        width: 1200,
        height: 800,
        alt: `Map of ${group.name} cinema locations across London`,
      }
    : {
        url: "/images/og-image.png",
        width: 1200,
        height: 675,
        alt: "Clusterflick",
      };

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${title} | Clusterflick`,
      description,
      url: `https://clusterflick.com${canonical}`,
      siteName: "Clusterflick",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Clusterflick`,
      description,
      creator: "@clusterflick",
      images: [ogImage.url],
    },
  };
}

export default async function CinemaGroupPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const group = VENUE_GROUPS.find((g) => g.slug === slug);

  if (!group) {
    notFound();
  }

  const data = await getStaticData();
  const map = groupVenuesByGroup(data.venues);
  const groupVenues = map.get(slug) || [];

  if (groupVenues.length === 0) {
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

  const venueItems = groupVenues
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

  // Infer the group's shared corporate socials from its venues, then let any
  // explicit registry override (fallback) take precedence.
  const detectedSocials = getGroupCorporateSocials(
    groupVenues.map((v) => getVenueAttributes(v.id)?.socials ?? null),
    groupVenues.length,
  );
  const socials = {
    letterboxd:
      group.socials?.letterboxd ?? detectedSocials?.letterboxd ?? null,
    twitter: group.socials?.twitter ?? detectedSocials?.twitter ?? null,
    instagram: group.socials?.instagram ?? detectedSocials?.instagram ?? null,
  };

  // Count total unique movies currently showing across the group's venues
  const groupVenueIds = new Set(groupVenues.map((v) => v.id));
  const groupMovieIds = new Set<string>();
  for (const movie of Object.values(data.movies)) {
    for (const showing of Object.values(movie.showings)) {
      if (groupVenueIds.has(showing.venueId)) {
        groupMovieIds.add(movie.id);
        break;
      }
    }
  }

  // JSON-LD structured data
  const groupUrl = `https://clusterflick.com${getVenueGroupUrl(group)}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: getVenueGroupTitle(group.name),
      description: group.description,
      numberOfItems: venueItems.length,
      itemListElement: [...groupVenues]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((venue, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: buildVenueSchema(venue, {
            url: `https://clusterflick.com${getVenueUrl(venue)}`,
          }),
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
          name: "Cinema Groups",
          item: "https://clusterflick.com/cinema-groups",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: group.name,
          item: groupUrl,
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
      <GroupPageContent
        name={group.name}
        slug={group.slug}
        description={group.description}
        logoPath={getVenueImagePath(group.slug)}
        socials={socials}
        venues={venueItems}
        totalMovies={groupMovieIds.size}
      />
    </>
  );
}
