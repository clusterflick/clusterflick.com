import type { Metadata } from "next";
import { getStaticData } from "@/utils/get-static-data";
import { getMovieListUrl } from "@/utils/get-movie-list-url";
import { getMovieListImagePath } from "@/utils/get-movie-list-image";
import { getMovieListFilms } from "@/utils/get-movie-list-movies";
import { MOVIE_LISTS } from "@/data/movie-lists";
import ListsPageContent from "./page-content";

const DESCRIPTION =
  "Browse the great-films lists — the IMDb Top 250, Rotten Tomatoes' 300 Best, the Guardian's best of the century — matched against what's screening in London cinemas right now.";

export const metadata: Metadata = {
  title: "Film Lists",
  description: DESCRIPTION,
  alternates: {
    canonical: "/lists",
  },
  openGraph: {
    title: "Film Lists | Clusterflick",
    description: DESCRIPTION,
    url: "https://clusterflick.com/lists",
    siteName: "Clusterflick",
  },
  twitter: {
    card: "summary",
    title: "Film Lists | Clusterflick",
    description: DESCRIPTION,
    creator: "@clusterflick",
  },
};

export type MovieListItem = {
  id: string;
  name: string;
  href: string;
  description: string;
  sourceName: string;
  imagePath: string | null;
  movieCount: number;
};

export default async function ListsPage() {
  const data = await getStaticData();

  const listItems: MovieListItem[] = MOVIE_LISTS.map((list) => ({
    id: list.id,
    name: list.name,
    href: getMovieListUrl(list),
    description: list.description,
    sourceName: list.sourceName,
    imagePath: getMovieListImagePath(list.id),
    movieCount: getMovieListFilms(list, data.movies).length,
  }));

  const activeLists = listItems
    .filter((list) => list.movieCount > 0)
    .sort(
      (a, b) => b.movieCount - a.movieCount || a.name.localeCompare(b.name),
    );
  const inactiveLists = listItems
    .filter((list) => list.movieCount === 0)
    .sort((a, b) => a.name.localeCompare(b.name));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Film Lists",
    description: DESCRIPTION,
    numberOfItems: listItems.length,
    itemListElement: listItems.map((list, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "CollectionPage",
        name: list.name,
        url: `https://clusterflick.com${list.href}`,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ListsPageContent
        activeLists={activeLists}
        inactiveLists={inactiveLists}
        totalCount={listItems.length}
      />
    </>
  );
}
