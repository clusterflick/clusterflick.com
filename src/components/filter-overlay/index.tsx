"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import clsx from "clsx";
import { Category } from "@/types";
import { useCinemaData } from "@/state/cinema-data-context";
import { filterManager, buildFilterUrl, FilterId } from "@/lib/filters";
import { useFilterConfig, QuickFilter } from "@/state/filter-config-context";
import { useGeolocationContext } from "@/state/geolocation-context";
import { useVenueGroups } from "@/hooks/use-venue-groups";
import { getNearbyVenueIds } from "@/utils/geo-distance";
import { getVenueIdsWithShowings } from "@/utils/get-venues-with-showings";
import Button from "@/components/button";
import SearchInput from "@/components/search-input";
import QuickFiltersSection from "./quick-filters-section";
import CategoryFilterSection from "./category-filter-section";
import VenueFilterSection from "./venue-filter-section";
import DateFilterSection from "./date-filter-section";
import ExpandableSection from "@/components/expandable-section";
import styles from "./filter-overlay.module.css";

// How long the "link copied" confirmation stays up. Long enough to read the
// explanation, short enough that it's gone before you next look at the counts.
const SHARE_TOAST_MS = 5000;

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
    toggleFormat,
    selectAllFormat,
    clearAllFormat,
    setDateRange,
    setDateOption,
    setTimeRange,
    setTimeOption,
    setVenueOption,
    toggleVenue,
    selectVenues,
    clearVenues,
    toggleHideFinished,
    toggleHideSoldOut,
    applyQuickFilter,
    isQuickFilterActive,
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

  // Shown when "Venues Near Me" resolves a location but finds nothing within
  // range. Distinct from geoError, which covers not getting a location at all.
  const [nearbyNotice, setNearbyNotice] = useState<string | null>(null);

  // Handle nearby venue selection
  const handleNearbyClick = useCallback(async () => {
    setNearbyNotice(null);

    // If we already have position, use cached nearby venues
    if (userPosition && nearbyVenueIds.length > 0) {
      setVenueOption("nearby", nearbyVenueIds);
      return;
    }

    // Request location and calculate nearby venues
    const position = await requestLocation();
    if (!position || !metaData?.venues) return;

    const nearby = getNearbyVenueIds(
      position,
      Object.values(metaData.venues),
      getVenueIdsWithShowings(movies),
    );

    // Nothing in range. Applying this would select zero venues and empty the
    // results, which reads as a broken filter rather than an answer — so leave
    // the existing selection alone and say what happened instead.
    if (nearby.length === 0) {
      setNearbyNotice(
        "No venues with showings found near you — your venue selection is unchanged.",
      );
      return;
    }

    setVenueOption("nearby", nearby);
  }, [
    userPosition,
    nearbyVenueIds,
    metaData,
    movies,
    setVenueOption,
    requestLocation,
  ]);

  // Event types shared by the film-focused quick filters
  const FILM_CATEGORIES = useMemo(
    () => [Category.Movie, Category.Shorts, Category.MultipleMovies],
    [],
  );

  // Preset definitions, shared by the click handlers (to apply the preset) and
  // the active checks (to show the matching card as selected). "Near me today"
  // uses the currently-resolved nearby venues; before a location is known it has
  // no venues and so is never marked active.
  const nearMeTodayPreset = useMemo<QuickFilter>(
    () => ({
      categories: FILM_CATEGORIES,
      venues: nearbyVenueIds,
      dateOption: "today",
      hideFinished: true,
    }),
    [FILM_CATEGORIES, nearbyVenueIds],
  );

  const thisWeekPreset = useMemo<QuickFilter>(
    () => ({
      categories: FILM_CATEGORIES,
      venues: null,
      dateOption: "this-week",
      hideFinished: false,
    }),
    [FILM_CATEGORIES],
  );

  const everythingPreset = useMemo<QuickFilter>(
    () => ({
      categories: null,
      venues: null,
      dateOption: "all-time",
      hideFinished: false,
    }),
    [],
  );

  // Quick filter: what's on near me today. Resolves the user's nearby venues
  // (requesting location if needed) then applies the preset and closes.
  const handleNearMeToday = useCallback(async () => {
    setNearbyNotice(null);

    let nearby = nearbyVenueIds;
    let located = Boolean(userPosition);
    if (!(userPosition && nearby.length > 0)) {
      const position = await requestLocation();
      located = Boolean(position);
      if (position && metaData?.venues) {
        nearby = getNearbyVenueIds(
          position,
          Object.values(metaData.venues),
          getVenueIdsWithShowings(movies),
        );
      }
    }
    // Don't apply a preset with no venues — it would empty the results and read
    // as a broken filter. A failed lookup is already explained by geoError in
    // the venue section; a successful one that simply found nothing isn't, so
    // that case says so itself.
    if (nearby.length === 0) {
      if (located) {
        setNearbyNotice(
          "No venues with showings found near you — your filters are unchanged.",
        );
      }
      return;
    }

    applyQuickFilter({ ...nearMeTodayPreset, venues: nearby });
    onClose();
  }, [
    userPosition,
    nearbyVenueIds,
    metaData,
    movies,
    requestLocation,
    applyQuickFilter,
    nearMeTodayPreset,
    onClose,
  ]);

  // Quick filter: what's on this week, all venues.
  const handleThisWeek = useCallback(() => {
    applyQuickFilter(thisWeekPreset);
    onClose();
  }, [applyQuickFilter, thisWeekPreset, onClose]);

  // Quick filter: show me everything (all event types, all venues, any time).
  const handleEverything = useCallback(() => {
    applyQuickFilter(everythingPreset);
    onClose();
  }, [applyQuickFilter, everythingPreset, onClose]);

  // Which preset (if any) the current filter state matches, so its card can be
  // shown as selected.
  const nearMeTodayActive =
    nearbyVenueIds.length > 0 && isQuickFilterActive(nearMeTodayPreset);
  const thisWeekActive = isQuickFilterActive(thisWeekPreset);
  const everythingActive = isQuickFilterActive(everythingPreset);

  // Share filters. "Copied!" on its own doesn't tell anyone what was copied or
  // what it does, so the result is announced as a short explanatory toast — and
  // when the clipboard is unavailable (insecure context, permission denied) the
  // toast shows the link itself so it can still be copied by hand.
  const [share, setShare] = useState<{
    status: "copied" | "error";
    url: string;
  } | null>(null);
  const shareTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClose = useCallback(() => {
    // Transient feedback shouldn't survive the panel it belongs to — a reopened
    // overlay would otherwise still be claiming something was just copied.
    setShare(null);
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

  const handleShareFilters = useCallback(async () => {
    const url = buildFilterUrl(filterState);
    try {
      await navigator.clipboard.writeText(url);
      setShare({ status: "copied", url });
    } catch {
      setShare({ status: "error", url });
    }
    if (shareTimer.current) clearTimeout(shareTimer.current);
    shareTimer.current = setTimeout(() => setShare(null), SHARE_TOAST_MS);
  }, [filterState]);

  // Don't leave a timer running against an unmounted overlay.
  useEffect(() => {
    return () => {
      if (shareTimer.current) clearTimeout(shareTimer.current);
    };
  }, []);

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
          <Button
            variant="link"
            size="sm"
            onClick={resetFilters}
            disabled={!hasActiveFilters}
            aria-label="Reset all filters to defaults"
          >
            Reset Filters
          </Button>
          <span className={styles.countsDivider} aria-hidden="true">
            •
          </span>
          <Button
            variant="link"
            size="sm"
            onClick={handleShareFilters}
            aria-label="Copy shareable filter URL to clipboard"
          >
            Share Filters
          </Button>
          <span className={styles.countsDivider} aria-hidden="true">
            •
          </span>
          {/* No aria-label: "Close Filters" is already a good accessible name,
              and an aria-label that doesn't contain the visible text breaks
              voice control (WCAG 2.5.3, Label in Name). It also collided with
              the header trigger, whose own label reads "Close filter options"
              while the overlay is open. */}
          <Button variant="link" size="sm" onClick={handleClose}>
            Close Filters
          </Button>
        </div>
        {share && (
          <div className={styles.shareToast} role="status">
            {share.status === "copied" ? (
              <>
                <span className={styles.shareToastTitle}>
                  ✓ Link copied to your clipboard
                </span>
                <span className={styles.shareToastBody}>
                  Paste it anywhere — whoever opens it lands on Clusterflick
                  with exactly these filters already applied.
                </span>
              </>
            ) : (
              <>
                <span className={styles.shareToastTitle}>
                  Couldn&rsquo;t reach your clipboard
                </span>
                <span className={styles.shareToastBody}>
                  Copy this link by hand — it opens Clusterflick with these
                  filters applied:
                </span>
                <span className={styles.shareToastUrl}>{share.url}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Quick Filters */}
      <QuickFiltersSection
        onNearMeToday={handleNearMeToday}
        onThisWeek={handleThisWeek}
        onEverything={handleEverything}
        geoLoading={geoLoading}
        nearMeTodayActive={nearMeTodayActive}
        thisWeekActive={thisWeekActive}
        everythingActive={everythingActive}
      />

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
              formats: {
                [FilterId.FormatSource]: filterState.formatSource,
                [FilterId.FormatPresentation]: filterState.formatPresentation,
                [FilterId.FormatDimension]: filterState.formatDimension,
              },
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
            toggleFormat={toggleFormat}
            selectAllFormat={selectAllFormat}
            clearAllFormat={clearAllFormat}
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
            nearbyNotice={nearbyNotice}
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
            timeRange={filterState.timeRange}
            setTimeRange={setTimeRange}
            setTimeOption={setTimeOption}
            hideFinished={filterState.hideFinished}
            onToggleHideFinished={toggleHideFinished}
            hideSoldOut={filterState.hideSoldOut}
            onToggleHideSoldOut={toggleHideSoldOut}
          />
        </div>
      </div>
    </div>
  );
}
