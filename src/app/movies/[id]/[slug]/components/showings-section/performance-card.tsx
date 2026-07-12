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
import styles from "./showings-section.module.css";

interface PerformanceCardProps {
  time: number;
  venueName?: string;
  /** Venue's own title for the showing, when it differs from the movie title. */
  showingTitle?: string;
  screen?: string;
  accessibility?: MoviePerformance["accessibility"];
  format?: MoviePerformance["format"];
  notes?: string;
  /** Extra class(es) for state styling (e.g. past / sold-out). */
  className?: string;
  /**
   * Interactive overlays rendered first inside the card — the full-card link,
   * booking button and status badges. Omitted by the static SEO render, which
   * is deliberately non-interactive.
   */
  children?: ReactNode;
}

/**
 * Presentational showing card shared by the interactive `ShowingsSection` list
 * and the SSR-only `StaticShowingsList`, so both render identically. All
 * interactivity (links, booking button, badges) is injected via `children`.
 */
export default function PerformanceCard({
  time,
  venueName,
  showingTitle,
  screen,
  accessibility,
  format,
  notes,
  className,
  children,
}: PerformanceCardProps) {
  return (
    <div
      className={clsx(styles.performanceCard, className)}
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
