"use client";
import { useState, useEffect, useMemo, useRef, useDeferredValue } from "react";
import dynamic from "next/dynamic";
import { useCinemaData } from "@/state/cinema-data-context";
import {
  useFilterConfig,
  EVENT_CATEGORIES,
} from "@/state/filter-config-context";
import {
  filterManager,
  suggestFilterRelaxations,
  type FilterSuggestion,
} from "@/lib/filters";
import Button from "@/components/button";
import SearchInput from "@/components/search-input";
import VirtualisedFilmGrid from "@/components/virtualised-film-grid";
import MainHeader from "@/components/main-header";
import LoadingIndicator from "@/components/loading-indicator";
import EmptyState from "@/components/empty-state";
import FilterSuggestions from "@/components/filter-suggestions";
import styles from "./page.module.css";

const FilterOverlay = dynamic(() => import("@/components/filter-overlay"), {
  ssr: false,
});

export default function PageContent() {
  const {
    movies,
    metaData,
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
    applyFilterState,
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

  // Only worth computing when the grid has actually come up empty — each
  // suggestion costs a full pass of the filter pipeline over the dataset.
  const showEmptyState =
    hasAttemptedLoad && !isLoading && !error && moviesList.length === 0;

  // A suggestion pass costs around thirty-five times a filter pass, and every
  // keystroke past the point where a query stops matching would pay for one.
  // Typing a mistyped title is a dozen such keystrokes in a row — precisely
  // when the grid most needs to keep up. Deferring lets React run the offers at
  // low priority, so typing stays responsive and they land once it has time.
  const deferredFilterState = useDeferredValue(filterState);

  // `showEmptyState` measures the *current* query while this pass runs on the
  // deferred copy, so on the keystroke that empties the grid the two disagree.
  // `suggestFilterRelaxations` checks the state it is handed and returns
  // nothing when that state still has results, which is what stops offers for
  // the previous query flashing up here.
  const suggestions = useMemo(() => {
    if (!showEmptyState || isEmpty) return [];
    return suggestFilterRelaxations({
      movies,
      state: deferredFilterState,
      // Naming the categories and venues an offer would let in; without these
      // the offers still work, they just fall back to bare counts.
      categories: EVENT_CATEGORIES,
      venues: metaData?.venues ?? null,
    });
  }, [showEmptyState, isEmpty, movies, metaData, deferredFilterState]);

  const searchRef = useRef<HTMLInputElement>(null);
  const [announcement, setAnnouncement] = useState("");

  // Taking an offer unmounts the button that was just pressed, which drops
  // focus onto <body> — a keyboard or screen reader user loses their place and
  // hears nothing about the grid that replaced it. Move focus somewhere that
  // survives the transition and say what happened.
  const applySuggestion = (suggestion: FilterSuggestion) => {
    applyFilterState(suggestion.state);
    setAnnouncement(
      `${suggestion.headline}. Showing ${suggestion.count.toLocaleString("en-GB")} result${
        suggestion.count === 1 ? "" : "s"
      }.`,
    );
    searchRef.current?.focus();
  };

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

    if (!showEmptyState) {
      return null;
    }

    // Genuinely nothing in the dataset. Keyed on the raw data rather than on
    // "no active filters", which used to promise updates that were already
    // here — a search past the default 7-day window landed on this message
    // while the film it wanted sat in the data, a fortnight out.
    if (isEmpty) {
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

    return (
      <EmptyState
        variant="fullscreen"
        // Offers answer what was just typed, so they belong within reach of the
        // search box rather than a half-screen scroll below it. With nothing to
        // offer there is no action to reach and the roomier centred layout is
        // the better read.
        className={
          suggestions.length > 0 ? styles.emptyStateNearControls : undefined
        }
        icon={{
          src: "/images/icons/neon-clapper.svg",
          width: 120,
          height: 120,
        }}
        title="No events found"
        message={
          suggestions.length === 0
            ? "Nothing matches what you're looking for, at any venue or on any date."
            : // A correction only ever appears when the query matches nothing
              // anywhere, so blaming the filters would be misleading.
              suggestions.some((s) => s.kind === "correct")
              ? "Nothing matches that spelling — but these would work:"
              : "Nothing matches all of your filters at once — but these would work:"
        }
        actions={
          <div className={styles.emptyActions}>
            <FilterSuggestions
              suggestions={suggestions}
              onApply={applySuggestion}
            />
            {hasActiveFilters && (
              <Button variant="secondary" onClick={resetFilters}>
                Reset filters
              </Button>
            )}
          </div>
        }
      />
    );
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
            inputRef={searchRef}
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
      {/* Announces the outcome of taking an offer, since the grid appearing is
          a silent change for anyone not looking at it. */}
      <div
        className={styles.announcer}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement}
      </div>
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
