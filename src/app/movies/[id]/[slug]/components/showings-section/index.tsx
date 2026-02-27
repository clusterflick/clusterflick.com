import { Fragment, useState } from "react";
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
import Button, { ButtonAnchor } from "@/components/button";
import LoadingIndicator from "@/components/loading-indicator";
import ContentSection from "@/components/content-section";
import EmptyState from "@/components/empty-state";
import Tag from "@/components/tag";
import styles from "./showings-section.module.css";

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
        {new Date(performance.time).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Europe/London",
        })}
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

  // Show filter info banner when filters are reducing results (including defaults)
  const filtersReducedResults =
    unfilteredPerformanceCount > 0 &&
    filteredPerformanceCount < unfilteredPerformanceCount;
  const showFilterBanner = !isLoading && (filtersReducedResults || showingAll);

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
                    {unfilteredPerformanceCount.toLocaleString("en-GB")}{" "}
                    showings
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
                        Showing{" "}
                        {filteredPerformanceCount.toLocaleString("en-GB")} of{" "}
                        {unfilteredPerformanceCount.toLocaleString("en-GB")}{" "}
                        showings
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
            <div>
              {Object.entries(performancesByDate).map(
                ([date, datePerformances]) => {
                  const daysFromNow = getDaysFromNow(datePerformances[0].time);
                  const pastPerformances = datePerformances.filter((p) =>
                    isInPast(p.time),
                  );
                  const upcomingPerformances = datePerformances.filter(
                    (p) => !isInPast(p.time),
                  );
                  const hasFinished = pastPerformances.length > 0;
                  const hasUpcoming = upcomingPerformances.length > 0;
                  const visiblePerformances = showFinished
                    ? datePerformances
                    : upcomingPerformances;

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
                      {hasFinished && (
                        <div className={styles.finishedBanner}>
                          <span className={styles.finishedLabel}>
                            {showFinished ? (
                              <>
                                Showing{" "}
                                <span className={styles.finishedCount}>
                                  {pastPerformances.length.toLocaleString(
                                    "en-GB",
                                  )}
                                </span>{" "}
                                {pastPerformances.length === 1
                                  ? "showing"
                                  : "showings"}{" "}
                                which{" "}
                                {pastPerformances.length === 1 ? "has" : "have"}{" "}
                                already finished
                              </>
                            ) : (
                              <>
                                Hiding{" "}
                                <span className={styles.finishedCount}>
                                  {pastPerformances.length.toLocaleString(
                                    "en-GB",
                                  )}
                                </span>{" "}
                                {pastPerformances.length === 1
                                  ? "showing"
                                  : "showings"}{" "}
                                which{" "}
                                {pastPerformances.length === 1 ? "has" : "have"}{" "}
                                already finished
                              </>
                            )}
                          </span>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setShowFinished(!showFinished)}
                          >
                            {showFinished ? "Hide" : "Show"}
                          </Button>
                        </div>
                      )}
                      {visiblePerformances.length > 0 && (
                        <div className={styles.performancesList}>
                          {visiblePerformances.map((performance, index) =>
                            renderPerformanceCard(
                              performance,
                              index,
                              showings,
                              venues,
                              movieTitle,
                              hydrateUrl,
                            ),
                          )}
                        </div>
                      )}
                      {!hasUpcoming && !hasFinished && (
                        <div className={styles.performancesList} />
                      )}
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
