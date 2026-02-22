import type { Metadata } from "next";
import { getStaticData } from "@/utils/get-static-data";
import { getFestivalUrl } from "@/utils/get-festival-url";
import { getFestivalImagePath } from "@/utils/get-festival-image";
import {
  getFestivalMovies,
  getFestivalDateRange,
  isFestivalCurrentlyShowing,
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
  imagePath: string | null;
  movieCount: number;
  dateFrom: number | null;
  dateTo: number | null;
};

export default async function FestivalsPage() {
  const data = await getStaticData();

  const festivalItems: FestivalListItem[] = FESTIVALS.flatMap((festival) => {
    if (!isFestivalCurrentlyShowing(festival, data.movies)) return [];

    const movies = getFestivalMovies(festival, data.movies);
    const { dateFrom, dateTo } = getFestivalDateRange(movies);

    return [
      {
        id: festival.id,
        name: festival.name,
        href: getFestivalUrl(festival),
        imagePath: getFestivalImagePath(festival.id),
        movieCount: Object.keys(movies).length,
        dateFrom,
        dateTo,
      },
    ];
  });

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
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FestivalsPageContent festivals={festivalItems} />
    </>
  );
}
