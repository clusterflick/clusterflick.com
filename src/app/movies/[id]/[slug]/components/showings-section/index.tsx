import {
  Fragment,
  forwardRef,
  useCallback,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
} from "react";
import clsx from "clsx";
import { GroupedVirtuoso } from "react-virtuoso";
import { MoviePerformance, Showing, Venue } from "@/types";
import { useCinemaData } from "@/state/cinema-data-context";
import { titlesDiffer } from "@/utils/title-differs";
import { getAccessibilityLabel } from "@/utils/accessibility-labels";
import { FilterDescription } from "@/lib/filters";
import {
  getDaysFromNow,
  formatDaysFromNow,
  formatShowingTime,
  isInPast,
} from "@/utils/format-date";
import Button, { ButtonAnchor } from "@/components/button";
import LoadingIndicator from "@/components/loading-indicator";
import ContentSection from "@/components/content-section";
import EmptyState from "@/components/empty-state";
import Tag from "@/components/tag";
import styles from "./showings-section.module.css";

// Card grid sizing — kept in sync with .performancesRow gap in the CSS module.
// Mirrors the previous `repeat(auto-fill, minmax(280px, 1fr))` layout so the
// virtualised chunked rows look identical to the old single grid.
const CARD_MIN_WIDTH = 280;
const CARD_GAP = 16;
// Offset so sticky day headers rest below the fixed 63px PageHeader.
const STICKY_TOP = 63;

function getColumns(width: number) {
  if (width <= 0) return 1;
  return Math.max(
    1,
    Math.floor((width + CARD_GAP) / (CARD_MIN_WIDTH + CARD_GAP)),
  );
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

interface GroupMeta {
  date: string;
  daysFromNow: number | null;
  hasFinished: boolean;
  pastCount: number;
}

type Row =
  | { kind: "finished-banner"; groupIndex: number; lastInGroup: boolean }
  | { kind: "cards"; performances: MoviePerformance[]; lastInGroup: boolean };

// Push virtuoso's sticky day headers below the fixed 63px PageHeader. Virtuoso
// pins the active header via a `TopItemList` wrapper (sticky at top:0) and also
// makes the in-flow group elements sticky; both must be offset so the header
// never slides under the page header.
const StickyGroup = forwardRef<HTMLDivElement, ComponentProps<"div">>(
  function StickyGroup(props, ref) {
    return (
      <div
        {...props}
        ref={ref}
        style={{ ...props.style, top: STICKY_TOP, zIndex: 10 }}
      />
    );
  },
);

const StickyTopItemList = forwardRef<HTMLDivElement, ComponentProps<"div">>(
  function StickyTopItemList(props, ref) {
    return (
      <div {...props} ref={ref} style={{ ...props.style, top: STICKY_TOP }} />
    );
  },
);

function renderPerformanceCard(
  performance: MoviePerformance,
  index: number,
  showings: Record<string, Showing>,
  venues: Record<string, Venue>,
  movieTitle: string,
  hydrateUrl: (url: string) => string,
) {
  const showing = showings[performance.showingId];
  const venue = venues[showing?.venueId];
  const isPast = isInPast(performance.time);
  const isSoldOut = performance.status?.soldOut;

  return (
    <div
      key={`${performance.showingId}-${index}`}
      className={clsx(
        styles.performanceCard,
        isPast && styles.past,
        !isPast && isSoldOut && styles.soldOut,
      )}
      data-testid="performance-card"
    >
      {/* Card overlay link - covers the whole card */}
      <a
        href={showing ? hydrateUrl(showing.url) : undefined}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.cardLink}
        aria-label={`View ${venue?.name || "venue"} listing`}
      />
      <div className={styles.performanceTime}>
        {formatShowingTime(performance.time)}
      </div>
      {venue && <div className={styles.performanceVenue}>{venue.name}</div>}
      {showing?.title && titlesDiffer(movieTitle, showing.title) && (
        <div className={styles.showingTitle}>{showing.title}</div>
      )}
      {performance.screen && (
        <div className={styles.performanceScreen}>
          {performance.screen.length > 3
            ? performance.screen
            : "Screen " + performance.screen}
        </div>
      )}
      {performance.accessibility && (
        <div className={styles.performanceAccessibility}>
          {Object.entries(performance.accessibility)
            .filter(([, enabled]) => enabled)
            .map(([feature]) => (
              <Tag key={feature} color="blue" size="sm">
                {getAccessibilityLabel(feature)}
              </Tag>
            ))}
        </div>
      )}
      {performance.notes && (
        <div className={styles.performanceNotes}>
          {performance.notes.split("\n").map((note, noteIndex) => (
            <Fragment key={noteIndex}>
              {note}
              <br />
            </Fragment>
          ))}
        </div>
      )}
      {isPast && <div className={styles.finishedBadge}>Finished</div>}
      {isSoldOut && !isPast && (
        <div className={styles.soldOutBadge}>Sold Out</div>
      )}
      {!isPast && !isSoldOut && (
        <ButtonAnchor
          href={hydrateUrl(performance.bookingUrl)}
          target="_blank"
          rel="noopener noreferrer"
          size="sm"
          className={styles.bookingButton}
        >
          Book
        </ButtonAnchor>
      )}
    </div>
  );
}

