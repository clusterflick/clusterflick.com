import type { Movie } from "@/types";
import { createMovieMatcher } from "@/utils/match-movie";
import { toUserListEntry, type UserListEntry } from "./index";

/*
 * Letterboxd's two CSV shapes, both of which the import reads:
 *
 * - Its export (Settings → Data → Export), a zip of one file per list.
 *   `watchlist.csv` and `watched.csv` are `Date,Name,Year,Letterboxd URI`;
 *   `diary.csv` adds `Watched Date`. The URI is a boxd.it short link, which
 *   says nothing we can match on, so a film is found by name and year.
 * - Its import format (letterboxd.com/import), which our export writes:
 *   `Title,Year,tmdbID`. The TMDB id is the dataset's own key, so a file we
 *   wrote comes back as exact matches, and Letterboxd matches it exactly too.
 */

/** One film read from a file. */
export type LetterboxdRow = {
  title: string;
  year?: number;
  tmdbId?: string;
  imdbId?: string;
  /** Epoch milliseconds — when it was watched or added, if the file says. */
  date?: number;
};

export class LetterboxdCsvError extends Error {}

/**
 * RFC 4180: fields quoted when they hold a comma, a quote or a line break,
 * quotes doubled inside them. Titles have all three.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  // Blank lines, including the trailing one most files end with.
  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ""));
}

/** Header names folded so "Watched Date", "WatchedDate" and "watched_date" agree. */
function foldHeader(header: string) {
  return header.toLowerCase().replace(/[^a-z]/g, "");
}

/** The first of `names` present among the headers, as a column index. */
function findColumn(headers: string[], names: string[]) {
  for (const name of names) {
    const index = headers.indexOf(name);
    if (index !== -1) return index;
  }
  return -1;
}

/** `YYYY-MM-DD`, as both formats write dates, at midnight UTC. */
function parseDate(value: string): number | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return undefined;
  const time = Date.UTC(+match[1], +match[2] - 1, +match[3]);
  return Number.isNaN(time) ? undefined : time;
}

/**
 * The films in a Letterboxd CSV. Throws `LetterboxdCsvError` when the file has
 * no title column, which is the only thing a row can't do without.
 */
export function parseLetterboxdCsv(text: string): LetterboxdRow[] {
  // A byte-order mark would otherwise stick to the first header.
  const [headerRow, ...rows] = parseCsv(text.replace(/^﻿/, ""));
  const headers = (headerRow ?? []).map(foldHeader);

  const titleColumn = findColumn(headers, ["name", "title"]);
  if (titleColumn === -1) {
    throw new LetterboxdCsvError("No Name or Title column");
  }
  const yearColumn = findColumn(headers, ["year"]);
  const tmdbColumn = findColumn(headers, ["tmdbid"]);
  const imdbColumn = findColumn(headers, ["imdbid"]);
  // The diary's `Date` is when the entry was logged; `Watched Date` is when
  // the film was seen, which is the one worth keeping.
  const dateColumn = findColumn(headers, ["watcheddate", "date"]);

  const result: LetterboxdRow[] = [];
  for (const cells of rows) {
    const cell = (column: number) =>
      column === -1 ? "" : (cells[column] ?? "").trim();
    const title = cell(titleColumn);
    if (!title) continue;
    const year = parseInt(cell(yearColumn), 10);
    const tmdbId = cell(tmdbColumn);
    const imdbId = cell(imdbColumn);
    const date = parseDate(cell(dateColumn));
    result.push({
      title,
      ...(!Number.isNaN(year) && { year }),
      ...(tmdbId && { tmdbId }),
      ...(imdbId && { imdbId }),
      ...(date !== undefined && { date }),
    });
  }
  return result;
}

/**
 * The rows that name a film in `movies`, each as the entry a list would keep,
 * keyed by movie id. A film named twice (a diary logs every rewatch) is kept
 * once, at its earliest date.
 */
export function matchLetterboxdRows(
  rows: LetterboxdRow[],
  movies: Movie[],
  now = Date.now(),
): Record<Movie["id"], UserListEntry> {
  const match = createMovieMatcher(movies);
  const matched: Record<Movie["id"], UserListEntry> = {};
  for (const row of rows) {
    const movie = match(row);
    if (!movie) continue;
    const addedAt = Math.min(row.date ?? now, now);
    const existing = matched[movie.id];
    if (existing && existing.addedAt <= addedAt) continue;
    matched[movie.id] = { ...toUserListEntry(movie), addedAt };
  }
  return matched;
}

function escapeCsvField(value: string) {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/**
 * A list in Letterboxd's import format, oldest first. `tmdbID` is left empty
 * for a film the pipeline couldn't match, whose id is its own rather than
 * TheMovieDB's — Letterboxd then falls back to the title and year.
 */
export function formatLetterboxdCsv(
  entries: Record<Movie["id"], UserListEntry>,
  isTmdbId: (id: Movie["id"]) => boolean,
): string {
  const lines = Object.entries(entries)
    .sort(([, a], [, b]) => a.addedAt - b.addedAt)
    .map(([id, entry]) =>
      [entry.title, entry.year ?? "", isTmdbId(id) ? id : ""]
        .map(escapeCsvField)
        .join(","),
    );
  return ["Title,Year,tmdbID", ...lines].join("\r\n") + "\r\n";
}
