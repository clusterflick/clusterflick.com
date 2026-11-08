"use client";

import { useEffect, useMemo, useState } from "react";
import ContentSection from "@/components/content-section";
import StatsBand from "@/components/stats-band";
import RankedBarChart from "@/components/ranked-bar-chart";
import ExpandableSection from "@/components/expandable-section";
import PosterTile, { PosterTileList } from "@/components/poster-tile";
import { useUserContext } from "@/state/user-context";
import { useCinemaData } from "@/state/cinema-data-context";
import { GENRES } from "@/data/genres";
import { FilterId } from "@/lib/filters/types";
import type { UserListEntry } from "@/lib/user-lists";
import type { FilmDetailsData } from "@/lib/user-lists/film-details";
import {
  getSeenStats,
  type SeenRecord,
  type SeenStats as Stats,
} from "@/lib/user-lists/seen-stats";
import { formatDuration } from "@/utils/format-date";
import { formatLanguage } from "@/utils/format-language";
import { getGenreUrl } from "@/utils/get-genre-url";
import { getMovieUrl } from "@/utils/get-movie-url";
import { getPersonFilterUrl } from "@/utils/get-person-filter-url";
import styles from "./seen-stats.module.css";

/**
 * Films seen before the stats show. Under it the figures are too few to say
 * anything — "2 directors, 1 language" — and a nudge does more.
 */
export const MIN_STATS_FILMS = 5;
/** Languages named before the rest become "and N more". */
const LANGUAGES_SHOWN = 8;

const GENRE_NAMES = Object.fromEntries(
  GENRES.map(({ id, name }) => [id, name]),
);
const GENRE_SLUGS = Object.fromEntries(
  GENRES.map((genre) => [genre.id, genre]),
);

const plural = (count: number, noun: string) =>
  `${count.toLocaleString("en-GB")} ${noun}${count === 1 ? "" : "s"}`;

/**
 * Stats on the reader's Seen list, under it on /personalise: headline figures,
 * records, and behind a "Show more stats" the people, genres, decades and
 * languages. Read from the listed films' details, which only this page loads,
 * and loaded again when the Seen list's films change.
 */
export default function SeenStats({
  seen,
}: {
  seen: Record<string, UserListEntry>;
}) {
  const { readFilmDetails } = useUserContext();
  const [details, setDetails] = useState<FilmDetailsData | null>(null);
  // A key rather than the list, so an edit that changes no film doesn't
  // read the document again.
  const seenKey = Object.keys(seen).sort().join(",");

  useEffect(() => {
    if (!seenKey) return;
    let cancelled = false;
    readFilmDetails().then(
      (loaded) => !cancelled && setDetails(loaded),
      (error) => console.error("Failed to load film details", error),
    );
    return () => {
      cancelled = true;
    };
  }, [seenKey, readFilmDetails]);

  const stats = useMemo(
    () => details && getSeenStats(seen, details, GENRE_NAMES),
    [seen, details],
  );

  // An empty Seen list has its own empty state above.
  if (!stats || stats.films === 0) return null;

  if (stats.films < MIN_STATS_FILMS) {
    const toGo = MIN_STATS_FILMS - stats.films;
    return (
      <p className={styles.teaser}>
        Your film stats appear once you&apos;ve marked {MIN_STATS_FILMS} films
        as seen: {toGo} to go.
      </p>
    );
  }

  return (
    <ContentSection title="Your Film Stats">
      <div className={styles.stats}>
        <StatsBand
          label="Your film stats"
          items={[
            { id: "films", value: stats.films, label: "Films" },
            {
              id: "hours",
              value: stats.hours,
              label: "Hours",
              highlight: true,
            },
            { id: "directors", value: stats.directors, label: "Directors" },
            {
              id: "languages",
              value: stats.languages.length,
              label: "Languages",
            },
          ]}
        />
        <TimeMadeTangible stats={stats} />
        {stats.films > stats.withDetails && (
          <p className={styles.footnote}>
            Counted from {plural(stats.withDetails, "film")}.{" "}
            {plural(stats.films - stats.withDetails, "film")} on your list{" "}
            {stats.films - stats.withDetails === 1 ? "has" : "have"} no details
            to count.
          </p>
        )}
        <Records stats={stats} />
        <ExpandableSection title="More Stats">
          <MoreStats stats={stats} />
        </ExpandableSection>
      </div>
    </ContentSection>
  );
}

function TimeMadeTangible({ stats }: { stats: Stats }) {
  if (stats.days >= 2) {
    return (
      <p className={styles.tangible}>
        That&apos;s <strong>{plural(stats.days, "day")}</strong> of cinema back
        to back, or <strong>{plural(stats.doubleBills, "double bill")}</strong>.
      </p>
    );
  }
  if (stats.doubleBills >= 2) {
    return (
      <p className={styles.tangible}>
        That&apos;s <strong>{plural(stats.doubleBills, "double bill")}</strong>{" "}
        of cinema.
      </p>
    );
  }
  return null;
}

