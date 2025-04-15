import type { Filters, Movie } from "@/types";
import { Tag } from "rsuite";
import classNames from "classnames";
import { endOfToday, isWithinInterval, startOfYesterday } from "date-fns";
import { useFilters } from "@/state/filters-context";
import showNumber from "@/utils/show-number";
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
  const isNewMovie =
    movieFirstSeen &&
    isWithinInterval(movieFirstSeen, {
      start: startOfYesterday(),
      end: endOfToday(),
    });
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
        <div
          style={{ position: "absolute", right: "0.8rem", bottom: "0.4rem" }}
        >
          <FavouriteMovieButton movie={movie} />
        </div>
      </MoviePoster>
      <div className="movie-item-text-wrapper">
        <div className="movie-item-title" tabIndex={-1}>
          {isNewMovie ? (
            <>
              <Tag color="blue" size="sm">
                New
              </Tag>
              &nbsp;
            </>
          ) : null}{" "}
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
