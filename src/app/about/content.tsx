"use client";
import {
  AccessibilityFeature,
  Category,
  Classification,
  classificationOrder,
  type CinemaData,
  type Movie,
} from "@/types";
import { Fragment } from "react";
import {
  formatDuration,
  intervalToDuration,
  isToday,
  parseISO,
  endOfToday,
  isWithinInterval,
} from "date-fns";
import Link from "next/link";
import Image from "next/image";
import Container from "rsuite/cjs/Container";
import Content from "rsuite/cjs/Content";
import Heading from "rsuite/cjs/Heading";
import Message from "rsuite/cjs/Message";
import Stack from "rsuite/cjs/Stack";
import Text from "rsuite/cjs/Text";
import Divider from "rsuite/cjs/Divider";
import { useFilters } from "@/state/filters-context";
import { useCinemaData } from "@/state/cinema-data-context";
import getMovieClassification from "@/utils/get-movie-classification";
import getMatchingMovies from "@/utils/get-matching-movies";
import showNumber from "@/utils/show-number";
import getMoviePath from "@/utils/get-movie-path";
import { getMovieCategory } from "@/utils/gete-movie-category";
import AppHeading from "@/components/app-heading";
import MovieClassification from "@/components/movie-classification";
import FilterLink from "@/components/filter-link";
import ExternalLink from "@/components/external-link";
import logo from "./blue_long_1-8ba2ac31f354005783fab473602c34c3f4fd207150182061e425d366e4f34596.svg";

const convertToMapping = (values: string[]) =>
  values.reduce((mapping, value) => ({ ...mapping, [value]: true }), {});

const getMoviesShowingAt = (venueId: string, movies: CinemaData["movies"]) => {
  return Object.values(movies)
    .filter(({ performances, showings }) =>
      performances.some(
        ({ showingId }) => showings[showingId].venueId == venueId,
      ),
    )
    .map(({ id }) => id);
};

const categorySuffix: Record<Category, { suffix: string; index: number }> = {
  movie: { suffix: "unknown movies", index: 0 },
  "multiple-movies": { suffix: "movie marathons", index: 1 },
  tv: { suffix: "TV showings", index: 2 },
  quiz: { suffix: "quizes", index: 3 },
  comedy: { suffix: "comedy events", index: 4 },
  music: { suffix: "music events", index: 5 },
  talk: { suffix: "talks", index: 6 },
  workshop: { suffix: "workshops", index: 7 },
  shorts: { suffix: "short movies", index: 8 },
  event: { suffix: "other events", index: 9 },
};

function UnmatchedStats({ movies }: { movies: CinemaData["movies"] }) {
  const categoryMapping = Object.values(movies).reduce(
    (mapping, movie) => {
      if (!movie.isUnmatched) return mapping;
      const category = getMovieCategory(movie);
      const { suffix } = categorySuffix[category];
      mapping[category] = mapping[category] || { suffix, movies: [] };
      mapping[category].movies.push(movie.id);
      return mapping;
    },
    {} as Record<Category, { suffix: string; movies: Movie["id"][] }>,
  );

  const groupings = Object.keys(categoryMapping)
    .sort(
      (a, b) =>
        categorySuffix[a as Category].index -
        categorySuffix[b as Category].index,
    )
    .map((key) => categoryMapping[key as Category]);

  return (
    <>
      The remaining unmatched events include{" "}
      {groupings.map(({ movies, suffix }, index) => (
        <Fragment key={suffix}>
          {index === groupings.length - 1 ? "and " : ""}
          <FilterLink filters={{ filteredMovies: convertToMapping(movies) }}>
            {showNumber(movies.length)} {suffix}
          </FilterLink>
          {index === groupings.length - 1 ? "" : ", "}
        </Fragment>
      ))}
      .
    </>
  );
}

const getMatchedMoviesCount = (movies: CinemaData["movies"]) =>
  Object.values(movies).filter(({ isUnmatched }) => !isUnmatched).length;

const getMoviesWithImdbCount = (movies: CinemaData["movies"]) =>
  Object.values(movies).filter(({ imdb }) => !!imdb).length;

const getMoviesWithLetterboxdCount = (movies: CinemaData["movies"]) =>
  Object.values(movies).filter(({ letterboxd }) => !!letterboxd).length;

const getMoviesWithMetacriticCount = (movies: CinemaData["movies"]) =>
  Object.values(movies).filter(({ metacritic }) => !!metacritic).length;

