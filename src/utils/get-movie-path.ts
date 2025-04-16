import type { FavouriteMovie, Movie } from "@/types";
import getMovieUrlSegments from "./get-movie-url-segments";

const getMoviePath = (movie: Movie | FavouriteMovie) => {
  const { id, slug } = getMovieUrlSegments(movie);
  return `/movies/${id}/${slug}`;
};

export default getMoviePath;
