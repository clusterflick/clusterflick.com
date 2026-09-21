"use client";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useDeferredValue,
  useState,
} from "react";
import clsx from "clsx";
import dynamic from "next/dynamic";
import {
  Virtuoso,
  type StateSnapshot,
  type VirtuosoHandle,
} from "react-virtuoso";
import { useCinemaData } from "@/state/cinema-data-context";
import { useFilterConfig } from "@/state/filter-config-context";
import { useMediaQuery } from "@/hooks/use-media-query";
import { filterManager } from "@/lib/filters";
import Button from "@/components/button";
import Chip from "@/components/chip";
import DayStepper from "@/components/day-stepper";
import EmptyState from "@/components/empty-state";
import LoadingIndicator from "@/components/loading-indicator";
import MainHeader from "@/components/main-header";
import Spinner from "@/components/spinner";
import StickyBar from "@/components/sticky-bar";
import PlannerRow from "@/components/planner-row";
import PlannerHourRow, { PlannerHourGap } from "@/components/planner-hour-row";
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
  formatHour,
  getLastShowingDay,
  getPlannerHours,
  getPlannerRange,
  getPlannerRows,
  getPlannerWeek,
  PLANNER_WEEK_LENGTH,
  getShowingDays,
  isDateString,
  shiftDate,
  type DateString,
  type PlannerHourSection,
  type PlannerRowData,
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

/**
 * Group by film (the default) or by the hour showings start — two views of the
 * same day. View state like the day, so it rides in the URL beside it.
 */
type PlannerView = "film" | "time";
const VIEW_PARAM = "view";

function readDayFromUrl(): DateString | null {
  if (typeof window === "undefined") return null;
  const day = new URLSearchParams(window.location.search).get(DAY_PARAM);
  return isDateString(day) ? day : null;
}

function readViewFromUrl(): PlannerView {
  if (typeof window === "undefined") return "film";
  const view = new URLSearchParams(window.location.search).get(VIEW_PARAM);
  return view === "time" ? "time" : "film";
}

