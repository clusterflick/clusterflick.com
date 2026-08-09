import type { Movie } from "@/types";
import type { DepartedMovie } from "@/utils/get-departed-data";

/** The fields of a movie the Movie schema is built from. */
type SchemaMovie = Pick<
  Movie,
  | "title"
  | "overview"
  | "posterPath"
  | "releaseDate"
  | "year"
  | "duration"
  | "classification"
>;

type BuildMovieJsonLdOptions = {
  movie: SchemaMovie;
  /** Absolute canonical URL of the movie's page. */
  url: string;
  dateModified: string;
  genreNames: string[];
  directorNames: string[];
  actorNames: string[];
  /** Resolved review-aggregator URLs. Empty for films the match stage never saw. */
  sameAs?: string[];
  aggregateRating?: { rating: number; reviews: number };
};

const toIsoDuration = (duration: number) => {
  const totalMinutes = Math.floor(duration / 1000 / 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 && m > 0 ? `PT${h}H${m}M` : h > 0 ? `PT${h}H` : `PT${m}M`;
};

/**
 * Build the schema.org Movie object for a movie page.
 *
 * Shared by the live page and the page a film keeps once its run has ended.
 * That page is the whole reason this is a function rather than an inline
 * literal: it exists so a link indexed while the film was on still resolves,
 * which is worth nothing if it resolves to a page search engines can no longer
 * read. Everything it cannot have — screening events, review ratings — is
 * optional here rather than assumed.
 */
export function buildMovieJsonLd({
  movie,
  url,
  dateModified,
  genreNames,
  directorNames,
  actorNames,
  sameAs = [],
  aggregateRating,
}: BuildMovieJsonLdOptions): Record<string, unknown> {
  const asPeople = (names: string[]) =>
    names.map((name) => ({ "@type": "Person", name }));

  return {
    "@context": "https://schema.org",
    "@type": "Movie",
    name: movie.title,
    url,
    dateModified,
    ...(movie.overview && { description: movie.overview }),
    ...(movie.posterPath && {
      image: `https://image.tmdb.org/t/p/w500${movie.posterPath}`,
    }),
    ...((movie.releaseDate || movie.year) && {
      datePublished: movie.releaseDate ?? movie.year,
    }),
    ...(movie.duration && { duration: toIsoDuration(movie.duration) }),
    ...(movie.classification &&
      movie.classification !== "Unknown" && {
        contentRating: movie.classification,
      }),
    ...(genreNames.length > 0 && { genre: genreNames }),
    ...(directorNames.length > 0 && { director: asPeople(directorNames) }),
    ...(actorNames.length > 0 && { actor: asPeople(actorNames) }),
    ...(sameAs.length > 0 && { sameAs }),
    ...(aggregateRating &&
      aggregateRating.reviews > 0 && {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: aggregateRating.rating,
          bestRating: 10,
          worstRating: 1,
          ratingCount: aggregateRating.reviews,
        },
      }),
  };
}

/** Home → this film, the trail every movie page publishes. */
export function buildMovieBreadcrumbJsonLd(
  movie: Pick<Movie | DepartedMovie, "title">,
  url: string,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://clusterflick.com",
      },
      { "@type": "ListItem", position: 2, name: movie.title, item: url },
    ],
  };
}
