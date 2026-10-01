import type { Metadata } from "next";
import { getStaticData } from "@/utils/get-static-data";
import { getFilmClubImagePath } from "@/utils/get-film-club-image";
import {
  getFilmClubsIndex,
  type FilmClubListItem,
} from "@/utils/get-film-clubs-index";
import { FILM_CLUBS } from "@/data/film-clubs";
import FilmClubsPageContent from "./page-content";

export type { FilmClubListItem };

export const metadata: Metadata = {
  title: "Film Clubs",
  description:
    "Browse London film clubs tracked by Clusterflick. Discover screenings from specialist cinema clubs across the city.",
  alternates: {
    canonical: "/film-clubs",
  },
  openGraph: {
    title: "London Film Clubs | Clusterflick",
    description:
      "Browse London film clubs tracked by Clusterflick. Discover screenings from specialist cinema clubs across the city.",
    url: "https://clusterflick.com/film-clubs",
    siteName: "Clusterflick",
  },
  twitter: {
    card: "summary",
    title: "London Film Clubs | Clusterflick",
    description:
      "Browse London film clubs tracked by Clusterflick. Discover screenings from specialist cinema clubs across the city.",
    creator: "@clusterflick",
  },
};

export default async function FilmClubsPage() {
  const data = await getStaticData();
  const now = Date.now();

  const descriptions: Record<string, string | null> = Object.fromEntries(
    await Promise.all(
      FILM_CLUBS.map(async (club) => {
        try {
          const mod = await import(`@/components/film-clubs/${club.id}`);
          return [club.id, mod.seoDescription ?? null];
        } catch {
          // No blurb component for this club
          return [club.id, null];
        }
      }),
    ),
  );

  const { nextUp, activeClubs, inactiveClubs } = getFilmClubsIndex(
    data.movies,
    { now, getImagePath: getFilmClubImagePath, descriptions },
  );
  const filmClubItems = [...activeClubs, ...inactiveClubs];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "London Film Clubs",
    description: "Film clubs in London tracked by Clusterflick.",
    numberOfItems: filmClubItems.length,
    itemListElement: filmClubItems.map((club, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Organization",
        name: club.name,
        url: `https://clusterflick.com${club.href}`,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FilmClubsPageContent
        nextUp={nextUp}
        activeClubs={activeClubs}
        inactiveClubs={inactiveClubs}
        activeCount={activeClubs.length}
        totalCount={filmClubItems.length}
      />
    </>
  );
}
