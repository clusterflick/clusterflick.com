import type { Movie } from "@/types";
import Divider from "rsuite/cjs/Divider";
import showNumber from "@/utils/show-number";
import { useUserSettings } from "@/state/user-settings-context";

export default function Summary({ movies }: { movies: Movie[] }) {
  const { favouriteMovies } = useUserSettings();
  const shownFavourites = movies.filter(
    ({ id }) =>
      !!favouriteMovies.find(({ id: favouriteId }) => favouriteId === id),
  );
  return (
    <Divider>
      {showNumber(movies.length)} movies
      {shownFavourites.length > 0
        ? ` (${showNumber(shownFavourites.length)} ${shownFavourites.length === 1 ? "favourite" : "favourites"})`
        : ""}
    </Divider>
  );
}