/** Only what departs from the defaults, so a first visit keeps a clean URL. */
function writeUrl(day: DateString | null, view: PlannerView) {
  const params = new URLSearchParams();
  if (day) params.set(DAY_PARAM, day);
  if (view !== "film") params.set(VIEW_PARAM, view);
  const query = params.toString();
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${query ? `?${query}` : ""}`,
  );
}

/** One entry in the virtualised list, whichever way the day is grouped. */
type PlannerListItem =
  | { kind: "film"; key: string; row: PlannerRowData }
  | { kind: "hour" | "gap"; key: string; section: PlannerHourSection };

/**
 * Rows vary in height, so unlike the catalogue there is no reserving the page
 * height up front for the browser's own scroll restoration to land in. Instead
 * Virtuoso's snapshot — measured row sizes plus scroll position — is taken on
 * the way out to a listing page and handed back on return.
 */
const SCROLL_STORAGE_KEY = "clusterflick-planner-scroll";

interface SavedScroll {
  day: DateString;
  /** View, length and first and last keys: the same list, not a re-filtered one. */
  signature: string;
  snapshot: StateSnapshot;
}

function getListSignature(view: PlannerView, items: { key: string }[]): string {
  return `${view}:${items.length}:${items[0]?.key}:${items[items.length - 1]?.key}`;
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
  const [view, setView] = useState<PlannerView>(readViewFromUrl);
  // The chips follow `view` at once; the list follows this deferred copy,
  // which React renders at low priority while the old list stays up. The by-
  // time list is a lot of DOM, and without this the chip didn't highlight
  // until it had all been built.
  const listView = useDeferredValue(view);
  const isSwitchingView = listView !== view;

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

  // As many weeks as fit beside the summary: six on the widest screens, four
  // or two on smaller desktops, one where the strip must fit a phone.
  const fitsTwoWeeks = useMediaQuery("(min-width: 1024px)");
  const fitsFourWeeks = useMediaQuery("(min-width: 1440px)");
  const fitsSixWeeks = useMediaQuery("(min-width: 1800px)");
  const stripDays = fitsSixWeeks
    ? 42
    : fitsFourWeeks
      ? 28
      : fitsTwoWeeks
        ? 14
        : PLANNER_WEEK_LENGTH;
  const week = useMemo(
    () => (day && range ? getPlannerWeek(day, range, stripDays) : []),
    [day, range, stripDays],
  );

  // Only computed in the view that shows it.
  const hours = useMemo(
    () => (day && listView === "time" ? getPlannerHours(rangeMovies, day) : []),
    [rangeMovies, day, listView],
  );

  const listItems = useMemo<PlannerListItem[]>(
    () =>
      listView === "film"
        ? rows.map((row) => ({ kind: "film", key: row.movie.id, row }))
        : hours.map((section) => ({
            kind: section.kind,
            key: `${section.kind}-${section.kind === "hour" ? section.hour : section.from}`,
            section,
          })),
    [listView, rows, hours],
  );

  const showingCount = useMemo(
    () => rows.reduce((total, row) => total + row.performances.length, 0),
    [rows],
  );

  // Either change replaces the list wholesale, so staying scrolled halfway
  // down would land the reader mid-way through something else.
  const goToDay = useCallback(
    (next: DateString) => {
      setChosenDay(next);
      writeUrl(next, view);
      window.scrollTo({ top: 0 });
    },
    [view],
  );

  const changeView = (next: PlannerView) => {
    setView(next);
    writeUrl(chosenDay, next);
    window.scrollTo({ top: 0 });
  };

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
          className={styles.emptyDay}
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

    const renderItem = (item: PlannerListItem) => {
      if (item.kind === "film") {
        const { movie, performances } = item.row;
        // The strip follows the filters, as the rows do; last chance reads
        // the unfiltered film, so it means the last day anywhere — not just
        // at the venues or in the date range picked.
        const lastDay = getLastShowingDay(movies[movie.id] ?? movie);
        return (
          <PlannerRow
            movie={movie}
            href={getMovieUrl(movie)}
            performances={performances}
            venues={metaData?.venues ?? {}}
            genres={genreNames(movie.genres)}
            hydrateUrl={hydrateUrl}
            // A one-day range has nothing to compare the day against.
            week={
              week.length > 1
                ? {
                    days: week,
                    showing: getShowingDays(movie, week),
                    selected: day,
                    continuesBefore: week[0] > range.first,
                    continuesAfter: week[week.length - 1] < range.last,
                    moreBefore:
                      findNearestShowingDay(
                        [movie],
                        week[0],
                        "previous",
                        range,
                      ) !== null,
                    moreAfter:
                      findNearestShowingDay(
                        [movie],
                        week[week.length - 1],
                        "next",
                        range,
                      ) !== null,
                    onSelect: goToDay,
                  }
                : undefined
            }
            lastChance={lastDay === day}
          />
        );
      }
      const { section } = item;
      if (section.kind === "gap") {
        return (
          <PlannerHourGap
            from={formatHour(section.from)}
            until={formatHour(section.to + 1)}
          />
        );
      }
      return (
        <PlannerHourRow
          label={formatHour(section.hour)}
          items={section.items.map(({ movie, performance }) => ({
            movie,
            performance,
            film: {
              title: movie.title,
              year: movie.year,
              posterPath: movie.posterPath,
              includedMovies: movie.includedMovies,
              href: getMovieUrl(movie),
            },
          }))}
          venues={metaData?.venues ?? {}}
          hydrateUrl={hydrateUrl}
        />
      );
    };

    // Not virtualised: a day has at most ~25 hour rows and dividers, and each
    // row is heavy (up to PLANNER_HOUR_LIMIT cards with posters), so mounting
    // and unmounting them as they crossed Virtuoso's buffer cost more while
    // scrolling than rendering the lot once. Rows staying mounted also keeps
    // opened groups and "Show more" steps, and lets the browser's own scroll
    // restoration work on return, as on the catalogue.
    if (listView === "time") {
      return (
        <div>
          {listItems.map((item) => (
            <Fragment key={item.key}>{renderItem(item)}</Fragment>
          ))}
        </div>
      );
    }

    const signature = getListSignature(listView, listItems);
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
          data={listItems}
          computeItemKey={(_, item) => item.key}
          itemContent={(_, item) => renderItem(item)}
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
      {/* Named for screen readers; the header nav already marks the page. */}
      <h1 className={styles.srOnly}>Planner</h1>
      {hasAttemptedLoad && !isLoading && !error && range && day && (
        // Sticky, as the catalogue's search row is: the day in view stays
        // visible down a long list, and stepping works from anywhere.
        <StickyBar className={styles.controlsBar}>
          {/* View switch, day, filters — the stepper centred between them
              as the catalogue's search box is between its buttons. */}
          <div className={styles.controlsInner}>
            <div
              className={clsx(styles.viewToggle, styles.controlsStart)}
              role="radiogroup"
              aria-label="Group by"
              aria-busy={isSwitchingView}
            >
              <Chip
                type="radio"
                name="planner-view"
                value="film"
                label="By film"
                checked={view === "film"}
                onChange={() => changeView("film")}
              />
              <Chip
                type="radio"
                name="planner-view"
                value="time"
                label="By time"
                checked={view === "time"}
                onChange={() => changeView("time")}
              />
              {isSwitchingView && (
                <span className={styles.viewSpinner}>
                  <Spinner size={16} />
                </span>
              )}
            </div>
            <DayStepper
              className={styles.stepper}
              day={dateStringToLondonTimestamp(day)}
              hasPrevious={day > range.first}
              hasNext={day < range.last}
              onPrevious={() => goToDay(shiftDate(day, -1))}
              onNext={() => goToDay(shiftDate(day, 1))}
              detail={
                listView === "time"
                  ? `${showingCount.toLocaleString("en-GB")} ${
                      showingCount === 1 ? "showing" : "showings"
                    }`
                  : `${rows.length.toLocaleString("en-GB")} ${
                      rows.length === 1 ? "film" : "films"
                    }`
              }
            />
            <Button
              variant="secondary"
              size="sm"
              className={styles.controlsEnd}
              onClick={() => setIsFilterOverlayOpen(true)}
            >
              More Filters
            </Button>
          </div>
        </StickyBar>
      )}
      <div className={styles.content}>
        {/* The outgoing list stays up, dimmed, while the next one renders. */}
        <div className={clsx(isSwitchingView && styles.switching)}>
          {renderBody()}
        </div>
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
