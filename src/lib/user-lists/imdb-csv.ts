import {
  findColumn,
  foldHeader,
  parseCsv,
  parseDate,
  type LetterboxdRow,
} from "./letterboxd-csv";

/*
 * IMDb's list exports ("Export" on a list, the watchlist or the ratings page).
 * IMDb has no import, so there is nothing for us to write back to it; this
 * only reads.
 *
 * Every row carries `Const`, IMDb's own id (`tt0133093`), beside `Title` and
 * `Year`. The id matches a film in the dataset exactly. A film that isn't
 * showing is looked up on TheMovieDB by title and year, as a Letterboxd row
 * is, since the search Worker only searches by title.
 *
 * The watchlist and ratings exports were checked against files exported in
 * November 2026: a list has `Created` (and an empty `Date Rated` for films not
 * rated), ratings have `Date Rated`, and both have `Original Title` and
 * `Title Type`. The columns sit in different places in the two, and older
 * exports were in lower case (`const`, `created`, `title type`), so columns
 * are found by folded name rather than position, and none but `Const` and
 * `Title` is required.
 */

/** An IMDb title id: `tt` and digits. */
const IMDB_ID = /^tt\d+$/;

/**
 * `Title Type`s that aren't films: series, their episodes, games, podcasts.
 * Matched loosely, because IMDb has written them both as "TV Series" and as
 * "tvSeries". Anything else — Movie, Short, TV Movie, Video, TV Special, and
 * whatever IMDb adds — is read as a film.
 */
const NOT_A_FILM = /series|episode|game|podcast/i;

export type ImdbCsv = {
  /** The films, in file order. */
  rows: LetterboxdRow[];
  /** Rows that weren't films, by title, for the review to name. */
  skipped: { title: string; type: string }[];
};

/** Whether a header row is IMDb's: it has a `Const` column. */
export function isImdbHeader(headerRow: string[]) {
  return headerRow.map(foldHeader).includes("const");
}

/**
 * The films in an IMDb export, or null when the file isn't one (it has no
 * `Const` or no `Title` column) — the caller then reads it as Letterboxd's.
 */
export function parseImdbCsv(text: string): ImdbCsv | null {
  // A byte-order mark would otherwise stick to the first header.
  const [headerRow, ...lines] = parseCsv(text.replace(/^﻿/, ""));
  if (!headerRow || !isImdbHeader(headerRow)) return null;
  const headers = headerRow.map(foldHeader);

  const idColumn = findColumn(headers, ["const"]);
  const titleColumn = findColumn(headers, ["title"]);
  if (titleColumn === -1) return null;
  const originalTitleColumn = findColumn(headers, ["originaltitle"]);
  const yearColumn = findColumn(headers, ["year"]);
  const typeColumn = findColumn(headers, ["titletype"]);
  // When it was rated is the nearest thing to when it was seen; failing
  // that, when it was added to the list. A list export carries both columns,
  // with Date Rated empty for films not rated, so each row takes the first
  // that it fills.
  const dateColumns = ["daterated", "dateadded", "created"]
    .map((name) => headers.indexOf(name))
    .filter((index) => index !== -1);

  const result: ImdbCsv = { rows: [], skipped: [] };
  for (const cells of lines) {
    const cell = (column: number) =>
      column === -1 ? "" : (cells[column] ?? "").trim();
    const title = cell(titleColumn);
    if (!title) continue;
    const type = cell(typeColumn);
    if (type && NOT_A_FILM.test(type)) {
      result.skipped.push({ title, type });
      continue;
    }
    const imdbId = cell(idColumn);
    const originalTitle = cell(originalTitleColumn);
    const year = parseInt(cell(yearColumn), 10);
    const date = dateColumns
      .map((column) => parseDate(cell(column).slice(0, 10)))
      .find((time) => time !== undefined);
    result.rows.push({
      title,
      ...(originalTitle &&
        originalTitle !== title && { altTitles: [originalTitle] }),
      ...(!Number.isNaN(year) && { year }),
      ...(IMDB_ID.test(imdbId) && { imdbId }),
      ...(date !== undefined && { date }),
    });
  }
  return result;
}
