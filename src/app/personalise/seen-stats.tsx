"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import ContentSection from "@/components/content-section";
import StatsBand from "@/components/stats-band";
import RankedBarChart from "@/components/ranked-bar-chart";
import ExpandableSection from "@/components/expandable-section";
import PosterTile, { PosterTileList } from "@/components/poster-tile";
import { useUserContext } from "@/state/user-context";
import { useCinemaData } from "@/state/cinema-data-context";
import { useMediaQuery } from "@/hooks/use-media-query";
import Link from "next/link";
import ListProgress from "@/components/list-progress";
import { getListProgress } from "@/lib/user-lists/list-progress";
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
export type MovieListProgressItem = {
  id: string;
  name: string;
  href: string;
  /** The list's films (`getMovieListTmdbIds`). */
  tmdbIds: string[];
};

/** Lists shown in the stats: the reader's most complete, not all nine. */
const LISTS_SHOWN = 3;

export default function SeenStats({
  seen,
  movieLists = [],
}: {
  seen: Record<string, UserListEntry>;
  /** The film lists, from the build, for the reader's progress through them. */
  movieLists?: MovieListProgressItem[];
}) {
  const { readFilmDetails } = useUserContext();
  // Matches `.summary`'s breakpoint in seen-stats.module.css. Beside the
  // records the figures go two to a row; across the page, in a row of four.
  const besideRecords = useMediaQuery("(min-width: 1000px)");
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
        <div className={styles.summary}>
          <StatsBand
            layout={besideRecords ? "grid" : "row"}
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
          <Records stats={stats} />
        </div>
        {stats.films > stats.withDetails && (
          <p className={styles.footnote}>
            Counted from {plural(stats.withDetails, "film")}.{" "}
            {plural(stats.films - stats.withDetails, "film")} on your list{" "}
            {stats.films - stats.withDetails === 1 ? "has" : "have"} no details
            to count.
          </p>
        )}
        <ListsProgress seen={seen} movieLists={movieLists} />
        <ExpandableSection title="More Stats" scrollOnExpand={false}>
          <MoreStats stats={stats} />
        </ExpandableSection>
      </div>
    </ContentSection>
  );
}

/**
 * The film lists the reader is furthest through, each a link to the list's
 * page. Only lists with a film seen: a strip of noughts says nothing.
 */
function ListsProgress({
  seen,
  movieLists,
}: {
  seen: Record<string, UserListEntry>;
  movieLists: MovieListProgressItem[];
}) {
  const ranked = movieLists
    .map((list) => ({ list, progress: getListProgress(list.tmdbIds, seen) }))
    .filter(({ progress }) => progress.seen > 0)
    .sort(
      (a, b) =>
        b.progress.seen / b.progress.total -
          a.progress.seen / a.progress.total ||
        b.progress.seen - a.progress.seen,
    )
    .slice(0, LISTS_SHOWN);
  if (ranked.length === 0) return null;

  return (
    <div className={styles.block}>
      <h3 className={styles.heading}>Your progress through the lists</h3>
      <ul className={styles.listsProgress}>
        {ranked.map(({ list }) => (
          <li key={list.id}>
            <Link href={list.href} className={styles.listProgress}>
              <span className={styles.listName}>{list.name}</span>
              <ListProgress tmdbIds={list.tmdbIds} />
            </Link>
          </li>
        ))}
      </ul>
      <Link href="/lists" className={styles.allLists}>
        All film lists
      </Link>
    </div>
  );
}

function Records({ stats }: { stats: Stats }) {
  const { movies } = useCinemaData();
  const { longest, shortest, oldest, newest } = stats.records;
  const runtime = (record: SeenRecord) =>
    formatDuration((record.runtime ?? 0) * 60_000, { compact: true });
  // On the reader's clock: the page is client-rendered, so this is today.
  const thisYear = new Date().getFullYear();
  const yearsAgo = (record: SeenRecord) => {
    const years = thisYear - Number(record.entry.year);
    if (years <= 0) return "This year";
    if (years === 1) return "Last year";
    return `${years} years ago`;
  };
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
        label: "Shortest sit",
        record: shortest,
        detail: runtime(shortest),
      },
    oldest && { label: "Oldest", record: oldest, detail: yearsAgo(oldest) },
    newest &&
      newest.id !== oldest?.id &&
      newest.entry.year !== oldest?.entry.year && {
        label: "Newest",
        record: newest,
        detail: yearsAgo(newest),
      },
  ].flatMap((card) => card || []);
  if (cards.length === 0) return null;

  return (
    <div className={clsx(styles.block, styles.records)}>
      {/* Each tile's note says which record it is; the heading is for
          screen readers, so the tiles line up with the figures beside them. */}
      <h3 className={styles.visuallyHidden}>Records</h3>
      <PosterTileList className={styles.recordList}>
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
  const busiest = Math.max(0, ...stats.decades.map(({ count }) => count));
  const moreLanguages = stats.languages.length - LANGUAGES_SHOWN;

  // Nobody with two films: a ranking of ones says nothing.
  const peopleCharts = people.map(
    ({ caption, heading, ranked, filterId }) =>
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
  );
  const genresChart = stats.genres.length > 0 && (
    <div key="genres" className={styles.chart}>
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
        A film can have several genres, so these add up to more than your films.
      </p>
    </div>
  );
  const decadesChart = stats.decades.length > 1 && (
    <div key="decades" className={styles.chart}>
      <RankedBarChart
        caption="By decade"
        labelHeading="Decade"
        valueHeading="Films"
        keepOrder
        items={stats.decades.map(({ decade, count }) => ({
          key: String(decade),
          label: `${decade}s`,
          value: count,
          highlight: count === busiest,
        }))}
      />
    </div>
  );
  const languagesChart = stats.languages.length > 1 && (
    <div key="languages" className={styles.chart}>
      <h3 className={styles.chartHeading}>
        Films in {plural(stats.languages.length, "language")}
      </h3>
      <ul className={styles.languages}>
        {stats.languages.slice(0, LANGUAGES_SHOWN).map(({ code, count }) => (
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
  );

  // Two columns of about the same height: the short people rankings and the
  // decades on one side, the long genre list and the languages on the other.
  // Side by side, each chart sat beside one of a different length and left a
  // gap under the shorter. One column on a phone, in this order.
  const columns = [
    [...peopleCharts, decadesChart],
    [genresChart, languagesChart],
  ]
    .map((charts) => charts.filter(Boolean))
    .filter((charts) => charts.length > 0);

  return (
    <div className={styles.charts}>
      {columns.map((charts, index) => (
        <div key={index} className={styles.column}>
          {charts}
        </div>
      ))}
    </div>
  );
}
