"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import clsx from "clsx";
import { useCinemaData } from "@/state/cinema-data-context";
import { filterManager, buildFilterUrl } from "@/lib/filters";
import { useFilterConfig } from "@/state/filter-config-context";
import { useGeolocationContext } from "@/state/geolocation-context";
import { useVenueGroups } from "@/hooks/use-venue-groups";
import { getNearbyVenueIds } from "@/utils/geo-distance";
import { getVenueIdsWithShowings } from "@/utils/get-venues-with-showings";
import Button from "@/components/button";
import SearchInput from "@/components/search-input";
import CategoryFilterSection from "./category-filter-section";
import VenueFilterSection from "./venue-filter-section";
import DateFilterSection from "./date-filter-section";
import ExpandableSection from "@/components/expandable-section";
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
    setShowingTitleSearchQuery,
    setPerformanceNotesSearchQuery,
    toggleGenre,
    selectAllGenres,
    clearAllGenres,
    toggleAccessibility,
    selectAllAccessibility,
    clearAllAccessibility,
    setDateRange,
    setDateOption,
    setVenueOption,
    toggleVenue,
    selectVenues,
    clearVenues,
    toggleHideFinished,
    resetFilters,
    hasActiveFilters,
  } = useFilterConfig();

  const overlayRef = useRef<HTMLDivElement>(null);
  const { movies, metaData } = useCinemaData();

  // Geolocation context (persists across overlay open/close)
  const {
    position: userPosition,
    loading: geoLoading,
    error: geoError,
    requestLocation,
  } = useGeolocationContext();

  // Venue groups hook
  const {
    venueGroups,
    allVenueIds,
    cinemaVenueIds,
    smallScreeningVenueIds,
    nearbyVenueIds,
  } = useVenueGroups(metaData, movies, userPosition);

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
      const nearby = getNearbyVenueIds(
        position,
        Object.values(metaData.venues),
        getVenueIdsWithShowings(movies),
      );
      setVenueOption("nearby", nearby);
    }
  }, [
    userPosition,
    nearbyVenueIds,
    metaData,
    movies,
    setVenueOption,
    requestLocation,
  ]);

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

  // Focus trap: keep focus within overlay when open
  useEffect(() => {
    if (!isOpen || !overlayRef.current) return;

    const overlay = overlayRef.current;

    const handleFocusTrap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const focusableElements = overlay.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );

      if (focusableElements.length === 0) return;

      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener("keydown", handleFocusTrap);
    return () => document.removeEventListener("keydown", handleFocusTrap);
  }, [isOpen]);

  // Share filters
  const [copied, setCopied] = useState(false);

  const handleShareFilters = useCallback(async () => {
    const url = buildFilterUrl(filterState);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: silently fail if clipboard is unavailable
    }
  }, [filterState]);

  // Get genres array from metadata
  const genres = metaData?.genres ? Object.values(metaData.genres) : null;

  return (
    <div
      ref={overlayRef}
      className={clsx(styles.overlay, isOpen && styles.open)}
      role="dialog"
      aria-modal="true"
      aria-label="Filter options"
      aria-hidden={!isOpen}
    >
      {/* Counts Section */}
      <div
        className={styles.countsSection}
        style={{
          paddingTop:
            filterTextHeight > 0 ? `${countsPaddingTop}px` : undefined,
        }}
      >
        <div className={styles.counts} aria-live="polite" aria-atomic="true">
          {movieCount.toLocaleString("en-GB")} events,{" "}
          {performanceCount.toLocaleString("en-GB")} showings
        </div>
        <div className={styles.filterControls}>
          <span className={styles.controlLeft}>
            <Button
              variant="link"
              size="sm"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              aria-label="Reset all filters to defaults"
            >
              Reset Filters
            </Button>
          </span>
          <span className={styles.countsDivider} aria-hidden="true">
            •
          </span>
          <span className={styles.controlRight} aria-live="assertive">
            <Button
              variant="link"
              size="sm"
              onClick={handleShareFilters}
              aria-label="Copy shareable filter URL to clipboard"
            >
              {copied ? "Copied!" : "Share Filters"}
            </Button>
          </span>
        </div>
      </div>

      {/* Search Section */}
      <div className={styles.searchSection}>
        <SearchInput
          id="filter-search"
          placeholder="Search event title..."
          ariaLabel="Search event title"
          value={filterState.search}
          onChange={setSearchQuery}
        />
        <ExpandableSection
          title="More Search Options"
          defaultExpanded={
            filterState.showingTitleSearch.length > 0 ||
            filterState.performanceNotesSearch.length > 0
          }
        >
          <div className={styles.showingTitleSearchWrapper}>
            <SearchInput
              id="filter-showing-title-search"
              placeholder="Search original venue title..."
              ariaLabel="Search original venue title"
              value={filterState.showingTitleSearch}
              onChange={setShowingTitleSearchQuery}
            />
            <SearchInput
              id="filter-performance-notes-search"
              placeholder="Search performance notes..."
              ariaLabel="Search performance notes"
              value={filterState.performanceNotesSearch}
              onChange={setPerformanceNotesSearchQuery}
            />
          </div>
        </ExpandableSection>
      </div>

      <div className={styles.content}>
        <div className={styles.categorySection}>
          <CategoryFilterSection
            movies={movies}
            genres={genres}
            filterState={{
              categories: filterState.categories,
              genres: filterState.genres,
              accessibility: filterState.accessibility,
            }}
            toggleCategory={toggleCategory}
            selectAllCategories={selectAllCategories}
            clearAllCategories={clearAllCategories}
            toggleGenre={toggleGenre}
            selectAllGenres={selectAllGenres}
            clearAllGenres={clearAllGenres}
            toggleAccessibility={toggleAccessibility}
            selectAllAccessibility={selectAllAccessibility}
            clearAllAccessibility={clearAllAccessibility}
          />
        </div>

        <div className={styles.venueSection}>
          <VenueFilterSection
            venueGroups={venueGroups}
            allVenueIds={allVenueIds}
            cinemaVenueIds={cinemaVenueIds}
            smallScreeningVenueIds={smallScreeningVenueIds}
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
            hideFinished={filterState.hideFinished}
            onToggleHideFinished={toggleHideFinished}
          />
        </div>
      </div>
    </div>
  );
}
