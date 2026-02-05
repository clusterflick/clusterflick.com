"use client";

import {
  useEffect,
  useMemo,
  useState,
  useCallback,
  startTransition,
} from "react";
import { Movie, MoviePerformance, Genre, Person, Venue } from "@/types";
import { useCinemaData } from "@/state/cinema-data-context";
import {
  useFilterConfig,
  EVENT_CATEGORIES,
} from "@/state/filter-config-context";
import { useVenueFilterDefaults } from "@/hooks/use-venue-filter-defaults";
import { filterManager, describeFilters } from "@/lib/filters";
import { getCinemaVenueIds } from "@/utils/get-cinema-venue-ids";
import { getIncludedMovies } from "@/utils/get-included-movies";
import { formatDuration, formatDateLong } from "@/utils/format-date";
import PageHeader from "@/components/page-header";
import HeroSection from "@/components/hero-section";
import OutlineHeading from "@/components/outline-heading";
import MoviePoster from "@/components/movie-poster";
import StackedPoster from "@/components/stacked-poster";
import { PlayIcon } from "@/components/icons";
import GenresList from "./components/genres-list";
import RatingsGrid from "./components/ratings-grid";
import CastCrewSection from "./components/cast-crew-section";
import IncludedFilmsSection from "./components/included-films-section";
import PartOfSection from "./components/part-of-section";
import ShowingsSection from "./components/showings-section";
import styles from "./page.module.css";

type PageContentProps = {
  movie: Omit<Movie, "performances">;
  genres: Record<string, Genre>;
  people: Record<string, Person>;
  venues: Record<string, Venue>;
  parentMovies: Omit<Movie, "performances">[];
};

