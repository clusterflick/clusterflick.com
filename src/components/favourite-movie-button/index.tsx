import { FavouriteMovie, Movie } from "@/types";
import { type MouseEvent, type CSSProperties } from "react";
import classNames from "classnames";
import StarIcon from "@rsuite/icons/Star";
import Button from "rsuite/cjs/Button";
import { useUserSettings } from "@/state/user-settings-context";
import "./index.scss";

function FavouriteMovieButton({
  show = false,
  small = false,
  movie: { id, title, year },
  style,
}: {
  show?: boolean;
  small?: boolean;
  movie: Movie | FavouriteMovie;
  style?: CSSProperties;
}) {
  const { favouriteMovies, setFavouriteMovies } = useUserSettings();
  const isFavourite = !!favouriteMovies.find(
    ({ id: favouriteId }) => favouriteId === id,
  );
  const onClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFavourite) {
      setFavouriteMovies(
        favouriteMovies.filter(({ id: favouriteId }) => favouriteId !== id),
      );
    } else {
      const addedOn = Date.now();
      const favouriteMovie: FavouriteMovie = { id, title, year, addedOn };
      setFavouriteMovies(favouriteMovies.concat(favouriteMovie));
    }
  };
  return (
    <Button
      style={style}
      size={small ? "sm" : "md"}
      onClick={onClick}
      className={classNames("favourite-movie-button", {
        "favourite-movie-button--not-favourite": !isFavourite,
        "favourite-movie-button--favourite": isFavourite,
        "favourite-movie-button--show": show,
        "favourite-movie-button--small": small,
      })}
    >
      <StarIcon className="favourite-movie-button-icon" />
    </Button>
  );
}

export default FavouriteMovieButton;
