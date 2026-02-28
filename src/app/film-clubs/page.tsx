import type { Metadata } from "next";
import { getStaticData } from "@/utils/get-static-data";
import { getFilmClubUrl } from "@/utils/get-film-club-url";
import { getFilmClubImagePath } from "@/utils/get-film-club-image";
import { getFilmClubCurrentMovies } from "@/utils/get-film-club-movies";
import { FILM_CLUBS } from "@/data/film-clubs";
import FilmClubsPageContent from "./page-content";

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

export type FilmClubListItem = {
  id: string;
  name: string;
  href: string;
  imagePath: string | null;
  movieCount: number;
  seoDescription: string | null;
};

export default async function FilmClubsPage() {
  const data = await getStaticData();

  const filmClubItems: FilmClubListItem[] = await Promise.all(
    FILM_CLUBS.map(async (club) => {
      const currentMovies = getFilmClubCurrentMovies(club, data.movies);

      let seoDescription: string | null = null;
      try {
        const mod = await import(`@/components/film-clubs/${club.id}`);
        seoDescription = mod.seoDescription ?? null;
      } catch {
        // No blurb component for this club
      }

      return {
        id: club.id,
        name: club.name,
        href: getFilmClubUrl(club),
        imagePath: getFilmClubImagePath(club.id),
        movieCount: Object.keys(currentMovies).length,
        seoDescription,
      };
    }),
  );

  const activeClubs = filmClubItems
    .filter((c) => c.movieCount > 0)
    .sort(
      (a, b) => b.movieCount - a.movieCount || a.name.localeCompare(b.name),
    );
  const inactiveClubs = filmClubItems
    .filter((c) => c.movieCount === 0)
    .sort((a, b) => a.name.localeCompare(b.name));
  const activeCount = activeClubs.length;

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
        activeClubs={activeClubs}
        inactiveClubs={inactiveClubs}
        activeCount={activeCount}
        totalCount={filmClubItems.length}
      />
    </>
  );
}
