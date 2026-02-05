"use client";

import { useEffect, useCallback, useMemo, useRef } from "react";
import clsx from "clsx";
import { useCinemaData } from "@/state/cinema-data-context";
import { filterManager } from "@/lib/filters";
import { useFilterConfig } from "@/state/filter-config-context";
import { useGeolocationContext } from "@/state/geolocation-context";
import { useVenueGroups } from "@/hooks/use-venue-groups";
import { getDistanceInMiles, NEARBY_RADIUS_MILES } from "@/utils/geo-distance";
import CategoryFilterSection from "./category-filter-section";
import VenueFilterSection from "./venue-filter-section";
import DateFilterSection from "./date-filter-section";
import styles from "./filter-overlay.module.css";

interface FilterOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  filterTextHeight?: number;
}

export default function FilterOverlay({
  isOpen,
  onClose,
  filterTextHeight = 0,
}: FilterOverlayProps) {
  const {
    filterState,
    toggleCategory,
    selectAllCategories,
    clearAllCategories,
    setSearchQuery,
    toggleGenre,
    selectAllGenres,
    clearAllGenres,
    setDateRange,
    setDateOption,
    setVenueOption,
    toggleVenue,
    selectVenues,
    clearVenues,
  } = useFilterConfig();

  const searchInputRef = useRef<HTMLInputElement>(null);
  const { movies, metaData } = useCinemaData();

  // Geolocation context (persists across overlay open/close)
  const {
    position: userPosition,
    loading: geoLoading,
    error: geoError,
    requestLocation,
  } = useGeolocationContext();

  // Venue groups hook
  const { venueGroups, allVenueIds, cinemaVenueIds, nearbyVenueIds } =
    useVenueGroups(metaData, movies, userPosition);

  // Compute filtered movie and performance counts
  const { movieCount, performanceCount } = useMemo(() => {
    const filteredMovies = filterManager.apply(movies, filterState);
    const movieList = Object.values(filteredMovies);
    const movieCount = movieList.length;
    const performanceCount = movieList.reduce(
      (total, movie) => total + movie.performances.length,
      0,
    );
    return { movieCount, performanceCount };
  }, [movies, filterState]);

  // Calculate dynamic padding based on filter text height
  const countsPaddingTop = useMemo(() => {
    // Base padding is 80px for single line text (~42px tall)
    // Increase padding as text gets taller to push content down
    const baseMargin = 80;
    const singleLineHeight = 42;
    const extraHeight = Math.max(0, filterTextHeight - singleLineHeight);
    return baseMargin + extraHeight;
  }, [filterTextHeight]);

  // Handle nearby venue selection
  const handleNearbyClick = useCallback(async () => {
    // If we already have position, use cached nearby venues
    if (userPosition && nearbyVenueIds.length > 0) {
      setVenueOption("nearby", nearbyVenueIds);
      return;
    }

    // Request location and calculate nearby venues
    const position = await requestLocation();
    if (position && metaData?.venues) {
      const nearby = Object.values(metaData.venues)
        .filter((venue) => {
          const distance = getDistanceInMiles(position, venue.geo);
          return distance <= NEARBY_RADIUS_MILES;
        })
        .map((v) => v.id);
      setVenueOption("nearby", nearby);
    }
  }, [userPosition, nearbyVenueIds, metaData, setVenueOption, requestLocation]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, handleClose]);

  // Get genres array from metadata
  const genres = metaData?.genres ? Object.values(metaData.genres) : null;

  return (
    <div className={clsx(styles.overlay, isOpen && styles.open)}>
      {/* Counts Section */}
      <div
        className={styles.countsSection}
        style={{
          paddingTop:
            filterTextHeight > 0 ? `${countsPaddingTop}px` : undefined,
        }}
      >
        <span className={styles.counts} aria-live="polite" aria-atomic="true">
          {movieCount.toLocaleString("en-GB")} events •{" "}
          {performanceCount.toLocaleString("en-GB")} showings
        </span>
      </div>

      {/* Search Section */}
      <div className={styles.searchSection}>
        <div className={styles.searchInputWrapper}>
          <svg
            className={styles.searchIcon}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <input
            ref={searchInputRef}
            type="text"
            id="filter-search"
            className={styles.searchInput}
            placeholder="Search event title..."
            value={filterState.search}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {filterState.search && (
            <button
              type="button"
              className={styles.searchClear}
              onClick={() => {
                setSearchQuery("");
                searchInputRef.current?.focus();
              }}
              aria-label="Clear search"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18 6L6 18M6 6L18 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.categorySection}>
          <CategoryFilterSection
            movies={movies}
            genres={genres}
            filterState={{
              categories: filterState.categories,
              genres: filterState.genres,
            }}
            toggleCategory={toggleCategory}
            selectAllCategories={selectAllCategories}
            clearAllCategories={clearAllCategories}
            toggleGenre={toggleGenre}
            selectAllGenres={selectAllGenres}
            clearAllGenres={clearAllGenres}
          />
        </div>

        <div className={styles.venueSection}>
          <VenueFilterSection
            venueGroups={venueGroups}
            allVenueIds={allVenueIds}
            cinemaVenueIds={cinemaVenueIds}
            nearbyVenueIds={nearbyVenueIds}
            selectedVenues={filterState.venues}
            geoLoading={geoLoading}
            geoError={geoError}
            onVenueOptionChange={setVenueOption}
            onNearbyClick={handleNearbyClick}
            toggleVenue={toggleVenue}
            selectVenues={selectVenues}
            clearVenues={clearVenues}
          />
        </div>

        <div className={styles.dateSection}>
          <DateFilterSection
            movies={movies}
            dateRange={filterState.dateRange}
            setDateRange={setDateRange}
            setDateOption={setDateOption}
          />
        </div>
      </div>
    </div>
  );
}
