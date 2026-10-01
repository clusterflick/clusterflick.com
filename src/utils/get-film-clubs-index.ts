import type { Movie } from "@/types";
import type { MoviesRecord } from "@/lib/filters/types";
import { FILM_CLUBS, type FilmClubKind } from "@/data/film-clubs";
import { getFilmClubUrl } from "@/utils/get-film-club-url";
import { getFilmClubMovies } from "@/utils/get-film-club-movies";
import {
  getProgrammeSummary,
  getNextUpRow,
  type ProgrammePoster,
} from "@/utils/get-programme-summary";
import { formatDayAndDate } from "@/utils/format-date";

export type FilmClubListItem = {
  id: string;
  name: string;
  kind: FilmClubKind;
  href: string;
  imagePath: string | null;
  movieCount: number;
  posters: ProgrammePoster[];
  next: { title: string; when: string; time: number } | null;
  seoDescription: string | null;
};

/**
 * Everything `/film-clubs` shows: each club's next screening for the "Next
 * up" row, the clubs with films on, and the rest. Image paths and blurbs are
 * passed in, since the page resolves them from the filesystem and the stories
 * can't.
 */
export function getFilmClubsIndex(
  movies: MoviesRecord,
  {
    now = Date.now(),
    getImagePath,
    descriptions = {},
  }: {
    now?: number;
    getImagePath: (id: string) => string | null;
    descriptions?: Record<string, string | null>;
  },
): {
  nextUp: { movie: Movie; subtitle: string }[];
  activeClubs: FilmClubListItem[];
  inactiveClubs: FilmClubListItem[];
} {
  const clubs = FILM_CLUBS.map((club) => ({
    club,
    movies: getFilmClubMovies(club, movies),
  }));

  const items = clubs.map(({ club, movies: clubMovies }): FilmClubListItem => {
    const { movieCount, posters, next } = getProgrammeSummary(clubMovies, {
      now,
    });
    return {
      id: club.id,
      name: club.name,
      kind: club.kind,
      href: getFilmClubUrl(club),
      imagePath: getImagePath(club.id),
      movieCount,
      posters,
      next: next && {
        title: next.movie.title,
        when: formatDayAndDate(next.time),
        time: next.time,
      },
      seoDescription: descriptions[club.id] ?? null,
    };
  });

  // Soonest first: the page is read as "what's on", and a club screening
  // tomorrow is more use than one with more films a month out. A club whose
  // remaining screenings are all sold out has no next date and goes last.
  const activeClubs = items
    .filter((c) => c.movieCount > 0)
    .sort(
      (a, b) =>
        (a.next?.time ?? Infinity) - (b.next?.time ?? Infinity) ||
        a.name.localeCompare(b.name),
    );
  const inactiveClubs = items
    .filter((c) => c.movieCount === 0)
    .sort((a, b) => a.name.localeCompare(b.name));

  const nextUp = getNextUpRow(
    clubs.map(({ club, movies: clubMovies }) => ({
      name: club.name,
      movies: clubMovies,
    })),
    { now },
  );

  return { nextUp, activeClubs, inactiveClubs };
}
