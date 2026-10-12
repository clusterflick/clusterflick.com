import type { Movie } from "@/types";

/** The id lists a multi-film event can draw from the films it screens. */
export type IncludedIdKey = "genres" | "directors" | "actors";

/**
 * A film's genres, directors or cast, plus those of the films it screens.
 *
 * A double bill, marathon or shorts programme usually matches no single film,
 * so its own lists are empty (genres hold only the "Uncategorised"
 * placeholder) while each film inside it carries its own. A horror double bill
 * should answer a Horror filter, so an event is read as the union of what it
 * screens: any one film matching is enough, as every multi-select filter reads
 * "or".
 *
 * An unmatched event's own genres are dropped once its films supply some,
 * since they can only be the placeholder; it stays Uncategorised when none of
 * its films has a genre either. Returns the movie's own array untouched when
 * there is nothing to add, as this runs over every film on every filter pass.
 */
export function getMovieAndIncluded(
  movie: Pick<Movie, IncludedIdKey | "includedMovies" | "isUnmatched">,
  key: IncludedIdKey,
): string[] {
  const own = movie[key] ?? [];
  const included = movie.includedMovies;
  if (!included || included.length === 0) return own;

  const ids = new Set<string>();
  for (const film of included) {
    for (const id of film[key] ?? []) ids.add(id);
  }
  if (ids.size === 0) return own;

  if (key === "genres" && movie.isUnmatched) return [...ids];
  for (const id of own) ids.add(id);
  return [...ids];
}
