import type { Metadata } from "next";
import { getVenueImagePaths } from "@/utils/get-venue-image";
import { MOVIE_LISTS } from "@/data/movie-lists";
import { getMovieListUrl } from "@/utils/get-movie-list-url";
import { getMovieListTmdbIds } from "@/utils/get-movie-list-tmdb-ids";
import PersonalisePageContent from "./page-content";

export const metadata: Metadata = {
  title: "Personalise",
  description:
    "Keep a watchlist of films you want to catch at London cinemas, and a record of the ones you've seen.",
  alternates: {
    canonical: "/personalise",
  },
  // An account page: everything useful on it depends on who's signed in.
  robots: { index: false },
};

export default function PersonalisePage() {
  // Which venues are favourites is only known in the browser, so every logo's
  // path ships: a few KB, on a page nobody reaches by accident.
  // The film lists' ids, for the reader's progress through them in the Seen
  // stats: ~1,500 ids, rather than every list file in the page's bundle.
  const movieLists = MOVIE_LISTS.map((list) => ({
    id: list.id,
    name: list.name,
    href: getMovieListUrl(list),
    tmdbIds: getMovieListTmdbIds(list),
  })).filter(({ tmdbIds }) => tmdbIds.length > 0);
  return (
    <PersonalisePageContent
      venueImagePaths={getVenueImagePaths()}
      movieLists={movieLists}
    />
  );
}
