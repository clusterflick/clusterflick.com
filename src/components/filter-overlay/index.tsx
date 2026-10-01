"use client";

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import clsx from "clsx";
import Link from "next/link";
import { Category } from "@/types";
import { useCinemaData } from "@/state/cinema-data-context";
import {
  filterManager,
  buildFilterUrl,
  FilterId,
  getPeopleVocabulary,
  getMovieVocabulary,
  getChangedFilterIds,
  describeFilterChips,
  buildFilterSearchGroups,
  applyFilterSearchEntry,
  FilterChip,
  FilterSearchEntry,
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
import AccessibilityFilterSection from "./accessibility-filter-section";
import FormatFilterSection from "./format-filter-section";
import GenreFilterSection from "./genre-filter-section";
import RefineRow from "./refine-row";
import FilterSearch, { SearchRedirect } from "./filter-search";
import {
  FILTER_TARGETS,
  REFINE_ROWS,
  RefineRowId,
  getRowStatuses,
} from "./filter-targets";
import ExpandableSection from "@/components/expandable-section";
import Switch from "@/components/switch";
import { useUserContext } from "@/state/user-context";
import { UserListId } from "@/lib/user-lists";
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
    applyFilterState,
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

  // Refine rows. Each opens by itself when its filter becomes set — on mount
  // too, so a filter arriving from a link is never behind a closed row — and
  // never closes by itself: snapping shut under a reader mid-edit is worse
  // than staying open. Adjusted during render rather than in an effect, so a
  // row never paints closed for a frame first.
  const rowStatuses = useMemo(
    () => getRowStatuses(filterChips, filterState),
    [filterChips, filterState],
  );
  const setRows = REFINE_ROWS.filter(({ id }) => rowStatuses[id].isSet)
    .map(({ id }) => id)
    .join(",");
  const [openRows, setOpenRows] = useState<ReadonlySet<RefineRowId>>(
    () =>
      new Set(
        REFINE_ROWS.filter(({ id }) => rowStatuses[id].isSet).map(
          ({ id }) => id,
        ),
      ),
  );
  const [lastSetRows, setLastSetRows] = useState(setRows);
  if (setRows !== lastSetRows) {
    const wasSet = new Set(lastSetRows.split(","));
    setLastSetRows(setRows);
    const newlySet = REFINE_ROWS.filter(
      ({ id }) => rowStatuses[id].isSet && !wasSet.has(id),
    ).map(({ id }) => id);
    if (newlySet.length > 0) {
      setOpenRows((open) => new Set([...open, ...newlySet]));
    }
  }

  const toggleRow = useCallback((row: RefineRowId) => {
    setOpenRows((open) => {
      const next = new Set(open);
      if (next.has(row)) {
        next.delete(row);
      } else {
        next.add(row);
        trackEvent("filter-row-open", { row });
      }
      return next;
    });
  }, []);

  // A chip's label goes to its controls: opens its row if it has one, then
  // brings it to the middle of the screen (clear of the pinned bar above and
  // the phone's results button below) and moves focus there, so a keyboard
  // reader lands on what they asked for.
  const handleOpenChip = useCallback((chip: FilterChip) => {
    trackEvent("filter-chip-open", { filter: chip.key });
    const target = FILTER_TARGETS[chip.filterIds[0]];
    const elementId =
      target.kind === "row" ? `refine-${target.row}` : target.elementId;
    if (target.kind === "row") {
      setOpenRows((open) => new Set([...open, target.row]));
    }
    requestAnimationFrame(() => {
      const element = overlayRef.current?.querySelector<HTMLElement>(
        `#${elementId}`,
      );
      if (!element) return;
      // A row's trigger rather than the row: an open row can be taller than
      // the screen, and centring all of it put its heading under the bar.
      const focusTarget = element.matches("input")
        ? element
        : element.querySelector("button");
      (focusTarget ?? element).scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "center",
      });
      focusTarget?.focus({ preventScroll: true });
    });
  }, []);

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

  // Everything the search menu can offer, memoised on the dataset. Venues go
  // busiest first, as people do, so a short query meets the likeliest ones.
  const filterSearchGroups = useMemo(
    () =>
      buildFilterSearchGroups({
        categories: EVENT_CATEGORIES,
        genres: metaData?.genres ?? null,
        people: peopleVocabulary,
        venues: venueGroups
          .flatMap((group) => group.venues)
          .sort((a, b) => b.count - a.count),
      }),
    [metaData, peopleVocabulary, venueGroups],
  );

  const handlePickSearchEntry = useCallback(
    (entry: FilterSearchEntry) => {
      trackEvent("filter-search-pick", { filter: entry.filterId });
      applyFilterState(applyFilterSearchEntry(filterState, entry));
    },
    [applyFilterState, filterState],
  );

  // Moves the title query into one of the other text fields, as the
  // suggestion engine's redirect does.
  const handleSearchRedirect = useCallback(
    (field: SearchRedirect) => {
      trackEvent("filter-search-redirect", { field });
      const query = filterState.search;
      if (field === "showingTitleSearch") setShowingTitleSearchQuery(query);
      else setPerformanceNotesSearchQuery(query);
      setSearchQuery("");
    },
    [
      filterState.search,
      setSearchQuery,
      setShowingTitleSearchQuery,
      setPerformanceNotesSearchQuery,
    ],
  );

  // Memoised on the dataset for the same reason: a sort over every film.
  const movieVocabulary = useMemo(() => getMovieVocabulary(movies), [movies]);

  const refineRowContent: Record<RefineRowId, ReactNode> = {
    accessibility: (
      <AccessibilityFilterSection
        movies={movies}
        selected={filterState.accessibility}
        toggleAccessibility={toggleAccessibility}
        selectAllAccessibility={selectAllAccessibility}
        clearAllAccessibility={clearAllAccessibility}
      />
    ),
    format: (
      <FormatFilterSection
        movies={movies}
        selected={{
          [FilterId.FormatSource]: filterState.formatSource,
          [FilterId.FormatPresentation]: filterState.formatPresentation,
          [FilterId.FormatDimension]: filterState.formatDimension,
        }}
        toggleFormat={toggleFormat}
        selectAllFormat={selectAllFormat}
        clearAllFormat={clearAllFormat}
      />
    ),
    genre: (
      <GenreFilterSection
        movies={movies}
        genres={genres}
        selected={filterState.genres}
        toggleGenre={toggleGenre}
        selectAllGenres={selectAllGenres}
        clearAllGenres={clearAllGenres}
      />
    ),
    ratings: (
      <RatingFilterSection
        selected={{
          [FilterId.LetterboxdRating]: filterState.letterboxdRating,
          [FilterId.ImdbRating]: filterState.imdbRating,
          [FilterId.RottenTomatoesRating]: filterState.rottenTomatoesRating,
        }}
        setRating={setRating}
      />
    ),
    people: (
      <div className={styles.advancedFilters}>
        <PeopleFilterSection
          vocabulary={peopleVocabulary}
          selected={{
            [FilterId.Directors]: filterState.directors,
            [FilterId.Cast]: filterState.cast,
          }}
          togglePerson={togglePerson}
          clearPeople={clearPeople}
        />
      </div>
    ),
    films: (
      <MovieFilterSection
        vocabulary={movieVocabulary}
        selected={filterState.movies}
        toggleMovie={toggleMovie}
        clearMovies={clearMovies}
      />
    ),
    programmes: (
      <div className={styles.advancedFilters}>
        <div className={styles.refineRowLead}>
          <p className={styles.sectionDescription}>
            <Link href="/film-clubs">See all film clubs</Link>
          </p>
          <p className={styles.sectionDescription}>
            <Link href="/festivals">See all festivals</Link>
          </p>
        </div>
        <ProgrammeFilterSection
          movies={movies}
          selected={{
            [FilterId.FilmClubs]: filterState.filmClubs,
            [FilterId.Festivals]: filterState.festivals,
          }}
          toggleProgramme={toggleProgramme}
          clearProgrammes={clearProgrammes}
        />
      </div>
    ),
    // Both answer "don't show me screenings I can't go to", so they sit
    // together. Settings about which showings count rather than about dates.
    showings: (
      <div className={styles.showingSwitches}>
        <Switch
          id="hide-finished"
          label="Hide past showings"
          checked={filterState.hideFinished}
          onChange={toggleHideFinished}
        />
        <Switch
          id="hide-sold-out"
          label="Hide sold out showings"
          checked={filterState.hideSoldOut}
          onChange={toggleHideSoldOut}
        />
      </div>
    ),
  };

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
        <FilterSearch
          active={isOpen}
          query={filterState.search}
          onQueryChange={setSearchQuery}
          groups={filterSearchGroups}
          filterState={filterState}
          onPick={handlePickSearchEntry}
          onRedirect={handleSearchRedirect}
        />
        <ExpandableSection
          title="More Search Options"
          expandWhen={
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
        <ActiveFiltersSection
          chips={filterChips}
          onOpen={handleOpenChip}
          onRemove={handleRemoveChip}
        />
      </div>

      {/* Core filters on the left, always in view; the Refine list on the
          right, one line per specialist filter. Side by side so the Refine
          list is on screen from the start, and opening a row can't push the
          core filters down. One column below 1200px. */}
      <div className={styles.content}>
        <div className={styles.coreColumn}>
          <DateFilterSection
            movies={movies}
            dateRange={filterState.dateRange}
            setDateRange={setDateRange}
            setDateOption={setDateOption}
            timeRange={filterState.timeRange}
            setTimeRange={setTimeRange}
            setTimeOption={setTimeOption}
          />
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
          <CategoryFilterSection
            movies={movies}
            categories={filterState.categories}
            hideSeen={hideSeen}
            toggleCategory={toggleCategory}
            selectAllCategories={selectAllCategories}
            clearAllCategories={clearAllCategories}
          />
        </div>

        <section className={styles.section} aria-labelledby="refine-heading">
          <div className={styles.sectionHeader}>
            <h3 id="refine-heading" className={styles.sectionTitle}>
              Refine
            </h3>
          </div>
          <p className={styles.sectionDescription}>
            More ways to narrow down what&apos;s showing
          </p>
          <div className={styles.refineList}>
            {REFINE_ROWS.map(({ id, title }) => (
              <RefineRow
                key={id}
                id={id}
                title={title}
                summary={rowStatuses[id].summary}
                isSet={rowStatuses[id].isSet}
                open={openRows.has(id)}
                onToggle={() => toggleRow(id)}
              >
                {refineRowContent[id]}
              </RefineRow>
            ))}
          </div>
        </section>
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
