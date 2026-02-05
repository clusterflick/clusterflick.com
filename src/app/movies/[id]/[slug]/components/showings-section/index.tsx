import { Fragment } from "react";
import clsx from "clsx";
import { MoviePerformance, Showing, Venue } from "@/types";
import { useCinemaData } from "@/state/cinema-data-context";
import { titlesDiffer } from "@/utils/title-differs";
import { getAccessibilityLabel } from "@/utils/accessibility-labels";
import { FilterDescription } from "@/lib/filters";
import {
  getDaysFromNow,
  formatDaysFromNow,
  isInPast,
} from "@/utils/format-date";
import Button from "@/components/button";
import LoadingIndicator from "@/components/loading-indicator";
import ContentSection from "@/components/content-section";
import EmptyState from "@/components/empty-state";
import Tag from "@/components/tag";
import styles from "./showings-section.module.css";

interface ShowingsSectionProps {
  isLoading: boolean;
  performancesByDate: Record<string, MoviePerformance[]>;
  showings: Record<string, Showing>;
  venues: Record<string, Venue>;
  movieTitle: string;
  // Filter-related props
  filterDescription: FilterDescription | null;
  hasActiveFilters: boolean;
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
  hasActiveFilters,
  showingAll,
  onShowAllToggle,
  unfilteredPerformanceCount,
  filteredPerformanceCount,
}: ShowingsSectionProps) {
  const { hydrateUrl, error, retry } = useCinemaData();
  const hasPerformances = Object.keys(performancesByDate).length > 0;

  // Show filter info banner when filters are reducing results
  const showFilterBanner =
    !isLoading &&
    hasActiveFilters &&
    unfilteredPerformanceCount > 0 &&
    (filteredPerformanceCount < unfilteredPerformanceCount || showingAll);

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
                    Showing all {unfilteredPerformanceCount} showings
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
                    {filteredPerformanceCount > 0 && (
                      <span className={styles.filterCount}>
                        ({filteredPerformanceCount} of{" "}
                        {unfilteredPerformanceCount} showings)
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
                hasActiveFilters && unfilteredPerformanceCount > 0
                  ? "No showings match your current filters"
                  : "No showings currently available"
              }
              hint={
                hasActiveFilters && unfilteredPerformanceCount > 0
                  ? "Try adjusting your filters to see more results"
                  : undefined
              }
            />
          ) : (
            <div>
              {Object.entries(performancesByDate).map(
                ([date, datePerformances]) => {
                  const daysFromNow = getDaysFromNow(datePerformances[0].time);
                  return (
                    <Fragment key={date}>
                      <h3 className={styles.dateHeader}>
                        {date}
                        {daysFromNow !== null && (
                          <span className={styles.daysFromNow}>
                            {formatDaysFromNow(daysFromNow)}
                          </span>
                        )}
                      </h3>
                      <div className={styles.performancesList}>
                        {datePerformances.map((performance, index) => {
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
                            >
                              {/* Card overlay link - covers the whole card */}
                              <a
                                href={
                                  showing ? hydrateUrl(showing.url) : undefined
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.cardLink}
                                aria-label={`View ${venue?.name || "venue"} listing`}
                              />
                              <div className={styles.performanceTime}>
                                {new Date(performance.time).toLocaleTimeString(
                                  "en-GB",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    timeZone: "Europe/London",
                                  },
                                )}
                              </div>
                              {venue && (
                                <div className={styles.performanceVenue}>
                                  {venue.name}
                                </div>
                              )}
                              {showing?.title &&
                                titlesDiffer(movieTitle, showing.title) && (
                                  <div className={styles.showingTitle}>
                                    {showing.title}
                                  </div>
                                )}
                              {performance.screen && (
                                <div className={styles.performanceScreen}>
                                  {performance.screen.length > 3
                                    ? performance.screen
                                    : "Screen " + performance.screen}
                                </div>
                              )}
                              {performance.accessibility && (
                                <div
                                  className={styles.performanceAccessibility}
                                >
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
                                  {performance.notes
                                    .split("\n")
                                    .map((note, noteIndex) => (
                                      <Fragment key={noteIndex}>
                                        {note}
                                        <br />
                                      </Fragment>
                                    ))}
                                </div>
                              )}
                              {isPast && (
                                <div className={styles.finishedBadge}>
                                  Finished
                                </div>
                              )}
                              {isSoldOut && !isPast && (
                                <div className={styles.soldOutBadge}>
                                  Sold Out
                                </div>
                              )}
                              {!isPast && !isSoldOut && (
                                <a
                                  href={hydrateUrl(performance.bookingUrl)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={styles.bookingButton}
                                >
                                  Book
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </Fragment>
                  );
                },
              )}
            </div>
          )}
        </>
      )}
    </ContentSection>
  );
}
