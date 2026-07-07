"use client";
import {
  useState,
  useEffect,
  useMemo,
  forwardRef,
  type ComponentProps,
} from "react";
import clsx from "clsx";
import dynamic from "next/dynamic";
import { VirtuosoGrid } from "react-virtuoso";
import { useCinemaData } from "@/state/cinema-data-context";
import { useFilterConfig } from "@/state/filter-config-context";
import { filterManager } from "@/lib/filters";
import Button from "@/components/button";
import SearchInput from "@/components/search-input";
import MovieCell from "@/components/movie-cell";
import MainHeader from "@/components/main-header";
import LoadingIndicator from "@/components/loading-indicator";
import EmptyState from "@/components/empty-state";
import styles from "./page.module.css";

const FilterOverlay = dynamic(() => import("@/components/filter-overlay"), {
  ssr: false,
});

const POSTER_WIDTH = 200;
const POSTER_HEIGHT = 300;
const GAP = 8;

// Number of initial rows to eagerly load images for (above the fold)
const PRIORITY_ROWS = 2;

// VirtuosoGrid wrappers. The flex list lays out and centres the fixed-size
// posters; the roles give the grid list/listitem semantics.
const GridList = forwardRef<HTMLDivElement, ComponentProps<"div">>(
  function GridList({ className, ...props }, ref) {
    return (
      <div
        {...props}
        ref={ref}
        role="list"
        className={clsx(styles.gridList, className)}
      />
    );
  },
);

const GridItem = forwardRef<HTMLDivElement, ComponentProps<"div">>(
  function GridItem({ className, ...props }, ref) {
    return <div {...props} ref={ref} role="listitem" className={className} />;
  },
);

export default function PageContent() {
  const {
    movies,
    isEmpty,
    isLoading,
    hasAttemptedLoad,
    error,
    getData,
    retry,
  } = useCinemaData();
  const { filterState, setSearchQuery, hasActiveFilters, applyUrlParams } =
    useFilterConfig();

  // Apply any URL params on mount — FilterConfigProvider stays mounted across
  // client-side navigations, so its useState initialiser never re-reads URL
  // params. Without this, navigating to /films?venues=… via a client-side link
  // would leave the filter unapplied until a full refresh.
  useEffect(() => {
    applyUrlParams();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch data once on mount. Empty deps are intentional: all movie data is loaded
  // into global context once, and getData returns early if data already exists.
  useEffect(() => {
    getData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Client viewport width, driving the priority-image count and the reserved
  // grid height below. Read synchronously via a lazy initialiser so the very
  // first client render — including a back-navigation remount — already has the
  // real width; that's what lets us reserve the full height during render,
  // before paint (see reservedHeight). Falls back to one poster wide during SSR
  // where window is unavailable, which is harmless: the grid is gated on
  // client-loaded data and never renders server-side.
  const [windowWidth, setWindowWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : POSTER_WIDTH,
  );
  const [isFilterOverlayOpen, setIsFilterOverlayOpen] = useState(false);
  const [filterTextHeight, setFilterTextHeight] = useState(0);

  const moviesList = useMemo(() => {
    if (isEmpty) return [];
    const filteredMovies = filterManager.apply(movies, filterState);
    return Object.values(filteredMovies).sort((a, b) =>
      a.normalizedTitle.localeCompare(b.normalizedTitle),
    );
  }, [isEmpty, movies, filterState]);

  // Approximate the number of columns the grid will lay out. Layout itself is
  // handled by the CSS grid, not this value; we use it to eagerly load images
  // for the first PRIORITY_ROWS rows and to reserve the grid height below.
  const columnCount = Math.max(
    1,
    Math.floor((windowWidth + GAP) / (POSTER_WIDTH + GAP)),
  );
  const priorityCount = columnCount * PRIORITY_ROWS;

  // VirtuosoGrid only establishes its scroll height after measuring on mount —
  // one paint too late for browser/Next scroll restoration on back-navigation,
  // which then lands on a too-short page. The posters are a fixed 200x300, so we
  // reserve the full height up front instead. Columns come from the window width
  // (>= the grid's own width), so this estimate stays at or below virtuoso's
  // real height and can't leave a blank strip once virtuoso measures.
  const reservedHeight =
    Math.ceil(moviesList.length / columnCount) * (POSTER_HEIGHT + GAP);

  useEffect(() => {
    // Keep the width current on resize; the initial value comes from the lazy
    // initialiser above.
    const handleResize = () => setWindowWidth(window.innerWidth);
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
    <>
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
      {hasAttemptedLoad && !error && !isEmpty && (
        <div className={styles.controls}>
          <SearchInput
            id="films-search"
            className={styles.controlsSearch}
            placeholder="Search event title..."
            ariaLabel="Search event title"
            value={filterState.search}
            onChange={setSearchQuery}
            trailing={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsFilterOverlayOpen(true)}
              >
                More Filters
              </Button>
            }
          />
        </div>
      )}
      {renderEmptyState()}
      {moviesList.length > 0 && (
        <div
          className={styles.gridWrapper}
          style={{ minHeight: reservedHeight }}
        >
          <VirtuosoGrid
            useWindowScroll
            increaseViewportBy={900}
            totalCount={moviesList.length}
            components={{ List: GridList, Item: GridItem }}
            itemContent={(index) => (
              <MovieCell
                movie={moviesList[index]}
                priority={index < priorityCount}
              />
            )}
          />
        </div>
      )}
      {isLoading && (
        <LoadingIndicator
          message="Loading movies..."
          className={styles.loadingFooter}
        />
      )}
    </>
  );
}
