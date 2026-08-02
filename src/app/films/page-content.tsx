"use client";
import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { useCinemaData } from "@/state/cinema-data-context";
import { useFilterConfig } from "@/state/filter-config-context";
import { filterManager } from "@/lib/filters";
import Button from "@/components/button";
import SearchInput from "@/components/search-input";
import VirtualisedFilmGrid from "@/components/virtualised-film-grid";
import MainHeader from "@/components/main-header";
import LoadingIndicator from "@/components/loading-indicator";
import EmptyState from "@/components/empty-state";
import styles from "./page.module.css";

const FilterOverlay = dynamic(() => import("@/components/filter-overlay"), {
  ssr: false,
});

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
  const {
    filterState,
    setSearchQuery,
    resetFilters,
    hasActiveFilters,
    applyUrlParams,
  } = useFilterConfig();

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

  const [isFilterOverlayOpen, setIsFilterOverlayOpen] = useState(false);
  const [filterTextHeight, setFilterTextHeight] = useState(0);

  const moviesList = useMemo(() => {
    if (isEmpty) return [];
    const filteredMovies = filterManager.apply(movies, filterState);
    return Object.values(filteredMovies).sort((a, b) =>
      a.normalizedTitle.localeCompare(b.normalizedTitle),
    );
  }, [isEmpty, movies, filterState]);

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
          {/* Spacer matches the Reset button width so the search bar stays
              centred between the two. */}
          <div className={styles.controlsSpacer} aria-hidden="true" />
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
          <Button
            variant="secondary"
            size="sm"
            className={styles.controlsReset}
            onClick={resetFilters}
            disabled={!hasActiveFilters}
            aria-label="Reset all filters to defaults"
          >
            Reset
          </Button>
        </div>
      )}
      {renderEmptyState()}
      {moviesList.length > 0 && (
        <VirtualisedFilmGrid items={moviesList.map((movie) => ({ movie }))} />
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
