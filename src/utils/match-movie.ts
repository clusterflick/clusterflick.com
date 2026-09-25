import { getSearchVariants } from "@/lib/filters/normalize";
import type { Movie } from "@/types";

/**
 * What identifies a film from outside the dataset — a published list's entry,
 * a row of a Letterboxd export. Only the title is required.
 */
export type MovieMatchQuery = {
  title: string;
  altTitles?: string[];
  year?: number;
  imdbId?: string;
  rtSlug?: string;
  tmdbId?: string;
};

/**
 * A published list's year can differ from the dataset's by one — festival vs
 * general release, or US vs UK dates — so title matches allow a year either
 * side. Award lists override this via `yearTolerance`, as they cite the award
 * year rather than the film's.
 */
const DEFAULT_YEAR_TOLERANCE = 1;

/**
 * The `rottentomatoes.com/m/<slug>` slug for a movie, or null.
 *
 * Handles both the compressed form the dataset ships (`{102}the_godfather`,
 * where `{102}` indexes `urlPrefixes`) and a fully hydrated URL, so callers
 * don't need to hydrate first.
 */
function getRtSlug(movie: Movie): string | null {
  const url = movie.rottenTomatoes?.url;
  if (!url) return null;

  const withoutPrefix = url.replace(/^\{\d+\}/, "");
  const segments = withoutPrefix.split("/").filter(Boolean);
  return segments[segments.length - 1] ?? null;
}

function getYear(movie: Movie): number | null {
  const year = movie.year ? parseInt(movie.year, 10) : NaN;
  return Number.isNaN(year) ? null : year;
}

/**
 * Lookup tables over a set of films, so resolving a 300-entry list is a
 * handful of map hits per entry rather than a scan.
 */
type Lookups = {
  /** Keyed by TMDB id, which is the dataset's own movie id. */
  byTmdbId: Map<string, Movie>;
  byImdbId: Map<string, Movie>;
  byRtSlug: Map<string, Movie>;
  byTitleVariant: Map<string, Movie[]>;
};

function buildLookups(movies: Movie[]): Lookups {
  const byTmdbId = new Map<string, Movie>();
  const byImdbId = new Map<string, Movie>();
  const byRtSlug = new Map<string, Movie>();
  const byTitleVariant = new Map<string, Movie[]>();

  for (const movie of movies) {
    byTmdbId.set(movie.id, movie);

    const imdbId = movie.imdb?.id ?? movie.imdbId;
    if (imdbId && !byImdbId.has(imdbId)) byImdbId.set(imdbId, movie);

    const rtSlug = getRtSlug(movie);
    if (rtSlug && !byRtSlug.has(rtSlug)) byRtSlug.set(rtSlug, movie);

    for (const variant of getSearchVariants(movie.title)) {
      const existing = byTitleVariant.get(variant);
      if (existing) existing.push(movie);
      else byTitleVariant.set(variant, [movie]);
    }
  }

  return { byTmdbId, byImdbId, byRtSlug, byTitleVariant };
}

/**
 * The showing film a list entry refers to, or null if it isn't on in London.
 *
 * Tried in descending order of certainty: TMDB id (the dataset's own key), then
 * IMDb id, then Rotten Tomatoes slug, then title + year. The title fallback
 * matters because most published lists give nothing but a title and a year.
 */
function resolveEntry(
  entry: MovieMatchQuery,
  lookups: Lookups,
  yearTolerance: number,
): Movie | null {
  if (entry.tmdbId) {
    const byTmdbId = lookups.byTmdbId.get(entry.tmdbId);
    if (byTmdbId) return byTmdbId;
  }

  if (entry.imdbId) {
    const byId = lookups.byImdbId.get(entry.imdbId);
    if (byId) return byId;
  }

  if (entry.rtSlug) {
    const bySlug = lookups.byRtSlug.get(entry.rtSlug);
    if (bySlug) return bySlug;
  }

  const candidates = new Set<Movie>();
  for (const title of [entry.title, ...(entry.altTitles ?? [])]) {
    for (const variant of getSearchVariants(title)) {
      for (const movie of lookups.byTitleVariant.get(variant) ?? []) {
        candidates.add(movie);
      }
    }
  }
  if (candidates.size === 0) return null;

  // Without a year to check against, a bare title match is too loose to trust —
  // remakes and shared titles are common enough to produce real false hits.
  if (entry.year === undefined) {
    return candidates.size === 1 ? [...candidates][0] : null;
  }

  let best: Movie | null = null;
  let bestDistance = Infinity;
  for (const movie of candidates) {
    const year = getYear(movie);
    if (year === null) continue;
    const distance = Math.abs(year - entry.year);
    if (distance <= yearTolerance && distance < bestDistance) {
      best = movie;
      bestDistance = distance;
    }
  }

  return best;
}

/**
 * A resolver over `movies`: the lookups are built once, so each query is a few
 * map hits. Returns null for a film that isn't among them.
 */
export function createMovieMatcher(movies: Movie[]) {
  const lookups = buildLookups(movies);
  return (query: MovieMatchQuery, yearTolerance = DEFAULT_YEAR_TOLERANCE) =>
    resolveEntry(query, lookups, yearTolerance);
}
