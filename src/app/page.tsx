"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Grid, WindowScroller, GridCellProps } from "react-virtualized";
import { useCinemaData } from "@/state/cinema-data-context";
import { useFilterConfig } from "@/state/filter-config-context";
import { useVenueFilterDefaults } from "@/hooks/use-venue-filter-defaults";
import { filterManager } from "@/lib/filters";
import Button from "@/components/button";
import MovieCell from "@/components/movie-cell";
import MainHeader from "@/components/main-header";
import FilterOverlay from "@/components/filter-overlay";
import LoadingIndicator from "@/components/loading-indicator";
import PageWrapper from "@/components/page-wrapper";
import EmptyState from "@/components/empty-state";
import simplifySorting from "@/utils/sort-titles";
import "react-virtualized/styles.css";
import styles from "./page.module.css";

const POSTER_WIDTH = 200;
const POSTER_HEIGHT = 300;
const GAP = 8;

export default function Home() {
  const {
    movies,
    isEmpty,
    isLoading,
    hasAttemptedLoad,
    error,
    getData,
    retry,
  } = useCinemaData();
  const { filterState, hasActiveFilters } = useFilterConfig();

  // Fetch data once on mount. Empty deps are intentional: all movie data is loaded
  // into global context once, and getData returns early if data already exists.
  useEffect(() => {
    getData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize default venue filter to "Cinemas"
  useVenueFilterDefaults();

  const [windowDimensions, setWindowDimensions] = useState({
    width: POSTER_WIDTH * 1.5,
    height: POSTER_HEIGHT * 1.5,
  }); // Default values for SSR to render one placeholder poster
  const [isFilterOverlayOpen, setIsFilterOverlayOpen] = useState(false);
  const [filterTextHeight, setFilterTextHeight] = useState(0);

  const moviesList = useMemo(() => {
    if (isEmpty) return [];
    const filteredMovies = filterManager.apply(movies, filterState);
    return Object.values(filteredMovies).sort((a, b) =>
      simplifySorting(a.title).localeCompare(simplifySorting(b.title)),
    );
  }, [isEmpty, movies, filterState]);

  const columnsForWindow = Math.floor(
    (windowDimensions.width + GAP) / (POSTER_WIDTH + GAP),
  );
  // Limit columns to the number of movies so they stay centered when there are few items
  const columnCount = Math.max(
    1,
    Math.min(columnsForWindow, moviesList.length || 1),
  );
  const rowCount = Math.ceil(moviesList.length / columnCount);
  const gridWidth = columnCount * (POSTER_WIDTH + GAP);

  const cellRenderer = useCallback(
    ({ columnIndex, key, rowIndex, style }: GridCellProps) => {
      const index = rowIndex * columnCount + columnIndex;
      const movie = moviesList[index];
      if (!movie) return null;
      return <MovieCell key={key} movie={movie} style={style} />;
    },
    [moviesList, columnCount],
  );

  useEffect(() => {
    // Set initial dimensions on mount - must be done in effect as window
    // is not available during SSR. This is a valid use of setState in effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- valid: window not available during SSR
    setWindowDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const renderEmptyState = () => {
    if (error) {
      return (
        <EmptyState
          variant="fullscreen"
          icon={{
            src: "/images/icons/neon-projector.svg",
            width: 120,
            height: 120,
          }}
          title="Something went wrong"
          message={error.message}
          actions={
            <Button onClick={retry} disabled={isLoading}>
              {isLoading ? "Retrying..." : "Try Again"}
            </Button>
          }
        />
      );
    }

    if (
      hasAttemptedLoad &&
      !isLoading &&
      moviesList.length === 0 &&
      hasActiveFilters
    ) {
      return (
        <EmptyState
          variant="fullscreen"
          icon={{
            src: "/images/icons/neon-clapper.svg",
            width: 120,
            height: 120,
          }}
          title="No events found"
          message="No events match your customisation. Try adjusting your filters or search for something else."
        />
      );
    }

    // No movies available at all (empty data)
    if (
      hasAttemptedLoad &&
      !isLoading &&
      moviesList.length === 0 &&
      !hasActiveFilters
    ) {
      return (
        <EmptyState
          variant="fullscreen"
          icon={{
            src: "/images/icons/neon-ticket.svg",
            width: 120,
            height: 120,
          }}
          title="No events available"
          message="There are currently no events or screenings to display. Check back soon for updates."
        />
      );
    }

    return null;
  };

  return (
    <PageWrapper className={styles.page}>
      <MainHeader
        isFilterOverlayOpen={isFilterOverlayOpen}
        onFilterClick={() => setIsFilterOverlayOpen(!isFilterOverlayOpen)}
        onFilterTextHeightChange={setFilterTextHeight}
      />
      <FilterOverlay
        isOpen={isFilterOverlayOpen}
        onClose={() => setIsFilterOverlayOpen(false)}
        filterTextHeight={filterTextHeight}
      />
      {renderEmptyState()}
      <WindowScroller>
        {({ height, isScrolling, registerChild, onChildScroll, scrollTop }) => (
          <div
            ref={registerChild}
            style={{
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Grid
              autoHeight
              cellRenderer={cellRenderer}
              columnCount={columnCount}
              columnWidth={POSTER_WIDTH + GAP}
              height={height}
              isScrolling={isScrolling}
              onScroll={onChildScroll}
              rowCount={rowCount}
              rowHeight={POSTER_HEIGHT + GAP}
              scrollTop={scrollTop}
              width={gridWidth}
              overscanRowCount={3}
            />
          </div>
        )}
      </WindowScroller>
      {isLoading && (
        <LoadingIndicator
          message="Loading movies..."
          className={styles.loadingFooter}
        />
      )}
    </PageWrapper>
  );
}
