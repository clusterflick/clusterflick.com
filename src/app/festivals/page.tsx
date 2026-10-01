import type { Metadata } from "next";
import { getStaticData } from "@/utils/get-static-data";
import { getFestivalImagePath } from "@/utils/get-festival-image";
import { getVenueUrl } from "@/utils/get-venue-url";
import { getFestivalMovies } from "@/utils/get-festival-movies";
import {
  getFestivalsIndex,
  type FestivalListItem,
} from "@/utils/get-festivals-index";
import { getLondonMidnightTimestamp } from "@/utils/format-date";
import { FESTIVALS } from "@/data/festivals";
import FestivalsPageContent from "./page-content";

export type { FestivalListItem };

export const metadata: Metadata = {
  title: "Film Festivals",
  description:
    "Browse London film festivals tracked by Clusterflick. Discover what's screening at major film festivals across the city.",
  alternates: {
    canonical: "/festivals",
  },
  openGraph: {
    title: "London Film Festivals | Clusterflick",
    description:
      "Browse London film festivals tracked by Clusterflick. Discover what's screening at major film festivals across the city.",
    url: "https://clusterflick.com/festivals",
    siteName: "Clusterflick",
  },
  twitter: {
    card: "summary",
    title: "London Film Festivals | Clusterflick",
    description:
      "Browse London film festivals tracked by Clusterflick. Discover what's screening at major film festivals across the city.",
    creator: "@clusterflick",
  },
};

export default async function FestivalsPage() {
  const data = await getStaticData();
  const now = Date.now();

  const descriptions: Record<string, string | null> = Object.fromEntries(
    await Promise.all(
      FESTIVALS.map(async (festival) => {
        try {
          const mod = await import(`@/components/festivals/${festival.id}`);
          return [festival.id, mod.seoDescription ?? null];
        } catch {
          // No blurb component for this festival
          return [festival.id, null];
        }
      }),
    ),
  );

  const { festivals: festivalItems, featured } = getFestivalsIndex(
    data.movies,
    { now, getImagePath: getFestivalImagePath, descriptions },
  );

  // Collect unique venue names across all active festivals
  const venueIds = new Set<string>();
  for (const festival of FESTIVALS) {
    const movies = getFestivalMovies(festival, data.movies);
    if (Object.keys(movies).length === 0) continue;
    for (const movie of Object.values(movies)) {
      for (const performance of movie.performances) {
        const showing = movie.showings[performance.showingId];
        if (showing) venueIds.add(showing.venueId);
      }
    }
  }
  const venues = [...venueIds]
    .flatMap((id) => {
      const venue = data.venues[id];
      return venue ? [{ name: venue.name, href: getVenueUrl(venue) }] : [];
    })
    .filter((v, i, arr) => arr.findIndex((x) => x.href === v.href) === i)
    .sort((a, b) => a.name.localeCompare(b.name));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "London Film Festivals",
    description: "Film festivals in London tracked by Clusterflick.",
    numberOfItems: festivalItems.length,
    itemListElement: festivalItems.map((festival, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Festival",
        name: festival.name,
        url: `https://clusterflick.com${festival.href}`,
        eventStatus: "https://schema.org/EventScheduled",
        location: {
          "@type": "Place",
          name: "London",
          address: {
            "@type": "PostalAddress",
            addressLocality: "London",
            addressCountry: "GB",
          },
        },
        ...(festival.externalUrl && {
          organizer: {
            "@type": "Organization",
            name: festival.name,
            url: festival.externalUrl,
          },
        }),
        ...(festival.dateFrom && {
          startDate: new Date(festival.dateFrom).toISOString().split("T")[0],
        }),
        ...(festival.dateTo && {
          endDate: new Date(festival.dateTo).toISOString().split("T")[0],
        }),
        ...(festival.imagePath && {
          image: `https://clusterflick.com${festival.imagePath}`,
        }),
        ...(festival.seoDescription && {
          description: festival.seoDescription,
        }),
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FestivalsPageContent
        festivals={festivalItems}
        featured={featured}
        venues={venues}
        now={now}
        today={getLondonMidnightTimestamp()}
      />
    </>
  );
}
