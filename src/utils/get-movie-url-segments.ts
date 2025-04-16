import type { FavouriteMovie, Movie } from "@/types";
import slugify from "@sindresorhus/slugify";

const getMovieUrlSegments = ({ id, title }: Movie | FavouriteMovie) => ({
  id,
  slug: slugify(title) || "-",
});

export default getMovieUrlSegments;