const getMoviesWithRottenTomatoesCount = (movies: CinemaData["movies"]) =>
  Object.values(movies).filter(({ rottenTomatoes }) => !!rottenTomatoes).length;

const getMovieCount = (movies: CinemaData["movies"]) =>
  Object.values(movies).length;

const getPerformanceCount = (movies: CinemaData["movies"]) =>
  Object.values(movies).reduce(
    (total: number, movie: Movie) => total + movie.performances.length,
    0,
  );

const rangeFrom = (generatedAt: string) => ({
  start: parseISO(generatedAt),
  end: endOfToday(),
});
const getNewPerformanceCount = (
  movies: CinemaData["movies"],
  generatedAt: string,
) =>
  Object.values(movies).reduce((total: number, movie: Movie) => {
    const newPerformancesForShowings = Object.values(movie.showings).reduce(
      (newPerformances, showing) => {
        if (
          showing.seen &&
          isWithinInterval(showing.seen, rangeFrom(generatedAt))
        ) {
          const performances = movie.performances.filter(
            ({ showingId }) => showingId === showing.id,
          );
          return newPerformances + performances.length;
        }
        return newPerformances;
      },
      0,
    );
    return total + newPerformancesForShowings;
  }, 0);

const getMoviesWithNewPerformances = (
  movies: CinemaData["movies"],
  generatedAt: string,
) =>
  Object.values(movies)
    .filter(({ showings }) => {
      const movieFirstSeen = Object.values(showings).reduce(
        (latestTime: number, { seen }) => {
          if (!seen) return latestTime;
          return seen > latestTime ? seen : latestTime;
        },
        0,
      );
      return (
        movieFirstSeen &&
        isWithinInterval(movieFirstSeen, rangeFrom(generatedAt))
      );
    })
    .map(({ id }) => id);

const getNewMovies = (movies: CinemaData["movies"], generatedAt: string) =>
  Object.values(movies)
    .filter(({ showings }) => {
      const movieFirstSeen = Object.values(showings).reduce(
        (earliestTime: number | null, { seen }) => {
          if (!earliestTime || !seen) return null;
          return seen < earliestTime ? seen : earliestTime;
        },
        Date.now(),
      );
      return (
        movieFirstSeen &&
        isWithinInterval(movieFirstSeen, rangeFrom(generatedAt))
      );
    })
    .map(({ id }) => id);

type MovieAccessibilityTotals = Record<AccessibilityFeature, Set<Movie["id"]>>;
const getMovieAccessibilityCount = (movies: CinemaData["movies"]) => {
  const moviesMapping = Object.values(movies).reduce(
    (totals: MovieAccessibilityTotals, { id, performances }: Movie) => {
      performances.forEach((performance) => {
        if (!performance.accessibility) return;
        return Object.keys(performance.accessibility).forEach(
          (accessibilityFeature) => {
            const key = accessibilityFeature as AccessibilityFeature;
            if (!performance.accessibility![key]) return;
            totals[key] = totals[key] || new Set();
            totals[key].add(id);
          },
        );
      });
      return totals;
    },
    {} as MovieAccessibilityTotals,
  );
  return Object.keys(moviesMapping).reduce(
    (totals, accessibilityFeature) => {
      const key = accessibilityFeature as AccessibilityFeature;
      return { ...totals, [key]: moviesMapping[key].size };
    },
    {} as Record<AccessibilityFeature, number>,
  );
};

type PerformanceAccessibilityTotals = Record<AccessibilityFeature, number>;
const getPerformanceAccessibilityCount = (movies: CinemaData["movies"]) =>
  Object.values(movies).reduce(
    (totals: PerformanceAccessibilityTotals, { performances }: Movie) =>
      performances.reduce(
        (totals: PerformanceAccessibilityTotals, performance) => {
          if (!performance.accessibility) return totals;
          return Object.keys(performance.accessibility).reduce(
            (totals: PerformanceAccessibilityTotals, accessibilityFeature) => {
              const key = accessibilityFeature as AccessibilityFeature;
              if (!performance.accessibility![key]) return totals;
              const total = totals[key] || 0;
              return { ...totals, [key]: total + 1 };
            },
            totals,
          );
        },
        totals,
      ),
    {} as PerformanceAccessibilityTotals,
  );

const getVenueCount = (venues: CinemaData["venues"]) =>
  Object.values(venues).length;

