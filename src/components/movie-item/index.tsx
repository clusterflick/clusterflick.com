import { type Filters, type Movie } from "@/types";
import Tag from "rsuite/cjs/Tag";
import classNames from "classnames";
import { endOfToday, isWithinInterval, parseISO } from "date-fns";
import { useCinemaData } from "@/state/cinema-data-context";
import { useFilters } from "@/state/filters-context";
import showNumber from "@/utils/show-number";
import {
  getCategoryLabel,
  getMovieCategory,
} from "@/utils/gete-movie-category";
import MoviePoster from "../movie-poster";
import FavouriteMovieButton from "../favourite-movie-button";
import showTimeToNextPerformance from "./show-time-to-next-performance";
import "./index.scss";

const getVenueCount = (movie: Movie, filters: Filters) =>
  movie.performances.reduce((venueIds, { showingId }) => {
    const venueId = movie.showings[showingId].venueId;
    if (filters.filteredVenues[venueId]) venueIds.add(venueId);
    return venueIds;
  }, new Set()).size;

export default function MovieItem({
  movie,
  className,
  width,
  height,
}: {
  movie: Movie;
  className?: string;
  width: number;
  height: number;
}) {
  const { filters } = useFilters();

  const movieFirstSeen = Object.values(movie.showings).reduce(
    (earliestTime: number | null, { seen }) => {
      if (!earliestTime || !seen) return null;
      return seen < earliestTime ? seen : earliestTime;
    },
    Date.now(),
  );
  const { data } = useCinemaData();
  const range = { start: parseISO(data!.generatedAt), end: endOfToday() };
  const isNewMovie = movieFirstSeen && isWithinInterval(movieFirstSeen, range);
  const categoryKey = getMovieCategory(movie);
  const performanceCount = movie.performances.length;
  const performanceSummary =
    performanceCount === 1
      ? `${performanceCount} performance`
      : `${showNumber(performanceCount)} performances`;

  const venueCount = getVenueCount(movie, filters);
  const venueSummary =
    venueCount === 1
      ? `${venueCount} venue`
      : `${showNumber(venueCount)} venues`;

  return (
    <div
      className={classNames("movie-item", className)}
      style={{ width, height }}
    >
      <MoviePoster movie={movie}>
        {isNewMovie ? (
          <div
            style={{ position: "absolute", left: "0.65rem", top: "0.25rem" }}
          >
            <Tag color="blue" size="sm">
              New
            </Tag>
          </div>
        ) : null}
        <div
          style={{ position: "absolute", left: "0.65rem", bottom: "0.25rem" }}
        >
          <Tag color="violet" size="sm">
            {getCategoryLabel(categoryKey)}
          </Tag>
        </div>
        <div
          style={{ position: "absolute", right: "0.8rem", bottom: "0.4rem" }}
        >
          <FavouriteMovieButton movie={movie} />
        </div>
      </MoviePoster>
      <div className="movie-item-text-wrapper">
        <div className="movie-item-title" tabIndex={-1}>
          {movie.title}
        </div>
        <div className="movie-item-summary">
          {performanceSummary} at {venueSummary}
          <br />
          {showTimeToNextPerformance(movie.performances)}
        </div>
      </div>
    </div>
  );
}
