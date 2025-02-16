import type { FavouriteMovie, Movie } from "@/types";
import slugify from "@sindresorhus/slugify";

const getMoviePath = ({ id, title }: Movie | FavouriteMovie) =>
  `/movies/${id}/${slugify(title)}`;

export default getMoviePath;
