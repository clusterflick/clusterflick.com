"use client";

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type CSSProperties,
} from "react";
import clsx from "clsx";
import { Category } from "@/types";
import { useCinemaData } from "@/state/cinema-data-context";
import {
  filterManager,
  buildFilterUrl,
  FilterId,
  getPeopleVocabulary,
  getMovieVocabulary,
  getActiveFilterIds,
  getChangedFilterIds,
  describeFilterChips,
  FilterChip,
  FilterState,
} from "@/lib/filters";
import {
  useFilterConfig,
  QuickFilter,
  EVENT_CATEGORIES,
} from "@/state/filter-config-context";
import { useGeolocationContext } from "@/state/geolocation-context";
import { useVenueGroups } from "@/hooks/use-venue-groups";
import { getNearbyVenueIds } from "@/utils/geo-distance";
import { getVenueIdsWithShowings } from "@/utils/get-venues-with-showings";
import { trackEvent } from "@/utils/track-event";
import Button from "@/components/button";
import SearchInput from "@/components/search-input";
import QuickFiltersSection from "./quick-filters-section";
import ActiveFiltersSection from "./active-filters-section";
import CategoryFilterSection from "./category-filter-section";
import VenueFilterSection from "./venue-filter-section";
import PeopleFilterSection from "./people-filter-section";
import MovieFilterSection from "./movie-filter-section";
import ProgrammeFilterSection from "./programme-filter-section";
import RatingFilterSection from "./rating-filter-section";
import DateFilterSection from "./date-filter-section";
import ExpandableSection from "@/components/expandable-section";
import { useUserContext } from "@/state/user-context";
import { UserListId } from "@/lib/user-lists";
import styles from "./filter-overlay.module.css";