const getClassificationCounts = (movies: CinemaData["movies"]) =>
  Object.values(movies).reduce(
    (totals: Record<Classification, number>, movie: Movie) => {
      const classification = getMovieClassification(movie);
      return {
        ...totals,
        [classification]: (totals[classification] || 0) + 1,
      };
    },
    {} as Record<Classification, number>,
  );

const getGenreCounts = (movies: CinemaData["movies"]) =>
  Object.values(movies).reduce(
    (totals: Record<string, number>, movie: Movie) =>
      (movie.genres || []).reduce(
        (genreTotals, id) => ({
          ...genreTotals,
          [id]: (genreTotals[id] || 0) + 1,
        }),
        totals,
      ),
    {} as Record<string, number>,
  );

const genreIcons: Record<string, string> = {
  "12": "🗺️",
  "14": "🧝‍♀️",
  "16": "💫",
  "18": "🎭",
  "27": "👻",
  "28": "🔫",
  "35": "🤡",
  "36": "🏺",
  "37": "🤠",
  "53": "🔪",
  "80": "🚓",
  "99": "🎥",
  "878": "🚀",
  "9648": "🔍",
  "10402": "🎶",
  "10749": "💌",
  "10751": "👪",
  "10752": "🪖",
  "10770": "📺",
  "95b92df1": "❓",
};

const accessibilityIcons: Record<AccessibilityFeature, string> = {
  audioDescription: "💬",
  babyFriendly: "🚼",
  hardOfHearing: "🦻",
  relaxed: "🏖️",
  subtitled: "🆒",
};

const accessibilityNames: Record<AccessibilityFeature, string> = {
  audioDescription: "Audio Description",
  babyFriendly: "Baby Friendly",
  hardOfHearing: "Hard of Hearing",
  relaxed: "Relaxed",
  subtitled: "Subtitled",
};

const releaseForMovie = (
  date: string,
  format = ["years", "months", "weeks", "days", "hours", "minutes"],
) => {
  const start = parseISO(date);
  const end = new Date();

  let duration = intervalToDuration({ start, end });
  const key = Object.keys(duration)[0] as keyof Duration;
  const isInTheFuture = duration[key]! < 0;
  if (isInTheFuture) duration = intervalToDuration({ start: end, end: start });

  const formatted = formatDuration(duration, { format, delimiter: ", " });
  if (formatted === "") return " now";

  const prefix = isInTheFuture ? "being released in" : "released";
  const suffix = isInTheFuture ? "" : "ago";
  return `${prefix} ${formatted} ${suffix}`.trim();
};

