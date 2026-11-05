import type { Metadata } from "next";
import { getStaticData } from "@/utils/get-static-data";
import { GENRES } from "@/data/genres";
import { getGenreUrl } from "@/utils/get-genre-url";
import { getGenreImagePath } from "@/utils/get-genre-image";
import { getGenreMovies } from "@/utils/get-genre-movies";
import {
  pickPosters,
  type ProgrammePoster,
} from "@/utils/get-programme-summary";
import { validateGenreRegistry } from "@/utils/validate-genre-registry";
import GenresPageContent from "./page-content";
import { VENUE_COUNT } from "@/utils/venue-count";

export const metadata: Metadata = {
  title: "Browse Films by Genre in London",
  description: `Browse London cinema listings by genre — horror, comedy, drama, science fiction, documentary and more. Find films by genre showing across ${VENUE_COUNT} London venues.`,
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
  /** The genre's busiest films, most upcoming showings first. */
  posters: ProgrammePoster[];
};

export default async function GenresPage() {
  const data = await getStaticData();

  // Build-time guard: fail loudly if the hard-coded genre registry has drifted
  // from the dataset (e.g. a new TMDB genre appears with no landing page).
  validateGenreRegistry(data.genres);

  const nowTs = new Date(data.generatedAt).getTime();

  const genres: GenreListItem[] = GENRES.map((genre) => {
    const genreMovies = getGenreMovies(genre.id, data.movies, nowTs);
    // Busiest first rather than soonest, as the programme cards take them: a
    // genre always has something on in the next hour, so soonest would be a
    // lottery, while the films with the most showings are the ones a reader is
    // likely to recognise as the genre. Films whose first-listed genre is this
    // one come ahead, so a wide release tagged Action, Adventure and Science
    // Fiction doesn't put the same poster on all three cards. Sorted on a copy,
    // since the movies are the shared dataset's.
    const isPrimary = (movie: (typeof genreMovies)[number]["movie"]) =>
      movie.genres?.[0] === genre.id ? 1 : 0;
    const busiest = [...genreMovies]
      .sort(
        (a, b) =>
          isPrimary(b.movie) - isPrimary(a.movie) ||
          b.performanceCount - a.performanceCount ||
          a.movie.title.localeCompare(b.movie.title),
      )
      .map(({ movie }) => movie);
    return {
      id: genre.id,
      name: genre.name,
      href: getGenreUrl(genre),
      imagePath: getGenreImagePath(genre.slug),
      seoDescription: genre.seoDescription,
      movieCount: genreMovies.length,
      posters: pickPosters(busiest),
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

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