// The filters inside "More Event Options". Each defaults to no filter, so
// active is the same as narrowing here — unlike categories or dates.
const ADVANCED_EVENT_FILTERS = new Set<FilterId>([
  FilterId.FilmClubs,
  FilterId.Festivals,
  FilterId.Movies,
  FilterId.Directors,
  FilterId.Cast,
  FilterId.LetterboxdRating,
  FilterId.ImdbRating,
  FilterId.RottenTomatoesRating,
  FilterId.Genres,
  FilterId.Accessibility,
  FilterId.FormatSource,
  FilterId.FormatPresentation,
  FilterId.FormatDimension,
]);

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
    togglePerson,
    clearPeople,
    toggleMovie,
    clearMovies,
    toggleProgramme,
    clearProgrammes,
    setRating,
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
    setHideSeen,
    applyQuickFilter,
    isQuickFilterActive,
    widenFilters,
    resetFilters,
    hasActiveFilters,
  } = useFilterConfig();

  const overlayRef = useRef<HTMLDivElement>(null);
  const { movies, metaData, isLoading, hasAttemptedLoad } = useCinemaData();

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

  // "My Venues", limited to the venues this dataset knows. The stored set keeps
  // a venue that has dropped out (it may come back), but a preset that selects
  // it would count a venue the reader can't see and never match a selection
  // made from the chips.
  const { favouriteVenues, lists } = useUserContext();
  const favouriteVenueIds = useMemo(
    () =>
      Object.keys(favouriteVenues ?? {}).filter(
        (id) => metaData?.venues[id] !== undefined,
      ),
    [favouriteVenues, metaData],
  );

  // "Hide films I've seen", offered once the Seen list has loaded. Switching it
  // on stores the list's ids; SeenFilterSync keeps them current from then on.
  const seenIds = useMemo(
    () => (lists ? Object.keys(lists[UserListId.Seen]) : null),
    [lists],
  );
  const hideSeen = useMemo(
    () =>
      seenIds
        ? {
            checked: filterState.hideSeen !== null,
            onChange: (checked: boolean) =>
              setHideSeen(checked ? seenIds : null),
          }
        : undefined,
    [seenIds, filterState.hideSeen, setHideSeen],
  );

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
      hideFinished: true,
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
    trackEvent("filter-preset", { preset: "near-me-today" });
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
    trackEvent("filter-preset", { preset: "this-week" });
    onClose();
  }, [applyQuickFilter, thisWeekPreset, onClose]);

  // Quick filter: show me everything (all event types, all venues, any time).
  const handleEverything = useCallback(() => {
    applyQuickFilter(everythingPreset);
    trackEvent("filter-preset", { preset: "everything" });
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

      // Only what Tab can actually reach: the phone-only results button is
      // taken out of the tab order, and counting it as the last stop would
      // let Tab walk out of the overlay.
      const focusableElements = Array.from(
        overlay.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.tabIndex >= 0);

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
    trackEvent("filter-share");
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

  const handleReset = useCallback(() => {
    trackEvent("filter-reset");
    resetFilters();
  }, [resetFilters]);

  // The active-filters strip. Films are withheld until loading has finished,
  // as the header's description does, so a selection isn't named as not
  // showing while its films are still arriving. Venue sets are the ones the
  // venue pills select, so a pill's selection is named after the pill.
  const filterChips = useMemo(
    () =>
      describeFilterChips({
        state: filterState,
        categories: EVENT_CATEGORIES,
        venues: metaData?.venues ?? null,
        genres: metaData?.genres ?? null,
        people: metaData?.people ?? null,
        movies: hasAttemptedLoad && !isLoading ? movies : null,
        cinemaVenueIds,
        nearbyVenueIds,
      }),
    [
      filterState,
      metaData,
      movies,
      isLoading,
      hasAttemptedLoad,
      cinemaVenueIds,
      nearbyVenueIds,
    ],
  );

  const handleRemoveChip = useCallback(
    (chip: FilterChip) => {
      trackEvent("filter-chip-remove", {
        filter: chip.key,
        isDefault: chip.isDefault,
      });
      widenFilters(chip.filterIds);
    },
    [widenFilters],
  );

  // Which filters a visit to the overlay changed, recorded once when it
  // closes rather than per tap, so a reader dragging a slider or typing a
  // name is one visit and not thirty. Only filter ids are sent, never their
  // values: what a reader searched for is theirs.
  const latestFilterState = useRef(filterState);
  useEffect(() => {
    latestFilterState.current = filterState;
  });
  const openedWithState = useRef<FilterState | null>(null);
  useEffect(() => {
    if (isOpen) {
      openedWithState.current = latestFilterState.current;
      return;
    }
    const before = openedWithState.current;
    if (!before) return;
    openedWithState.current = null;
    const changed = getChangedFilterIds(before, latestFilterState.current);
    trackEvent("filter-overlay-close", {
      changed: changed.length > 0 ? changed.join(",") : "none",
      count: changed.length,
    });
  }, [isOpen]);

  // Get genres array from metadata
  const genres = metaData?.genres ? Object.values(metaData.genres) : null;

  // Folded from the films rather than read off `metaData.people`, which
  // carries no role and so cannot say who directed. Memoised on the dataset:
  // it is one pass over every film's credits, not something to redo per open.
  const peopleVocabulary = useMemo(
    () => getPeopleVocabulary(movies, metaData?.people ?? null),
    [movies, metaData],
  );

  // Memoised on the dataset for the same reason: a sort over every film.
  const movieVocabulary = useMemo(() => getMovieVocabulary(movies), [movies]);

  // Opened while any of its filters is narrowing, so one set elsewhere — a
  // watchlist link, a director's name on a film page, a leftover genre — is
  // never hidden behind the trigger when the reader comes looking for it.
  const hasAdvancedEventFilter = getActiveFilterIds(filterState).some((id) =>
    ADVANCED_EVENT_FILTERS.has(id),
  );

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
        style={
          filterTextHeight > 0
            ? ({ "--counts-offset": `${countsPaddingTop}px` } as CSSProperties)
            : undefined
        }
      >
        <div className={styles.counts} aria-live="polite" aria-atomic="true">
          {movieCount.toLocaleString("en-GB")} events,{" "}
          {performanceCount.toLocaleString("en-GB")} showings
        </div>
        <div className={styles.filterControls}>
          <QuickFiltersSection
            onNearMeToday={handleNearMeToday}
            onThisWeek={handleThisWeek}
            geoLoading={geoLoading}
            nearMeTodayActive={nearMeTodayActive}
            thisWeekActive={thisWeekActive}
          />
          <div className={styles.filterLinks}>
            <Button
              variant="link"
              size="sm"
              onClick={handleReset}
              disabled={!hasActiveFilters}
              aria-label="Reset all filters to defaults"
            >
              Reset
            </Button>
            <span className={styles.countsDivider} aria-hidden="true">
              •
            </span>
            {/* The "everything" preset: all event types, venues and dates.
                Beside Reset because it is the other way out of the current
                filters — wider than the defaults rather than back to them. */}
            <Button
              variant="link"
              size="sm"
              onClick={handleEverything}
              disabled={everythingActive}
            >
              Show everything
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
              Share
            </Button>
            <span className={styles.countsDivider} aria-hidden="true">
              •
            </span>
            {/* No aria-label: "Close Filters" is already a good accessible
                name, and an aria-label that doesn't contain the visible text
                breaks voice control (WCAG 2.5.3, Label in Name). It also
                collided with the header trigger, whose own label reads "Close
                filter options" while the overlay is open. */}
            <Button variant="link" size="sm" onClick={handleClose}>
              Close Filters
            </Button>
          </div>
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
        <ActiveFiltersSection chips={filterChips} onRemove={handleRemoveChip} />
      </div>

      <div className={styles.content}>
        <div className={styles.categorySection}>
          <CategoryFilterSection
            movies={movies}
            expandAdvanced={hasAdvancedEventFilter}
            beforeGenres={
              <>
                <ProgrammeFilterSection
                  movies={movies}
                  selected={{
                    [FilterId.FilmClubs]: filterState.filmClubs,
                    [FilterId.Festivals]: filterState.festivals,
                  }}
                  toggleProgramme={toggleProgramme}
                  clearProgrammes={clearProgrammes}
                />
                <MovieFilterSection
                  vocabulary={movieVocabulary}
                  selected={filterState.movies}
                  toggleMovie={toggleMovie}
                  clearMovies={clearMovies}
                />
                <PeopleFilterSection
                  vocabulary={peopleVocabulary}
                  selected={{
                    [FilterId.Directors]: filterState.directors,
                    [FilterId.Cast]: filterState.cast,
                  }}
                  togglePerson={togglePerson}
                  clearPeople={clearPeople}
                />
                <RatingFilterSection
                  selected={{
                    [FilterId.LetterboxdRating]: filterState.letterboxdRating,
                    [FilterId.ImdbRating]: filterState.imdbRating,
                    [FilterId.RottenTomatoesRating]:
                      filterState.rottenTomatoesRating,
                  }}
                  setRating={setRating}
                />
              </>
            }
            genres={genres}
            hideSeen={hideSeen}
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
            favouriteVenueIds={favouriteVenueIds}
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

      {/* Phones only: the header's Close is a small link at the top of a long
          scroll, so the way back to the results sits under the thumb and says
          what it will show. Hidden from assistive tech, which already has the
          header's Close Filters and the live counts. */}
      <div className={styles.showResults} aria-hidden="true">
        <button
          type="button"
          className={styles.showResultsButton}
          onClick={handleClose}
          tabIndex={-1}
        >
          Show {movieCount.toLocaleString("en-GB")}{" "}
          {movieCount === 1 ? "event" : "events"}
        </button>
      </div>
    </div>
  );
}
