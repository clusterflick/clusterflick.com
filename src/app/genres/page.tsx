import type { Metadata } from "next";
import { getStaticData } from "@/utils/get-static-data";
import { GENRES } from "@/data/genres";
import { getGenreUrl } from "@/utils/get-genre-url";
import { getGenreImagePath } from "@/utils/get-genre-image";
import { getGenreMovies } from "@/utils/get-genre-movies";
import { validateGenreRegistry } from "@/utils/validate-genre-registry";
import GenresPageContent from "./page-content";

export const metadata: Metadata = {
  title: "Browse Films by Genre in London",
  description:
    "Browse London cinema listings by genre — horror, comedy, drama, science fiction, documentary and more. Find films by genre showing across London's 300+ cinemas.",
  alternates: {
    canonical: "/genres",
  },
  openGraph: {
    title: "Browse Films by Genre in London | Clusterflick",
    description:
      "Browse London cinema listings by genre — horror, comedy, drama, science fiction, documentary and more.",
    url: "https://clusterflick.com/genres",
    siteName: "Clusterflick",
  },
  twitter: {
    card: "summary",
    title: "Browse Films by Genre in London | Clusterflick",
    description:
      "Browse London cinema listings by genre — horror, comedy, drama, science fiction and more.",
    creator: "@clusterflick",
  },
};

export type GenreListItem = {
  id: string;
  name: string;
  href: string;
  imagePath: string | null;
  seoDescription: string;
  movieCount: number;
};

export default async function GenresPage() {
  const data = await getStaticData();

  // Build-time guard: fail loudly if the hard-coded genre registry has drifted
  // from the dataset (e.g. a new TMDB genre appears with no landing page).
  validateGenreRegistry(data.genres);

  const nowTs = new Date(data.generatedAt).getTime();

  const genres: GenreListItem[] = GENRES.map((genre) => ({
    id: genre.id,
    name: genre.name,
    href: getGenreUrl(genre),
    imagePath: getGenreImagePath(genre.slug),
    seoDescription: genre.seoDescription,
    movieCount: getGenreMovies(genre.id, data.movies, nowTs).length,
  })).sort((a, b) => a.name.localeCompare(b.name));

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Browse Films by Genre in London",
      description:
        "Browse London cinema listings by genre. Find films by genre showing across London's cinemas.",
      url: "https://clusterflick.com/genres",
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: genres.length,
        itemListElement: genres.map((genre, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `https://clusterflick.com${genre.href}`,
          name: `${genre.name} Films`,
        })),
      },
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
          name: "Genres",
          item: "https://clusterflick.com/genres",
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
      <GenresPageContent genres={genres} />
    </>
  );
}
