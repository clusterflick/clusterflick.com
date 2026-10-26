"use client";

import { useMemo } from "react";
import { useNow } from "@/hooks/use-now";
import ContentSection from "@/components/content-section";
import ReleaseDayBars from "@/components/release-day-bars";
import ReleaseFreshness from "@/components/release-freshness";
import HourHistogram from "@/components/hour-histogram";
import { formatDateLong, minutesToTimeString } from "@/utils/format-date";
import {
  getDailyRange,
  getLondonDay,
  getRecentDays,
  getStreaks,
  RECENT_DAYS,
  type ReleaseStatus,
} from "@/utils/release-status";
import DataPageLinks from "../data-page-links";
import styles from "./page.module.css";

interface StatusViewProps {
  status: ReleaseStatus;
  /** Off in stories, which have no published data to read */
  latestUrl?: string | null;
}

const number = (value: number) => value.toLocaleString("en-GB");
const days = (value: number) =>
  `${number(value)} ${value === 1 ? "day" : "days"}`;

/**
 * Everything that depends on today is worked out here, in the browser, against
 * the reader's clock: the static HTML is drawn as of the build, then redrawn
 * as of now. If the pipeline stops, the build stops with it, and a page that
 * only knew its build date would show an unbroken streak and a full row of
 * green for as long as anyone looked at it. Redrawn, the missing days appear
 * as missing and the streak ends.
 */
export default function StatusView({ status, latestUrl }: StatusViewProps) {
  const today = getLondonDay(useNow(status.builtAt));

  const datasets = useMemo(
    () =>
      status.datasets.map((dataset) => ({
        ...dataset,
        streaks: getStreaks(dataset.days, today),
        recent: getRecentDays(dataset.days, today),
        range: getDailyRange(dataset.days, today),
      })),
    [status.datasets, today],
  );

  const newest = status.datasets
    .map(({ latest }) => latest)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0];
  const firstEver = status.datasets
    .map(({ first }) => first)
    .sort((a, b) => a.publishedAt.localeCompare(b.publishedAt))[0];
  const { timeOfDay } = status;

  return (
    <>
      <ReleaseFreshness
        latest={newest}
        builtAt={status.builtAt}
        latestUrl={latestUrl}
      />

      <p className={styles.lede}>
        Releasing since <strong>{formatDateLong(firstEver.publishedAt)}</strong>
        , with{" "}
        <strong>
          {number(datasets.reduce((sum, { total }) => sum + total, 0))}
        </strong>{" "}
        releases across both datasets.
      </p>
      <div className={styles.intro}>
        <p>
          This is the release history of the two datasets Clusterflick publishes
          for reuse. What&apos;s in them, how to use them and the terms
          they&apos;re published under each have a page of their own.
        </p>
        <DataPageLinks current="status" />
      </div>

      {datasets.map((dataset) => (
        <ContentSection
          key={dataset.key}
          title={dataset.label}
          intro={
            <>
              Released to{" "}
              <a
                href={`https://github.com/${dataset.repository}/releases`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {dataset.repository}
              </a>
              , first on {formatDateLong(dataset.first.publishedAt)}.
            </>
          }
        >
          <dl className={styles.stats}>
            <div className={styles.stat}>
              <dt>Releases</dt>
              <dd>{number(dataset.total)}</dd>
            </div>
            <div className={styles.stat}>
              <dt>Current streak</dt>
              <dd>{days(dataset.streaks.current)}</dd>
            </div>
            <div className={styles.stat}>
              <dt>Longest streak</dt>
              <dd>{days(dataset.streaks.longest)}</dd>
            </div>
            <div className={styles.stat}>
              <dt>Per day</dt>
              <dd>
                {dataset.range.fewest === dataset.range.median
                  ? number(dataset.range.median)
                  : `${number(dataset.range.fewest)}–${number(dataset.range.median)}`}
              </dd>
            </div>
          </dl>
          <p className={styles.note}>
            A streak counts consecutive days with at least one release, and
            carries on through today until its first release lands. Per day is
            the fewest releases in a day over the last {RECENT_DAYS} days, then
            the median.
          </p>
          <ReleaseDayBars days={dataset.recent} label={dataset.label} />
        </ContentSection>
      ))}

      <ContentSection
        title="When releases land"
        intro={`Data file releases by the hour they were published, over the last ${timeOfDay.windowDays} days, in London time (BST in summer, GMT in winter).`}
      >
        <HourHistogram
          hours={timeOfDay.hours}
          unit="releases"
          label={`Data file releases by hour of the day, last ${timeOfDay.windowDays} days`}
        />
        <ul className={styles.facts}>
          {timeOfDay.firstOfDay && (
            <li>
              The first release of the day landed by{" "}
              <strong>{minutesToTimeString(timeOfDay.firstOfDay.p90)}</strong>{" "}
              on nine days in ten, and typically around{" "}
              <strong>
                {minutesToTimeString(timeOfDay.firstOfDay.median)}
              </strong>
              .
            </li>
          )}
          {timeOfDay.calendarLag !== null && (
            <li>
              The calendar feeds are built from each data release, and followed
              it by a median of <strong>{timeOfDay.calendarLag} minutes</strong>
              .
            </li>
          )}
          <li>
            These are the times each release was published on GitHub. The copies
            under <code>/datasets/</code> on this site are updated when the site
            next deploys, after the release.
          </li>
        </ul>
      </ContentSection>
    </>
  );
}
