import type { Movie } from "@/types";
import {
  getSearchVariants,
  normalizeForSearch,
  normalizeToWords,
} from "@/lib/filters/normalize";

/** How closely a title answers a query: lower is better. */
enum Closeness {
  /** The title starts with it: "dune" → "Dune: Part Two". */
  Start,
  /** A word in the title starts with it: "dune" → "Jodorowsky's Dune". */
  Word,
  /** Anywhere at all, as the catalogue's search box matches. */
  Anywhere,
}

function getCloseness(title: string, query: string): Closeness | null {
  const variants = getSearchVariants(title);
  if (!variants.some((variant) => variant.includes(query))) return null;
  if (variants.some((variant) => variant.startsWith(query))) {
    return Closeness.Start;
  }
  // The query is run together, as the variants are, so a word start is any
  // run of the title's words beginning at a word that starts with it.
  const words = normalizeToWords(title);
  for (let index = 0; index < words.length; index++) {
    if (words.slice(index).join("").startsWith(query)) return Closeness.Word;
  }
  return Closeness.Anywhere;
}

/**
 * The films in the dataset a title query names, closest first, for the
 * personalise page's search. It matches the way the catalogue's search box
 * does (both titles and the original-language title, through the same
 * spelling variants), so a film found there is found here. Within a closeness,
 * films sort by title as the lists on the page do.
 *
 * Runs in the browser on every keystroke, over a couple of thousand films:
 * `getSearchVariants` caches each title's spellings, so after the first pass
 * this is a string comparison per title.
 */
export function searchShowingFilms(
  movies: Record<string, Movie>,
  query: string,
): Movie[] {
  const normalizedQuery = normalizeForSearch(query);
  if (!normalizedQuery) return [];

  const found: { movie: Movie; closeness: Closeness }[] = [];
  for (const movie of Object.values(movies)) {
    const closeness = [movie.title, movie.normalizedTitle, movie.originalTitle]
      .filter((title): title is string => !!title)
      .map((title) => getCloseness(title, normalizedQuery))
      .filter((value): value is Closeness => value !== null);
    if (closeness.length > 0) {
      found.push({ movie, closeness: Math.min(...closeness) });
    }
  }

  return found
    .sort(
      (a, b) =>
        a.closeness - b.closeness ||
        a.movie.normalizedTitle.localeCompare(b.movie.normalizedTitle),
    )
    .map(({ movie }) => movie);
}