interface ShowingsSectionProps {
  isLoading: boolean;
  performancesByDate: Record<string, MoviePerformance[]>;
  showings: Record<string, Showing>;
  venues: Record<string, Venue>;
  movieTitle: string;
  // Filter-related props
  filterDescription: FilterDescription | null;
  showingAll: boolean;
  onShowAllToggle: () => void;
  unfilteredPerformanceCount: number;
  filteredPerformanceCount: number;
}

export default function ShowingsSection({
  isLoading,
  performancesByDate,
  showings,
  venues,
  movieTitle,
  filterDescription,
  showingAll,
  onShowAllToggle,
  unfilteredPerformanceCount,
  filteredPerformanceCount,
}: ShowingsSectionProps) {
  const { hydrateUrl, error, retry } = useCinemaData();
  const hasPerformances = Object.keys(performancesByDate).length > 0;
  const [showFinished, setShowFinished] = useState(false);

  // Derive the responsive column count (N) from the list container width,
  // replicating the old CSS auto-fill grid. When N changes the model re-chunks
  // and virtuoso re-measures.
  //
  // We bind via a callback ref (not useEffect) so the observer attaches exactly
  // when the container mounts, and measure synchronously with
  // getBoundingClientRect on mount rather than waiting for the async first
  // ResizeObserver callback. On client-side navigation (e.g. home -> movie via
  // #show-all) the container can mount out of step with an effect keyed on
  // loading/filter state, which previously left columns stuck at the initial 1.
  const [columns, setColumns] = useState(1);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const measureColumns = useCallback((width: number) => {
    if (width > 0) setColumns(getColumns(width));
  }, []);
  const containerRef = useCallback(
    (node: HTMLDivElement | null) => {
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      if (!node) return;
      measureColumns(node.getBoundingClientRect().width);
      const observer = new ResizeObserver((entries) => {
        measureColumns(entries[0]?.contentRect.width ?? 0);
      });
      observer.observe(node);
      resizeObserverRef.current = observer;
    },
    [measureColumns],
  );

  // Flatten the day-grouped performances into virtuoso's grouped model: one
  // GroupMeta + groupCount per day, and a flat list of rows where each row is
  // either the per-day "finished" banner or a chunk of up to N cards.
  const { groups, rows, groupCounts } = useMemo(() => {
    const groups: GroupMeta[] = [];
    const rows: Row[] = [];
    const groupCounts: number[] = [];

    Object.entries(performancesByDate).forEach(([date, datePerformances]) => {
      const daysFromNow = getDaysFromNow(datePerformances[0].time);
      const pastPerformances = datePerformances.filter((p) => isInPast(p.time));
      const upcomingPerformances = datePerformances.filter(
        (p) => !isInPast(p.time),
      );
      const hasFinished = pastPerformances.length > 0;
      const visiblePerformances = showFinished
        ? datePerformances
        : upcomingPerformances;

      const groupIndex = groups.length;
      groups.push({
        date,
        daysFromNow,
        hasFinished,
        pastCount: pastPerformances.length,
      });

      let count = 0;
      if (hasFinished) {
        rows.push({ kind: "finished-banner", groupIndex, lastInGroup: false });
        count += 1;
      }
      for (const performanceChunk of chunk(visiblePerformances, columns)) {
        rows.push({
          kind: "cards",
          performances: performanceChunk,
          lastInGroup: false,
        });
        count += 1;
      }
      // A finished-only day with hidden finished still shows its banner, so
      // every group has at least one row. Tag the last row so it can carry the
      // inter-day bottom spacing (in scroll flow, below the sticky header).
      rows[rows.length - 1].lastInGroup = true;
      groupCounts.push(count);
    });

    return { groups, rows, groupCounts };
  }, [performancesByDate, showFinished, columns]);

  // Show filter info banner when filters are reducing results (including defaults)
  const filtersReducedResults =
    unfilteredPerformanceCount > 0 &&
    filteredPerformanceCount < unfilteredPerformanceCount;
  const showFilterBanner = !isLoading && filtersReducedResults;

  return (
    <ContentSection
      title="Showings"
      icon={{
        src: "/images/icons/neon-ticket.svg",
        width: 58,
        height: 33,
      }}
    >
      {error ? (
        <EmptyState
          icon={{
            src: "/images/icons/neon-ticket-ripped.svg",
            width: 120,
            height: 80,
          }}
          message="Failed to load showings"
          hint={error.message}
          actions={<Button onClick={retry}>Try Again</Button>}
        />
      ) : isLoading ? (
        <LoadingIndicator message="Loading showings..." />
      ) : (
        <>
          {showFilterBanner && filterDescription && (
            <div className={styles.filterBanner}>
              <div className={styles.filterInfo}>
                {showingAll ? (
                  <span className={styles.filterLabel}>
                    Showing all{" "}
                    {unfilteredPerformanceCount.toLocaleString("en-GB")} showing
                    {unfilteredPerformanceCount === 1 ? "" : "s"}
                  </span>
                ) : (
                  <>
                    <span className={styles.filterLabel}>
                      Filtered to{" "}
                      <span className={styles.filterHighlight}>
                        {filterDescription.events}
                      </span>
                      {" • "}
                      <span className={styles.filterHighlight}>
                        {filterDescription.venues}
                      </span>
                      {" • "}
                      <span className={styles.filterHighlight}>
                        {filterDescription.dates}
                      </span>
                    </span>
                    {filteredPerformanceCount > 0 ? (
                      <span className={styles.filterCount}>
                        Showing{" "}
                        {filteredPerformanceCount.toLocaleString("en-GB")} of{" "}
                        {unfilteredPerformanceCount.toLocaleString("en-GB")}{" "}
                        showing{unfilteredPerformanceCount === 1 ? "" : "s"}
                      </span>
                    ) : (
                      <span className={styles.filterCount}>
                        Hiding all{" "}
                        {unfilteredPerformanceCount.toLocaleString("en-GB")}{" "}
                        showing{unfilteredPerformanceCount === 1 ? "" : "s"}
                      </span>
                    )}
                  </>
                )}
              </div>
              <Button variant="secondary" size="sm" onClick={onShowAllToggle}>
                {showingAll ? "Apply filters" : "Show all"}
              </Button>
            </div>
          )}
          {!hasPerformances ? (
            <EmptyState
              icon={{
                src: "/images/icons/neon-ticket-ripped.svg",
                width: 120,
                height: 80,
              }}
              message={
                unfilteredPerformanceCount > 0
                  ? "No showings match your current filters"
                  : "No showings currently available"
              }
              hint={
                unfilteredPerformanceCount > 0
                  ? "Try adjusting your filters to see more results"
                  : undefined
              }
            />
          ) : (
            <div ref={containerRef}>
              <GroupedVirtuoso
                useWindowScroll
                increaseViewportBy={600}
                groupCounts={groupCounts}
                components={{
                  Group: StickyGroup,
                  TopItemList: StickyTopItemList,
                }}
                groupContent={(index) => {
                  const group = groups[index];
                  return (
                    <h3 className={styles.dateHeader}>
                      {group.date}
                      {group.daysFromNow !== null && (
                        <span className={styles.daysFromNow}>
                          {formatDaysFromNow(group.daysFromNow)}
                        </span>
                      )}
                    </h3>
                  );
                }}
                itemContent={(index) => {
                  const row = rows[index];
                  if (row.kind === "finished-banner") {
                    const group = groups[row.groupIndex];
                    return (
                      <div
                        className={clsx(
                          styles.bannerRow,
                          row.lastInGroup && styles.lastInGroup,
                        )}
                      >
                        <div className={styles.finishedBanner}>
                          <span className={styles.finishedLabel}>
                            {showFinished ? (
                              <>
                                Showing{" "}
                                <span className={styles.finishedCount}>
                                  {group.pastCount.toLocaleString("en-GB")}
                                </span>{" "}
                                {group.pastCount === 1 ? "showing" : "showings"}{" "}
                                which {group.pastCount === 1 ? "has" : "have"}{" "}
                                already finished
                              </>
                            ) : (
                              <>
                                Hiding{" "}
                                <span className={styles.finishedCount}>
                                  {group.pastCount.toLocaleString("en-GB")}
                                </span>{" "}
                                {group.pastCount === 1 ? "showing" : "showings"}{" "}
                                which {group.pastCount === 1 ? "has" : "have"}{" "}
                                already finished
                              </>
                            )}
                          </span>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setShowFinished((v) => !v)}
                          >
                            {showFinished ? "Hide" : "Show"}
                          </Button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      className={clsx(
                        styles.performancesRow,
                        row.lastInGroup && styles.lastInGroup,
                      )}
                      style={{ "--cols": columns } as CSSProperties}
                    >
                      {row.performances.map((performance, cardIndex) =>
                        renderPerformanceCard(
                          performance,
                          cardIndex,
                          showings,
                          venues,
                          movieTitle,
                          hydrateUrl,
                        ),
                      )}
                    </div>
                  );
                }}
              />
            </div>
          )}
        </>
      )}
    </ContentSection>
  );
}