export default function PageContent({
  movie,
  genres,
  people,
  venues,
  parentMovies,
}: PageContentProps) {
  const { movies, metaData, getDataWithPriority } = useCinemaData();
  const { filterState, hasActiveFilters } = useFilterConfig();
  const [showAll, setShowAll] = useState(false);

  // Defer showings computation to allow hero content to render first
  const [isShowingsReady, setIsShowingsReady] = useState(false);

  // Fetch data once on mount, prioritising this movie's data file.
  // Empty deps are intentional: all movie data is loaded into global context once,
  // and getDataWithPriority returns early if data already exists. Subsequent
  // navigations just read from the already-loaded context via movies[movie.id].
  useEffect(() => {
    getDataWithPriority(movie.id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Mark showings as ready after initial paint, using startTransition to keep UI responsive
  useEffect(() => {
    startTransition(() => {
      setIsShowingsReady(true);
    });
  }, []);

  // Initialize default venue filter to "Cinemas"
  useVenueFilterDefaults();

  // Get unfiltered movie data
  const unfilteredMovie = movies[movie.id] || null;
  const unfilteredPerformances = unfilteredMovie?.performances || [];

  // Apply filters to the movie's performances and showings
  // Only compute when showings are ready (deferred to allow hero to render first)
  const filteredMovie = useMemo(() => {
    if (!isShowingsReady) return null;

    const movieData = movies[movie.id];
    if (!movieData) return null;

    // Create a single-movie record and apply filters
    const movieRecord = { [movie.id]: movieData };
    const filtered = filterManager.apply(movieRecord, filterState);

    return filtered[movie.id] || null;
  }, [isShowingsReady, movies, movie.id, filterState]);

  // Use filtered or unfiltered data based on showAll toggle
  const performances = showAll
    ? unfilteredPerformances
    : filteredMovie?.performances;
  const filteredShowings = showAll
    ? unfilteredMovie?.showings || movie.showings
    : filteredMovie?.showings || movie.showings;

  // Compute cinema venue IDs for filter description
  const cinemaVenueIds = useMemo(() => {
    return getCinemaVenueIds(metaData?.venues);
  }, [metaData]);

  // Generate filter description
  const filterDescription = useMemo(() => {
    if (!metaData) return null;
    return describeFilters({
      state: filterState,
      categories: EVENT_CATEGORIES,
      venues: metaData.venues || null,
      genres: metaData.genres || null,
      cinemaVenueIds,
    });
  }, [filterState, metaData, cinemaVenueIds]);

  const handleShowAllToggle = useCallback(() => {
    setShowAll((prev) => !prev);
  }, []);

  // Check if this is a multiple-movies event with stacked posters
  const includedMovies = getIncludedMovies(movie.showings);
  const includedWithPosters = includedMovies?.filter((m) => m.posterPath) || [];
  const totalPosters = (movie.posterPath ? 1 : 0) + includedWithPosters.length;
  const useStackedPoster =
    includedMovies && includedMovies.length > 1 && totalPosters >= 2;

  // Get the best poster path for backdrop (movie's own or first included movie's)
  const backdropPosterPath =
    movie.posterPath || includedWithPosters[0]?.posterPath;

  const performancesByDate = useMemo(() => {
    if (!performances || performances.length === 0) return {};

    const grouped = performances.reduce(
      (acc, performance) => {
        const date = formatDateLong(performance.time);
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(performance);
        return acc;
      },
      {} as Record<string, MoviePerformance[]>,
    );

    // Sort performances within each date by time
    Object.keys(grouped).forEach((date) => {
      grouped[date].sort((a, b) => a.time - b.time);
    });

    // Sort date groups chronologically (using the first performance's time in each group)
    const sortedEntries = Object.entries(grouped).sort(
      ([, a], [, b]) => a[0].time - b[0].time,
    );

    return Object.fromEntries(sortedEntries);
  }, [performances]);

  return (
    <div className={styles.page}>
      <PageHeader backUrl="/" backText="Back to film list" />

      <HeroSection
        backgroundImage={
          backdropPosterPath
            ? `https://image.tmdb.org/t/p/w500${backdropPosterPath}`
            : "/images/light-circles.jpg"
        }
        contentClassName={styles.heroContent}
      >
        <div className={styles.posterSection}>
          {useStackedPoster ? (
            <StackedPoster
              mainPosterPath={movie.posterPath}
              mainTitle={movie.title}
              includedMovies={includedMovies}
              size="large"
            />
          ) : (
            <MoviePoster
              posterPath={
                movie.posterPath || includedWithPosters[0]?.posterPath
              }
              title={movie.title}
              size="large"
            />
          )}
        </div>

        <div className={styles.mainInfo}>
          <OutlineHeading className={styles.title}>
            {movie.title}
          </OutlineHeading>

          <div className={styles.metadata}>
            {!!movie.year && <span>{movie.year}</span>}
            {!!movie.classification && (
              <span className={styles.classification}>
                {movie.classification}
              </span>
            )}
            {!!movie.duration && <span>{formatDuration(movie.duration)}</span>}
          </div>

          <GenresList
            genreIds={movie.genres || []}
            genres={genres}
            showings={movie.showings}
          />

          {movie.overview && (
            <p className={styles.overview}>{movie.overview}</p>
          )}

          {includedMovies && includedMovies.length > 0 && (
            <IncludedFilmsSection
              includedMovies={includedMovies}
              allMovies={movies}
              inline
            />
          )}

          <RatingsGrid
            imdb={movie.imdb}
            letterboxd={movie.letterboxd}
            rottenTomatoes={movie.rottenTomatoes}
            extraItem={
              movie.youtubeTrailer ? (
                <a
                  href={`https://www.youtube.com/watch?v=${movie.youtubeTrailer}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.trailerButton}
                >
                  <PlayIcon />
                  Watch Trailer
                </a>
              ) : undefined
            }
          />

          <PartOfSection parentMovies={parentMovies} />
        </div>
      </HeroSection>

      <div className={styles.detailsContainer}>
        <CastCrewSection
          directors={movie.directors}
          actors={movie.actors}
          people={people}
        />

        <ShowingsSection
          isLoading={!isShowingsReady || !movies[movie.id]?.performances}
          performancesByDate={performancesByDate}
          showings={filteredShowings}
          venues={venues}
          movieTitle={movie.title}
          filterDescription={filterDescription}
          hasActiveFilters={hasActiveFilters}
          showingAll={showAll}
          onShowAllToggle={handleShowAllToggle}
          unfilteredPerformanceCount={unfilteredPerformances.length}
          filteredPerformanceCount={filteredMovie?.performances?.length || 0}
        />
      </div>
    </div>
  );
}
