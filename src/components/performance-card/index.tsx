import { Fragment, type ReactNode } from "react";
import clsx from "clsx";
import {
  FormatDimension,
  FormatSourceDefault,
  type MoviePerformance,
} from "@/types";
import { getAccessibilityLabel } from "@/utils/accessibility-labels";
import { getFormatLabels } from "@/utils/format-labels";
import { formatShowingTime } from "@/utils/format-date";
import Tag from "@/components/tag";
import { ButtonAnchor } from "@/components/button";
import styles from "./performance-card.module.css";

/**
 * - `default` fills a grid cell (the listing page's 280px-minimum columns).
 * - `compact` is a fixed narrow card for a horizontal strip (the planner),
 *   where the default width would make a row thousands of pixels wide.
 */
export type PerformanceCardSize = "default" | "compact";

/** A performance that can no longer be booked, styled down to match. */
export type PerformanceCardStatus = "past" | "soldOut";

const sizeStyles: Record<PerformanceCardSize, string | undefined> = {
  default: undefined,
  compact: styles.compact,
};

const statusStyles: Record<PerformanceCardStatus, string> = {
  past: styles.past,
  soldOut: styles.soldOut,
};

interface PerformanceCardProps {
  time: number;
  venueName?: string;
  /** Venue's own title for the showing, when it differs from the movie title. */
  showingTitle?: string;
  screen?: string;
  accessibility?: MoviePerformance["accessibility"];
  format?: MoviePerformance["format"];
  notes?: string;
  size?: PerformanceCardSize;
  status?: PerformanceCardStatus;
  className?: string;
  /**
   * Interactive overlays rendered first inside the card — normally
   * `PerformanceCardActions`. Omitted by the static SEO render, which is
   * deliberately non-interactive.
   */
  children?: ReactNode;
}

/**
 * Presentational showing card shared by the listing page's interactive list,
 * its SSR-only static list and the planner, so all of them render identically.
 * All interactivity (links, booking button, badges) is injected via `children`.
 */
export default function PerformanceCard({
  time,
  venueName,
  showingTitle,
  screen,
  accessibility,
  format,
  notes,
  size = "default",
  status,
  className,
  children,
}: PerformanceCardProps) {
  return (
    <div
      className={clsx(
        styles.performanceCard,
        sizeStyles[size],
        status && statusStyles[status],
        className,
      )}
      data-testid="performance-card"
    >
      {children}
      <div className={styles.performanceTime}>{formatShowingTime(time)}</div>
      {venueName && <div className={styles.performanceVenue}>{venueName}</div>}
      {showingTitle && (
        <div className={styles.showingTitle}>{showingTitle}</div>
      )}
      {screen && (
        <div className={styles.performanceScreen}>
          {screen.length > 3 ? screen : "Screen " + screen}
        </div>
      )}
      <div className={styles.performanceTags}>
        {accessibility
          ? Object.entries(accessibility)
              .filter(([, enabled]) => enabled)
              .map(([feature]) => (
                <Tag key={feature} color="blue" size="sm">
                  {getAccessibilityLabel(feature)}
                </Tag>
              ))
          : null}
        {format && format.source && format.source !== FormatSourceDefault ? (
          <Tag key={format.source} color="blue" size="sm">
            {getFormatLabels(format?.source || FormatSourceDefault)}
          </Tag>
        ) : null}
        {format && format.presentation ? (
          <Tag key={format.presentation} color="blue" size="sm">
            {getFormatLabels(format.presentation)}
          </Tag>
        ) : null}
        {format &&
        format.dimension &&
        format.dimension !== FormatDimension.TwoD ? (
          <Tag key={format.dimension} color="blue" size="sm">
            {getFormatLabels(format.dimension)}
          </Tag>
        ) : null}
      </div>
      {notes && (
        <div className={styles.performanceNotes}>
          {notes.split("\n").map((note, noteIndex) => (
            <Fragment key={noteIndex}>
              {note}
              <br />
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

interface PerformanceCardActionsProps {
  /** The venue's page for this showing; the whole card links there. */
  showingUrl?: string;
  bookingUrl: string;
  venueName?: string;
  status?: PerformanceCardStatus;
}

/**
 * The interactive layer of a `PerformanceCard`: a whole-card link to the
 * venue's listing, a "Finished" or "Sold Out" badge, and a Book button that
 * appears on hover (always on touch widths). Pass it as the card's children.
 * URLs must already be hydrated (`useCinemaData().hydrateUrl`).
 */
export function PerformanceCardActions({
  showingUrl,
  bookingUrl,
  venueName,
  status,
}: PerformanceCardActionsProps) {
  return (
    <>
      <a
        href={showingUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.cardLink}
        aria-label={`View ${venueName || "venue"} listing`}
      />
      {status === "past" && <div className={styles.badge}>Finished</div>}
      {status === "soldOut" && <div className={styles.badge}>Sold Out</div>}
      {status !== "past" && status !== "soldOut" && (
        <ButtonAnchor
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          size="sm"
          className={styles.bookingButton}
        >
          Book
        </ButtonAnchor>
      )}
    </>
  );
}
