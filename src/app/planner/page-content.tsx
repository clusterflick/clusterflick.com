"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  Virtuoso,
  type StateSnapshot,
  type VirtuosoHandle,
} from "react-virtuoso";
import { useCinemaData } from "@/state/cinema-data-context";
import { useFilterConfig } from "@/state/filter-config-context";
import { filterManager } from "@/lib/filters";
import Button from "@/components/button";
import DayStepper from "@/components/day-stepper";
import EmptyState from "@/components/empty-state";
import LoadingIndicator from "@/components/loading-indicator";
import MainHeader from "@/components/main-header";
import PlannerRow from "@/components/planner-row";
import {
  dateStringToLondonTimestamp,
  formatDateLong,
  getLondonMidnightTimestamp,
  timestampToLondonDateString,
} from "@/utils/format-date";
import { getMovieUrl } from "@/utils/get-movie-url";
import {
  clampToRange,
  findNearestShowingDay,
  getPlannerRange,
  getPlannerRows,
  isDateString,
  shiftDate,
  type DateString,
} from "@/utils/get-planner-day";
import styles from "./page.module.css";

const FilterOverlay = dynamic(() => import("@/components/filter-overlay"), {
  ssr: false,
});

/**
 * The day being viewed rides in the URL so the back button from a listing page
 * returns to it. It is view state, not filter state: the filters' own URL
 * params are stripped once read, and this must survive that.
 */
const DAY_PARAM = "day";

function readDayFromUrl(): DateString | null {
  if (typeof window === "undefined") return null;
  const day = new URLSearchParams(window.location.search).get(DAY_PARAM);
  return isDateString(day) ? day : null;
}

/**
 * Rows vary in height, so unlike the catalogue there is no reserving the page
 * height up front for the browser's own scroll restoration to land in. Instead
 * Virtuoso's snapshot — measured row sizes plus scroll position — is taken on
 * the way out to a listing page and handed back on return.
 */
const SCROLL_STORAGE_KEY = "clusterflick-planner-scroll";

interface SavedScroll {
  day: DateString;
  /** First and last film, to tell the same list from a re-filtered one. */
  signature: string;
  snapshot: StateSnapshot;
}

function getRowsSignature(rows: { movie: { id: string } }[]): string {
  return `${rows.length}:${rows[0]?.movie.id}:${rows[rows.length - 1]?.movie.id}`;
}

/** Read once and cleared, so only the return trip restores it. */
function takeSavedScroll(): SavedScroll | null {
  try {
    const raw = sessionStorage.getItem(SCROLL_STORAGE_KEY);
    sessionStorage.removeItem(SCROLL_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedScroll) : null;
  } catch {
    return null;
  }
}