export default function AboutContent() {
  const { data } = useCinemaData();
  const { defaultFilters } = useFilters();
  const start = parseISO(data!.generatedAt);
  const dateDuration = intervalToDuration({ start, end: new Date() });
  const formattedDuration = formatDuration(dateDuration, {
    format: ["years", "months", "weeks", "days", "hours", "minutes"],
    delimiter: ", ",
  });

  const movieCount = getMovieCount(data!.movies);
  const newMovieCount = getNewMovies(data!.movies, data!.generatedAt).length;
  const moviesWithNewPerformancesCount = getMoviesWithNewPerformances(
    data!.movies,
    data!.generatedAt,
  ).length;
  const performanceCount = getPerformanceCount(data!.movies);
  const newPerformanceCount = getNewPerformanceCount(
    data!.movies,
    data!.generatedAt,
  );
  const classificationTotals = getClassificationCounts(data!.movies);
  const genreTotals = getGenreCounts(data!.movies);
  const performanceAccessibilityTotals = getPerformanceAccessibilityCount(
    data!.movies,
  );
  const movieAccessibilityTotals = getMovieAccessibilityCount(data!.movies);
  const filmsOrderedByYear = Object.values(data!.movies)
    .filter(({ releaseDate }) => !!releaseDate)
    .sort(
      (a, b) =>
        parseISO(a.releaseDate!).getTime() - parseISO(b.releaseDate!).getTime(),
    );
  const oldestMovie = filmsOrderedByYear[0];
  const newestMovie = filmsOrderedByYear[filmsOrderedByYear.length - 1];
  const filmsOrderedByPerformanceCount = Object.values(data!.movies).sort(
    (a, b) => b.performances.length - a.performances.length,
  );
  const mostPerformancesMovie = filmsOrderedByPerformanceCount[0];
  const matchingMovies = getMatchingMovies(
    data!.movies,
    defaultFilters!,
    defaultFilters!,
  );
  const moviesWithoutPerformances = Object.values(
    matchingMovies.reduce(
      (movies, { id }) => {
        delete movies[id];
        return movies;
      },
      { ...data!.movies },
    ),
  );
  const moviesWithOnlyPerformancesToday = Object.values(matchingMovies).filter(
    ({ performances }) =>
      performances.every(({ time }) => isToday(new Date(time))),
  );

  const getTopRatedBy = (
    movies: CinemaData["movies"],
    reviewer: "audience" | "critics",
  ) =>
    Object.values(movies)
      .filter(
        ({ rottenTomatoes }) =>
          (rottenTomatoes?.[reviewer]?.all?.reviews ?? 0) >= 50,
      )
      .sort(
        (a, b) =>
          (b.rottenTomatoes?.[reviewer].all?.rating || 0) -
          (a.rottenTomatoes?.[reviewer].all?.rating || 0),
      )
      .slice(0, 25);

  const topRatedAudience = getTopRatedBy(data!.movies, "audience");
  const topRatedCritics = getTopRatedBy(data!.movies, "critics");
  const commonTopRatedMovies = topRatedAudience
    .filter((audienceMovie) =>
      topRatedCritics.some(
        (criticsMovie) => criticsMovie.id === audienceMovie.id,
      ),
    )
    .sort((a, b) => a.title.localeCompare(b.title));

  return (
    <Container>
      <AppHeading />
      <Content style={{ padding: "1rem" }}>
        <Stack spacing={24} direction="column" alignItems="flex-start">
          <Stack.Item>
            <Heading>General Info</Heading>
          </Stack.Item>
          <Stack.Item>
            <Text>
              This site uses data retrieved{" "}
              <strong>
                <time dateTime={data!.generatedAt}>
                  {formattedDuration ? `${formattedDuration} ago` : "just now"}
                </time>
              </strong>{" "}
              from <strong>{showNumber(getVenueCount(data!.venues))}</strong>{" "}
              venues, showing <strong>{showNumber(performanceCount)}</strong>{" "}
              performances of <strong>{showNumber(movieCount)}</strong> movies.{" "}
              Since the last scan, there have been{" "}
              <strong>{showNumber(newPerformanceCount)}</strong> performances
              added to{" "}
              <FilterLink
                filters={{
                  filteredMovies: convertToMapping(
                    getMoviesWithNewPerformances(
                      data!.movies,
                      data!.generatedAt,
                    ),
                  ),
                }}
              >
                <strong>{showNumber(moviesWithNewPerformancesCount)}</strong>{" "}
                movies
              </FilterLink>
              , of which{" "}
              <FilterLink
                filters={{
                  filteredMovies: convertToMapping(
                    getNewMovies(data!.movies, data!.generatedAt),
                  ),
                }}
              >
                <strong>{showNumber(newMovieCount)}</strong> are newly added
                movies
              </FilterLink>
              .
            </Text>
            <div>
              <Text>Of these, we were able to match:</Text>
              <ul>
                <li>
                  <strong>
                    {Math.round(
                      (getMatchedMoviesCount(data!.movies) / movieCount) * 100,
                    )}
                    %
                  </strong>{" "}
                  ({showNumber(getMatchedMoviesCount(data!.movies))}) with{" "}
                  <ExternalLink href="https://www.themoviedb.org">
                    The Movie Database (TMDB)
                  </ExternalLink>
                </li>
                <li>
                  <strong>
                    {Math.round(
                      (getMoviesWithImdbCount(data!.movies) / movieCount) * 100,
                    )}
                    %
                  </strong>{" "}
                  ({showNumber(getMoviesWithImdbCount(data!.movies))}) with{" "}
                  <ExternalLink href="https://www.imdb.com">IMDb</ExternalLink>
                </li>
                <li>
                  <strong>
                    {Math.round(
                      (getMoviesWithRottenTomatoesCount(data!.movies) /
                        movieCount) *
                        100,
                    )}
                    %
                  </strong>{" "}
                  ({showNumber(getMoviesWithRottenTomatoesCount(data!.movies))})
                  with{" "}
                  <ExternalLink href="https://www.rottentomatoes.com">
                    Rotten Tomatoes
                  </ExternalLink>
                </li>
                <li>
                  <strong>
                    {Math.round(
                      (getMoviesWithLetterboxdCount(data!.movies) /
                        movieCount) *
                        100,
                    )}
                    %
                  </strong>{" "}
                  ({showNumber(getMoviesWithLetterboxdCount(data!.movies))})
                  with{" "}
                  <ExternalLink href="https://letterboxd.com">
                    Letterboxd
                  </ExternalLink>
                </li>
                <li>
                  <strong>
                    {Math.round(
                      (getMoviesWithMetacriticCount(data!.movies) /
                        movieCount) *
                        100,
                    )}
                    %
                  </strong>{" "}
                  ({showNumber(getMoviesWithMetacriticCount(data!.movies))})
                  with{" "}
                  <ExternalLink href="https://www.metacritic.com">
                    Metacritic
                  </ExternalLink>
                </li>
              </ul>
              <UnmatchedStats movies={data!.movies} />
            </div>
          </Stack.Item>
          <Stack.Item>
            <Text>
              The oldest movie is{" "}
              <Link href={getMoviePath(oldestMovie)}>
                {oldestMovie.title} ({oldestMovie.year})
              </Link>{" "}
              &mdash; {releaseForMovie(oldestMovie.releaseDate!, ["years"])}
            </Text>
            <Text>
              The newest movie is{" "}
              <Link href={getMoviePath(newestMovie)}>
                {newestMovie.title} ({newestMovie.year})
              </Link>{" "}
              &mdash;{" "}
              {releaseForMovie(newestMovie.releaseDate!, [
                "years",
                "months",
                "weeks",
                "days",
              ])}
            </Text>
            <Text>
              The movie with the most performances is{" "}
              <Link href={getMoviePath(mostPerformancesMovie)}>
                {mostPerformancesMovie.title} ({mostPerformancesMovie.year})
              </Link>{" "}
              &mdash; {showNumber(mostPerformancesMovie.performances.length)}{" "}
              performances
            </Text>
          </Stack.Item>
          <Stack.Item>
            <div>
              {commonTopRatedMovies.length > 0 ? (
                <>
                  Critics 🍅 and Audiences 🍿 agree on ⭐️{" "}
                  <strong>
                    {commonTopRatedMovies.length} top rated{" "}
                    {commonTopRatedMovies.length === 1 ? "movie" : "movies"}
                  </strong>{" "}
                  currently being shown:
                  <ol>
                    {commonTopRatedMovies.map((movie) => (
                      <li key={movie.id}>
                        <span>
                          <Link href={getMoviePath(movie)}>
                            {movie.title} ({movie.year})
                          </Link>{" "}
                          &mdash; 🍅{" "}
                          <strong>
                            {movie.rottenTomatoes?.critics.all?.rating}
                          </strong>{" "}
                          and 🍿{" "}
                          <strong>
                            {movie.rottenTomatoes?.audience.all?.rating}
                          </strong>
                        </span>
                      </li>
                    ))}
                  </ol>
                </>
              ) : (
                <>
                  🍅 Critics and 🍿 audiences can&apos;t agree on a top rated
                  movie being shown
                </>
              )}
            </div>
          </Stack.Item>
          {moviesWithOnlyPerformancesToday.length ? (
            <Stack.Item>
              <details>
                <Text
                  as="summary"
                  style={{
                    cursor: "pointer",
                    borderRadius: 5,
                    backgroundColor: "var(--rs-violet-50)",
                    padding: "0.5rem",
                  }}
                >
                  ℹ️&nbsp;&nbsp;
                  <strong>
                    {showNumber(moviesWithOnlyPerformancesToday.length)}
                  </strong>{" "}
                  {moviesWithOnlyPerformancesToday.length === 1 ? (
                    <>
                      movie has its last performance today &mdash; last chance
                      to see it on the big screen!
                    </>
                  ) : (
                    <>
                      movies have their last performances today &mdash; last
                      chance to see them on the big screen!
                    </>
                  )}
                </Text>
                <br />
                <ol>
                  {moviesWithOnlyPerformancesToday.map((movie) => (
                    <li key={movie.id}>
                      <Link href={getMoviePath(movie)}>
                        {movie.title} {movie.year ? `(${movie.year})` : ""}
                      </Link>
                    </li>
                  ))}
                </ol>
              </details>
            </Stack.Item>
          ) : null}
          {moviesWithoutPerformances.length ? (
            <Stack.Item>
              <details>
                <Text
                  as="summary"
                  style={{
                    cursor: "pointer",
                    borderRadius: 5,
                    backgroundColor: "var(--rs-violet-50)",
                    padding: "0.5rem",
                  }}
                >
                  ℹ️&nbsp;&nbsp;
                  <strong>
                    {showNumber(moviesWithoutPerformances.length)}
                  </strong>{" "}
                  {moviesWithoutPerformances.length === 1 ? (
                    <>
                      movie has now shown all of its performances and is no
                      longer available to see
                    </>
                  ) : (
                    <>
                      movies have now shown all of their performances and are no
                      longer available to see
                    </>
                  )}{" "}
                  &mdash; but there&apos;s still{" "}
                  <strong>
                    {showNumber(movieCount - moviesWithoutPerformances.length)}
                  </strong>{" "}
                  others to pick from!
                </Text>
                <br />
                <ol>
                  {moviesWithoutPerformances.map((movie) => (
                    <li key={movie.id}>
                      <Link href={getMoviePath(movie)}>
                        {movie.title} {movie.year ? `(${movie.year})` : ""}
                      </Link>
                    </li>
                  ))}
                </ol>
              </details>
            </Stack.Item>
          ) : null}
          <Stack.Item>
            <Text>Classifications:</Text>
            <ul
              style={{
                listStyleType: "none",
                padding: 0,
                width: "100%",
                columns: "20em 4",
                gap: "5em",
                columnRule: "1px dotted #666",
              }}
            >
              {classificationOrder.map((classification) => (
                <li key={classification}>
                  {classification === Classification.Unknown ? (
                    <span
                      style={{
                        textAlign: "center",
                        display: "inline-block",
                        margin: "0.2rem 0.5rem 0.2rem 0",
                        width: 25,
                        height: 25,
                        fontSize: "1.2rem",
                        lineHeight: "1",
                      }}
                    >
                      ❓
                    </span>
                  ) : (
                    <MovieClassification
                      classification={classification}
                      width={25}
                      height={25}
                      style={{ margin: "0.25rem 0.5rem 0.25rem 0" }}
                    />
                  )}
                  <FilterLink
                    filters={{
                      filteredClassifications: {
                        [classification]: true,
                      } as Record<Classification, boolean>,
                    }}
                  >
                    {classificationTotals[classification]} movies
                  </FilterLink>{" "}
                  (
                  {Math.round(
                    (classificationTotals[classification] / movieCount) * 100,
                  )}
                  %)
                </li>
              ))}
            </ul>
          </Stack.Item>
          <Stack.Item>
            <Text>Genres:</Text>
            <ul
              style={{
                listStyleType: "none",
                padding: 0,
                width: "100%",
                columns: "20em 4",
                gap: "5em",
                columnRule: "1px dotted #666",
              }}
            >
              {Object.keys(genreTotals).map((genre) => (
                <li key={genre}>
                  <span
                    style={{
                      textAlign: "center",
                      display: "inline-block",
                      margin: "0.2rem 0.5rem 0.2rem 0",
                      width: 25,
                      height: 25,
                      fontSize: "1.3rem",
                    }}
                  >
                    {genreIcons[genre]}
                  </span>
                  <span
                    style={{
                      display: "inline-block",
                      width: "100%",
                      maxWidth: "7rem",
                    }}
                  >
                    <FilterLink
                      filters={{
                        filteredGenres: {
                          [genre]: true,
                        },
                      }}
                    >
                      {data!.genres[genre].name}
                    </FilterLink>
                  </span>
                  {genreTotals[genre]} movies (
                  {Math.round((genreTotals[genre] / movieCount) * 100)}
                  %)
                </li>
              ))}
            </ul>
          </Stack.Item>
          <Stack.Item>
            <Text>Accessibility features:</Text>
            <ul
              style={{
                listStyleType: "none",
                padding: 0,
                width: "100%",
                columns: "27.5em 4",
                gap: "5em",
                columnRule: "1px dotted #666",
              }}
            >
              {Object.values(AccessibilityFeature).map((accessibility) => {
                const key = accessibility as AccessibilityFeature;
                const performanceAccessibilityCount =
                  performanceAccessibilityTotals[key];
                const movieAccessibilityCount = movieAccessibilityTotals[key];
                return (
                  <li
                    key={key}
                    style={{
                      display: "flex",
                      breakInside: "avoid-column",
                      marginBottom: "0.75rem",
                    }}
                  >
                    <span
                      style={{
                        textAlign: "center",
                        display: "inline-block",
                        margin: "0.2rem 0.5rem 0.2rem 0",
                        width: 25,
                        height: 25,
                        fontSize: "1.3rem",
                      }}
                    >
                      {accessibilityIcons[key]}
                    </span>
                    <span
                      style={{
                        display: "inline-block",
                        width: "100%",
                        maxWidth: "8.5rem",
                        whiteSpace: "nowrap",
                        lineHeight: "2rem",
                      }}
                    >
                      <FilterLink
                        filters={{
                          filteredAccessibilityFeatures: {
                            [key]: true,
                          } as Record<AccessibilityFeature, boolean>,
                        }}
                      >
                        {accessibilityNames[key]}
                      </FilterLink>
                    </span>
                    <span style={{ whiteSpace: "nowrap" }}>
                      {showNumber(performanceAccessibilityCount)} performances (
                      {Math.round(
                        (performanceAccessibilityCount / performanceCount) *
                          1000,
                      ) / 10}
                      %)
                      <br />
                      {showNumber(movieAccessibilityCount)} movies (
                      {Math.round(
                        (movieAccessibilityCount / movieCount) * 1000,
                      ) / 10}
                      %)
                    </span>
                  </li>
                );
              })}
            </ul>
          </Stack.Item>
          <Stack.Item>
            <Message showIcon type="warning" bordered>
              <Text>
                Please make sure to consult the venue listing page before
                planning attendance or booking tickets for any performance.{" "}
              </Text>
              <Text>
                There may be inaccuracies in the data presented or the wrong
                movie may be matched, with the wrong details therefore shown.
              </Text>
            </Message>
          </Stack.Item>
        </Stack>
        <Divider />
        <Stack spacing={24} direction="column" alignItems="flex-start">
          <Stack.Item>
            <Heading>About Clusterflick</Heading>
          </Stack.Item>
          <Stack.Item>
            <Text>You can find us around the internet. Say hi! 👋 </Text>
            <ul>
              <li>
                <ExternalLink href="https://letterboxd.com/clusterflick/">
                  🚥 letterboxd.com/<strong>clusterflick</strong>
                </ExternalLink>
              </li>
              <li>
                <ExternalLink href="https://www.instagram.com/clusterflick_/">
                  🖼️ instagram.com/<strong>clusterflick_</strong>
                </ExternalLink>
              </li>
              <li>
                <ExternalLink href="https://www.reddit.com/user/clusterflick_/">
                  🧍 reddit.com/user/<strong>clusterflick_</strong>
                </ExternalLink>
              </li>
              <li>
                <ExternalLink href="https://www.threads.com/clusterflick_/">
                  🧵 threads.com/<strong>clusterflick_</strong>
                </ExternalLink>
              </li>
              <li>
                <ExternalLink href="https://x.com/clusterflick/">
                  🐦 x.com/<strong>clusterflick</strong>
                </ExternalLink>
              </li>
              <li>
                <ExternalLink href="https://bsky.app/profile/clusterflick.bsky.social">
                  🩵 bsky.app/profile/<strong>clusterflick</strong>.bsky.social
                </ExternalLink>
              </li>
              <li>
                <ExternalLink href="https://github.com/clusterflick/">
                  🧑‍💻 github.com/<strong>clusterflick</strong>
                </ExternalLink>
              </li>
            </ul>
          </Stack.Item>
          <Stack.Item>
            <Text>
              The code for this site, the processing pipeline, and data
              generated is all open source and{" "}
              <ExternalLink href="https://github.com/clusterflick/">
                available on Github
              </ExternalLink>
              .
            </Text>
            <Text>
              The data is refreshed early every morning and available in
              normalized form in different formats depending on your needs:
            </Text>
            <ul>
              <li>
                <ExternalLink href="https://github.com/clusterflick/data-transformed/releases/latest">
                  JSON file per venue
                </ExternalLink>
              </li>
              <li>
                <ExternalLink href="https://github.com/clusterflick/data-combined/releases/latest">
                  Data combined by movie
                </ExternalLink>
              </li>
              <li>
                <ExternalLink href="https://github.com/clusterflick/data-calendar/releases/latest">
                  ICS calendar file per venue
                </ExternalLink>
              </li>
            </ul>
          </Stack.Item>
          <Stack.Item>
            <Message bordered>
              <span
                style={{
                  textAlign: "center",
                  display: "inline-block",
                  margin: "0.2rem 0.5rem 0.2rem 0",
                  width: 25,
                  height: 25,
                  fontSize: "1.3rem",
                  lineHeight: "1",
                }}
              >
                🐞
              </span>{" "}
              If you see any issues or bugs with the data shown or how this site
              works, please let us know.
            </Message>
          </Stack.Item>
        </Stack>
        <Divider />
        <Stack spacing={36} direction="column" alignItems="flex-start">
          <Stack.Item>
            <Heading>Sources</Heading>
          </Stack.Item>
          <Stack.Item>
            <Stack spacing={12} direction="column" alignItems="flex-start">
              <Stack.Item>
                <Heading level={5}>Source of Movie Data</Heading>
              </Stack.Item>
              <Stack.Item>
                <Text>
                  Using the data gathered from each venue website, we attempt to
                  match to an entry in{" "}
                  <ExternalLink href="https://www.themoviedb.org">
                    The Movie Database (TMDB)
                  </ExternalLink>
                  . This gives us richer information about the movie, including
                  poster image, associated genres, cast & crew details, etc.
                </Text>
              </Stack.Item>
              <Stack.Item>
                <Text>
                  This API is graciously provided for free with attribution:
                </Text>
              </Stack.Item>
              <Stack.Item>
                <Text
                  as="blockquote"
                  cite="https://www.themoviedb.org/api-terms-of-use"
                >
                  <Image
                    src={logo.src}
                    width={logo.width}
                    height={logo.height}
                    style={{ width: "100%" }}
                    alt="TMDB logo"
                  />
                  <Text>
                    This website uses TMDB and the TMDB APIs but is not
                    endorsed, certified, or otherwise approved by TMDB
                  </Text>
                </Text>
              </Stack.Item>
            </Stack>
          </Stack.Item>
          <Stack.Item>
            <Stack spacing={12} direction="column" alignItems="flex-start">
              <Stack.Item>
                <Heading level={5}>Source of Movie Showings</Heading>
              </Stack.Item>
              <Stack.Item>
                <Text>
                  Performances are retrieved for each of the venues below, as
                  well as being retrieved from these sources:
                </Text>
              </Stack.Item>
              <Stack.Item>
                <ol
                  style={{
                    listStyleType: "none",
                    padding: 0,
                    width: "100%",
                    columns: "26em 4",
                    gap: "5em",
                    columnRule: "1px dotted #666",
                  }}
                >
                  <li>
                    <span
                      style={{
                        flex: 1,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      🚏{" "}
                      <ExternalLink href="https://www.designmynight.com/london">
                        DesignMyNight
                      </ExternalLink>
                    </span>
                  </li>
                  <li>
                    <span
                      style={{
                        flex: 1,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      🚏{" "}
                      <ExternalLink href="https://dice.fm">DICE</ExternalLink>
                    </span>
                  </li>
                  <li>
                    <span
                      style={{
                        flex: 1,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      🚏{" "}
                      <ExternalLink href="https://www.eventbrite.co.uk">
                        Eventbrite
                      </ExternalLink>
                    </span>
                  </li>
                  <li>
                    <span
                      style={{
                        flex: 1,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      🚏{" "}
                      <ExternalLink href="https://outsavvy.com">
                        OutSavvy
                      </ExternalLink>
                    </span>
                  </li>
                  <li>
                    <span
                      style={{
                        flex: 1,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      🚏{" "}
                      <ExternalLink href="https://www.ticketsource.co.uk">
                        TicketSource
                      </ExternalLink>
                    </span>
                  </li>
                </ol>
              </Stack.Item>
              <Stack.Item>
                <ol
                  style={{
                    listStyleType: "none",
                    padding: 0,
                    width: "100%",
                    columns: "26em 4",
                    gap: "5em",
                    columnRule: "1px dotted #666",
                  }}
                >
                  {Object.values(data!.venues)
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(({ id, name, url }) => {
                      const movieCount = getMoviesShowingAt(
                        id,
                        data!.movies,
                      ).length;
                      return (
                        <li
                          key={id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            listStyleType: "none",
                            padding: 0,
                            lineHeight: "2",
                          }}
                        >
                          <span
                            style={{
                              flex: 1,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            📍 <ExternalLink href={url}>{name}</ExternalLink>
                          </span>
                          <span
                            style={{
                              flexShrink: 0,
                              marginLeft: "1rem",
                            }}
                          >
                            📽️{" "}
                            <FilterLink
                              filters={{ filteredVenues: { [id]: true } }}
                            >
                              {showNumber(movieCount)} movie
                              {movieCount === 1 ? "" : "s"}
                            </FilterLink>
                          </span>
                        </li>
                      );
                    })}
                </ol>
              </Stack.Item>
            </Stack>
          </Stack.Item>
        </Stack>
      </Content>
    </Container>
  );
}
