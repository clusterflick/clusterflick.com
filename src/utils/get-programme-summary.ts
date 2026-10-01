import type { Movie } from "@/types";
import type { MoviesRecord } from "@/lib/filters/types";
import { formatDayAndDate } from "@/utils/format-date";

export interface ProgrammePoster {
  title: string;
  posterPath?: string;
}

export interface ProgrammeScreening {
  movie: Movie;
  time: number;
}

export interface ProgrammeSummary {
  movieCount: number;
  /** Films soonest first, those with poster art ahead of those without. */
  posters: ProgrammePoster[];
  /** The soonest screening that can still be booked. */
  next: ProgrammeScreening | null;
}

/** Enough to suggest a programme without turning the card into a grid. */
const POSTER_LIMIT = 4;
/** A row of every club's next screening, as long as the home page's rows. */
const NEXT_UP_LIMIT = 20;

function getPosterPath(movie: Movie): string | undefined {
  return (
    movie.posterPath ??
    movie.includedMovies?.find((included) => included.posterPath)?.posterPath
  );
}

/**
 * The first few films' posters, keeping their order but putting films with
 * art ahead of those without — a text-pattern poster says less about a
 * programme than a film's own.
 */
export function pickPosters(
  movies: Movie[],
  limit: number = POSTER_LIMIT,
): ProgrammePoster[] {
  const withArt = movies.filter((movie) => getPosterPath(movie));
  const withoutArt = movies.filter((movie) => !getPosterPath(movie));
  return [...withArt, ...withoutArt].slice(0, limit).map((movie) => ({
    title: movie.title,
    posterPath: getPosterPath(movie),
  }));
}

/**
 * What a festival, club or list card shows of its programme: how many films,
 * a few posters and the next screening. The records passed in are the shared,
 * memoised results of `applyMatchers`, so nothing here sorts them in place.
 *
 * Posters are taken soonest first, because a card is read as "what's coming
 * up".
 */
export function getProgrammeSummary(
  movies: MoviesRecord,
  { now = Date.now(), posterLimit = POSTER_LIMIT } = {},
): ProgrammeSummary {
  const films = Object.values(movies).flatMap((movie) => {
    const upcoming = movie.performances.filter((p) => p.time >= now);
    if (upcoming.length === 0) return [];
    const bookable = upcoming.filter((p) => !p.status?.soldOut);
    return [
      {
        movie,
        first: Math.min(...upcoming.map((p) => p.time)),
        nextBookable:
          bookable.length > 0 ? Math.min(...bookable.map((p) => p.time)) : null,
      },
    ];
  });
  films.sort(
    (a, b) => a.first - b.first || a.movie.title.localeCompare(b.movie.title),
  );

  let next: ProgrammeScreening | null = null;
  for (const { movie, nextBookable } of films) {
    if (nextBookable !== null && (next === null || nextBookable < next.time)) {
      next = { movie, time: nextBookable };
    }
  }

  return {
    movieCount: films.length,
    posters: pickPosters(
      films.map(({ movie }) => movie),
      posterLimit,
    ),
    next,
  };
}

/**
 * "Bar Trash · Thu 8 Oct". Non-breaking spaces inside the date and after the
 * separator, as the occasion subtitles have, so a wrapped subtitle never
 * splits the date across lines.
 */
export function formatProgrammeScreening(name: string, time: number): string {
  return `${name} · ${formatDayAndDate(time).replace(/ /g, " ")}`;
}

/**
 * "Next up": the next bookable screening of each programme, soonest first,
 * subtitled with the programme's name and the date.
 *
 * One per programme rather than the next twenty screenings overall, because a
 * weekly club would otherwise fill the row on its own and the point of the row
 * is the range of what's on. A film two programmes share appears once, under
 * whichever shows it first.
 */
export function getNextUpRow(
  programmes: { name: string; movies: MoviesRecord }[],
  { now = Date.now(), limit = NEXT_UP_LIMIT } = {},
): { movie: Movie; subtitle: string }[] {
  const screenings = programmes.flatMap(({ name, movies }) => {
    const { next } = getProgrammeSummary(movies, { now, posterLimit: 0 });
    return next ? [{ name, ...next }] : [];
  });
  screenings.sort((a, b) => a.time - b.time || a.name.localeCompare(b.name));

  const seen = new Set<string>();
  const row: { movie: Movie; subtitle: string }[] = [];
  for (const { name, movie, time } of screenings) {
    if (seen.has(movie.id)) continue;
    seen.add(movie.id);
    row.push({ movie, subtitle: formatProgrammeScreening(name, time) });
    if (row.length === limit) break;
  }
  return row;
}

/**
 * A programme's films as a poster row, soonest first, each subtitled with the
 * date it's next on. Sold-out screenings still date a film here — the row is
 * the programme, and a sold-out film is part of it — but are passed over when
 * a later screening can still be booked.
 */
export function getProgrammeRow(
  movies: MoviesRecord,
  { now = Date.now(), limit = NEXT_UP_LIMIT } = {},
): { movie: Movie; subtitle: string }[] {
  return Object.values(movies)
    .flatMap((movie) => {
      const upcoming = movie.performances.filter((p) => p.time >= now);
      if (upcoming.length === 0) return [];
      const bookable = upcoming.filter((p) => !p.status?.soldOut);
      const time = Math.min(
        ...(bookable.length > 0 ? bookable : upcoming).map((p) => p.time),
      );
      return [{ movie, time }];
    })
    .sort(
      (a, b) => a.time - b.time || a.movie.title.localeCompare(b.movie.title),
    )
    .slice(0, limit)
    .map(({ movie, time }) => ({ movie, subtitle: formatDayAndDate(time) }));
}
