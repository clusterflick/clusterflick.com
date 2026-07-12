import type { Metadata } from "next";
import { getStaticData } from "@/utils/get-static-data";
import { getFestivalUrl } from "@/utils/get-festival-url";
import { getFestivalImagePath } from "@/utils/get-festival-image";
import { getVenueUrl } from "@/utils/get-venue-url";
import {
  getFestivalMovies,
  getFestivalDateRange,
} from "@/utils/get-festival-movies";
import { FESTIVALS } from "@/data/festivals";
import FestivalsPageContent from "./page-content";

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

export type FestivalListItem = {
  id: string;
  name: string;
  href: string;
  externalUrl?: string;
  imagePath: string | null;
  movieCount: number;
  dateFrom: number | null;
  dateTo: number | null;
  seoDescription: string | null;
};

export default async function FestivalsPage() {
  const data = await getStaticData();

  const festivalItems: FestivalListItem[] = await Promise.all(
    FESTIVALS.flatMap((festival) => {
      const movies = getFestivalMovies(festival, data.movies);
      if (Object.keys(movies).length === 0) return [];

      const { dateFrom, dateTo } = getFestivalDateRange(movies);

      return [
        (async () => {
          let seoDescription: string | null = null;
          try {
            const mod = await import(`@/components/festivals/${festival.id}`);
            seoDescription = mod.seoDescription ?? null;
          } catch {
            // No blurb component for this festival
          }
          return {
            id: festival.id,
            name: festival.name,
            href: getFestivalUrl(festival),
            externalUrl: festival.url,
            imagePath: getFestivalImagePath(festival.id),
            movieCount: Object.keys(movies).length,
            dateFrom,
            dateTo,
            seoDescription,
          };
        })(),
      ];
    }),
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
      <FestivalsPageContent festivals={festivalItems} venues={venues} />
    </>
  );
}