function Records({ stats }: { stats: Stats }) {
  const { movies } = useCinemaData();
  const { longest, shortest, oldest, newest } = stats.records;
  const runtime = (record: SeenRecord) =>
    formatDuration((record.runtime ?? 0) * 60_000, { compact: true });
  // A list of one film's length, or one year, has a single record of each
  // pair, not two of the same.
  const cards = [
    longest && {
      label: "Longest sit",
      record: longest,
      detail: runtime(longest),
    },
    shortest &&
      shortest.id !== longest?.id && {
        label: "Shortest",
        record: shortest,
        detail: runtime(shortest),
      },
    // The year is already under the title, so these need only the label.
    oldest && { label: "Oldest", record: oldest },
    newest &&
      newest.id !== oldest?.id &&
      newest.entry.year !== oldest?.entry.year && {
        label: "Newest",
        record: newest,
      },
  ].flatMap((card) => card || []);
  if (cards.length === 0) return null;

  return (
    <div className={styles.block}>
      <h3 className={styles.heading}>Records</h3>
      <PosterTileList>
        {cards.map(({ label, record, detail }) => {
          const movie = movies[record.id];
          return (
            <PosterTile
              key={label}
              title={record.entry.title}
              posterPath={record.entry.posterPath}
              href={movie ? getMovieUrl(movie) : undefined}
              details={record.entry.year ? [record.entry.year] : []}
              note={{ label, ...(detail && { detail }) }}
            />
          );
        })}
      </PosterTileList>
    </div>
  );
}

/**
 * "1920s" at the ends and where a century turns, "’50s" between: eleven full
 * labels don't fit across a phone, and the ends and centuries say which
 * century the short ones are in.
 */
function formatDecade(decade: number, index: number, total: number) {
  return index === 0 || index === total - 1 || decade % 100 === 0
    ? `${decade}s`
    : `\u2019${String(decade % 100).padStart(2, "0")}s`;
}

function MoreStats({ stats }: { stats: Stats }) {
  const people = [
    {
      caption: "Directors you watch most",
      heading: "Director",
      ranked: stats.topDirectors,
      filterId: FilterId.Directors as const,
    },
    {
      caption: "Actors you watch most",
      heading: "Actor",
      ranked: stats.topCast,
      filterId: FilterId.Cast as const,
    },
  ];
  const maxDecade = Math.max(1, ...stats.decades.map(({ count }) => count));
  const busiest = stats.decades.find(({ count }) => count === maxDecade);
  const moreLanguages = stats.languages.length - LANGUAGES_SHOWN;

  return (
    <div className={styles.charts}>
      {people.map(
        ({ caption, heading, ranked, filterId }) =>
          // Nobody with two films: a ranking of ones says nothing.
          ranked.length > 0 && (
            <div key={caption} className={styles.chart}>
              <RankedBarChart
                caption={caption}
                labelHeading={heading}
                valueHeading="Films"
                items={ranked.map((person, index) => ({
                  key: person.id,
                  label: person.name,
                  value: person.count,
                  href: getPersonFilterUrl(filterId, person.id),
                  highlight: index === 0,
                }))}
              />
            </div>
          ),
      )}
      {stats.genres.length > 0 && (
        <div className={styles.chart}>
          <RankedBarChart
            caption="Genres"
            labelHeading="Genre"
            valueHeading="Films"
            items={stats.genres.map((genre, index) => ({
              key: genre.id,
              label: genre.name,
              value: genre.count,
              href: GENRE_SLUGS[genre.id]
                ? getGenreUrl(GENRE_SLUGS[genre.id])
                : undefined,
              highlight: index === 0,
            }))}
          />
          <p className={styles.footnote}>
            A film can have several genres, so these add up to more than your
            films.
          </p>
        </div>
      )}
      {stats.decades.length > 1 && (
        <figure className={styles.chart}>
          <figcaption className={styles.chartHeading}>By decade</figcaption>
          <ol className={styles.decades}>
            {stats.decades.map(({ decade, count }, index) => (
              <li key={decade} className={styles.decade}>
                <span className={styles.decadeCount}>{count}</span>
                <span aria-hidden="true" className={styles.decadeTrack}>
                  <span
                    className={styles.decadeBar}
                    data-busiest={count === maxDecade || undefined}
                    style={{ height: `${(count / maxDecade) * 100}%` }}
                  />
                </span>
                <span className={styles.decadeLabel}>
                  {formatDecade(decade, index, stats.decades.length)}
                </span>
              </li>
            ))}
          </ol>
          {busiest && (
            <p className={styles.footnote}>
              Your busiest decade is the {busiest.decade}s.
            </p>
          )}
        </figure>
      )}
      {stats.languages.length > 1 && (
        <div className={styles.chart}>
          <h3 className={styles.chartHeading}>
            Films in {plural(stats.languages.length, "language")}
          </h3>
          <ul className={styles.languages}>
            {stats.languages
              .slice(0, LANGUAGES_SHOWN)
              .map(({ code, count }) => (
                <li key={code} className={styles.language}>
                  {formatLanguage(code)}{" "}
                  <span className={styles.languageCount}>{count}</span>
                </li>
              ))}
            {moreLanguages > 0 && (
              <li className={styles.language}>{moreLanguages} more</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