function writeDayToUrl(day: DateString) {
  const url = `${window.location.pathname}?${DAY_PARAM}=${day}`;
  window.history.replaceState(null, "", url);
}

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
    hydrateUrl,
  } = useCinemaData();
  const { filterState, resetFilters, hasActiveFilters, applyUrlParams } =
    useFilterConfig();

  // The day the reader chose, or null to follow the start of the range. Kept
  // unclamped so a filter change that narrows the range and then widens it
  // again brings the reader back to where they were.
  //
  // Read during the first render, ahead of every effect: `applyUrlParams` below
  // and the provider's strip-on-mount both clear the whole query string. Safe
  // to differ from the server's null because nothing that shows the day renders
  // until the data has loaded, which is after hydration.
  const [chosenDay, setChosenDay] = useState<DateString | null>(readDayFromUrl);

  // With the filter params gone the provider's own strip-on-mount (which runs
  // after this, parent effects following child ones) has nothing to do, so a
  // day written back to the URL survives it.
  useEffect(() => {
    applyUrlParams();
    getData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [savedScroll] = useState(() =>
    typeof window === "undefined" ? null : takeSavedScroll(),
  );

  const [isFilterOverlayOpen, setIsFilterOverlayOpen] = useState(false);
  const [filterTextHeight, setFilterTextHeight] = useState(0);

  // One pass of the real filter pipeline over the whole date range; the day is
  // then sliced out of that. Stepping between days costs no filter pass.
  const rangeMovies = useMemo(
    () =>
      isEmpty ? [] : Object.values(filterManager.apply(movies, filterState)),
    [isEmpty, movies, filterState],
  );

  const range = useMemo(
    () =>
      getPlannerRange(
        rangeMovies,
        filterState.dateRange ?? { start: null, end: null },
        timestampToLondonDateString(getLondonMidnightTimestamp()),
      ),
    [rangeMovies, filterState.dateRange],
  );

  const day = range ? clampToRange(chosenDay, range) : null;

  const rows = useMemo(
    () => (day ? getPlannerRows(rangeMovies, day) : []),
    [rangeMovies, day],
  );

  const goToDay = useCallback((next: DateString) => {
    setChosenDay(next);
    writeDayToUrl(next);
    // The list below is replaced wholesale, so staying scrolled halfway down
    // would land the reader mid-way through a different day.
    window.scrollTo({ top: 0 });
  }, []);

  const genreNames = useCallback(
    (ids: string[] | undefined) =>
      (ids ?? [])
        .map((id) => metaData?.genres[id]?.name)
        .filter((name): name is string => !!name && name !== "Uncategorised"),
    [metaData],
  );

  const renderBody = () => {
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

    if (!hasAttemptedLoad || isLoading) return null;

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

    // Nothing on any day of the range under the current filters.
    if (!range || !day) {
      return (
        <EmptyState
          variant="fullscreen"
          icon={{
            src: "/images/icons/neon-clapper.svg",
            width: 120,
            height: 120,
          }}
          title="No events found"
          message="Nothing matches your filters on any day in the range."
          actions={
            <div className={styles.emptyActions}>
              {/* Usually one filter needs loosening, not all of them. */}
              <Button onClick={() => setIsFilterOverlayOpen(true)}>
                Adjust filters
              </Button>
              {hasActiveFilters && (
                <Button variant="secondary" onClick={resetFilters}>
                  Reset filters
                </Button>
              )}
            </div>
          }
        />
      );
    }

    if (rows.length === 0) {
      const next = findNearestShowingDay(rangeMovies, day, "next", range);
      const previous = findNearestShowingDay(
        rangeMovies,
        day,
        "previous",
        range,
      );
      return (
        <EmptyState
          icon={{
            src: "/images/icons/neon-clapper.svg",
            width: 120,
            height: 120,
          }}
          title="Nothing on this day"
          message="Nothing matches your filters on this day, but there is on others in the range."
          actions={
            <div className={styles.emptyActions}>
              {previous && (
                <Button variant="secondary" onClick={() => goToDay(previous)}>
                  Back to{" "}
                  {formatDateLong(dateStringToLondonTimestamp(previous))}
                </Button>
              )}
              {next && (
                <Button onClick={() => goToDay(next)}>
                  Jump to {formatDateLong(dateStringToLondonTimestamp(next))}
                </Button>
              )}
            </div>
          }
        />
      );
    }

    const signature = getRowsSignature(rows);
    const restoreFrom =
      savedScroll?.day === day && savedScroll.signature === signature
        ? savedScroll.snapshot
        : undefined;

    // Any link out to a listing page — a film's summary or "and X more" —
    // snapshots the list first. Capture phase, so it runs before navigation.
    const saveScroll = (event: React.MouseEvent) => {
      const link = (event.target as HTMLElement).closest("a");
      if (!link?.getAttribute("href")?.startsWith("/movies/")) return;
      virtuosoRef.current?.getState((snapshot) => {
        try {
          sessionStorage.setItem(
            SCROLL_STORAGE_KEY,
            JSON.stringify({ day, signature, snapshot } satisfies SavedScroll),
          );
        } catch {
          // Ignore - UX optimisation only
        }
      });
    };

    return (
      <div onClickCapture={saveScroll}>
        <Virtuoso
          ref={virtuosoRef}
          restoreStateFrom={restoreFrom}
          useWindowScroll
          increaseViewportBy={600}
          data={rows}
          computeItemKey={(_, row) => row.movie.id}
          className={styles.rows}
          itemContent={(_, row) => (
            <PlannerRow
              movie={row.movie}
              href={getMovieUrl(row.movie)}
              performances={row.performances}
              venues={metaData?.venues ?? {}}
              genres={genreNames(row.movie.genres)}
              hydrateUrl={hydrateUrl}
            />
          )}
        />
      </div>
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
      <div className={styles.content}>
        <div className={styles.intro}>
          <h1 className={styles.title}>Planner</h1>
          <p className={styles.subtitle}>
            Everything showing on one day, film by film, with each film&rsquo;s
            times side by side.
          </p>
        </div>
        {hasAttemptedLoad && !isLoading && !error && range && day && (
          <div className={styles.controls}>
            <DayStepper
              day={dateStringToLondonTimestamp(day)}
              hasPrevious={day > range.first}
              hasNext={day < range.last}
              onPrevious={() => goToDay(shiftDate(day, -1))}
              onNext={() => goToDay(shiftDate(day, 1))}
            />
            <p className={styles.count}>
              {rows.length.toLocaleString("en-GB")}{" "}
              {rows.length === 1 ? "film" : "films"} showing
            </p>
          </div>
        )}
        {renderBody()}
        {isLoading && (
          <LoadingIndicator
            message="Loading movies..."
            className={styles.loading}
          />
        )}
      </div>
    </>
  );
}
