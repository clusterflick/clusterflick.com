import type { Metadata } from "next";
import { notFound } from "next/navigation";
import slugify from "@sindresorhus/slugify";
import { getStaticData } from "@/utils/get-static-data";
import { getDepartedData } from "@/utils/get-departed-data";
import { getMovieUrl } from "@/utils/get-movie-url";
import { getContainingEvents } from "@/utils/get-containing-events";
import { getMovieFestivals } from "@/utils/get-movie-festivals";
import { getFestivalImagePath } from "@/utils/get-festival-image";
import { getMovieFormats } from "@/utils/get-movie-formats";
import { getMovieListsForMovie } from "@/utils/get-movie-list-movies";
import { hydrateUrl } from "@/utils/hydrate-url";
import type { Genre, Person, Venue, Movie } from "@/types";
import { buildScreeningEventSchema } from "@/utils/build-screening-event-schema";
import {
  buildMovieJsonLd,
  buildMovieBreadcrumbJsonLd,
} from "@/utils/build-movie-json-ld";
import PageContent from "./page-content";
import DepartedContent from "./departed-content";
import type { VenuePlayCount } from "./components/playing-at-section";
import StaticShowingsList from "./components/static-showings-list";

// Only allow routes from generateStaticParams, 404 for everything else
export const dynamicParams = false;

/** Resolve a movie's people or genre ids against a lookup, dropping misses. */
const namesFor = (
  ids: string[] | undefined,
  lookup: Record<string, { name: string }>,
) => (ids ?? []).map((id) => lookup[id]?.name).filter(Boolean) as string[];

// Search engines truncate meta descriptions around this length, and the same
// string doubles as the OpenGraph description on share cards, which platforms
// cache for far longer than a rebuild cycle — so it must never be cut mid-word.
const MAX_DESCRIPTION_LENGTH = 155;

function truncateAtWord(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const trimmed = text.slice(0, maxLength);
  const lastSpace = trimmed.lastIndexOf(" ");
  return `${(lastSpace > 0 ? trimmed.slice(0, lastSpace) : trimmed).trimEnd()}…`;
}

// Leads with the London showings context, since that's what differentiates
// this page from every other site carrying the same TMDB synopsis.
function buildMovieDescription(
  leadSentence: string,
  overview?: string,
): string {
  if (!overview) return leadSentence;

  const remaining = MAX_DESCRIPTION_LENGTH - leadSentence.length - 1;
  if (remaining <= 20) return leadSentence;

  return `${leadSentence} ${truncateAtWord(overview, remaining)}`;
}

export async function generateStaticParams() {
  const data = await getStaticData();
  const departed = getDepartedData();

  // Films that have finished their run keep their page. Both sets are keyed by
  // TMDB id and a film is in exactly one of them, so the union cannot collide.
  // The URL is rebuilt from the same title the live page used — the departed
  // bundle maps TMDB through the same builder as the combined data — so an old
  // link resolves rather than landing next to itself under a new slug.
  return [...Object.values(data.movies), ...Object.values(departed.movies)].map(
    (movie) => ({
      id: movie.id,
      slug: slugify(movie.title),
    }),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await getStaticData();
  const departed = getDepartedData();
  const departedMovie = departed.movies[id];
  const movie = data.movies[id] ?? departedMovie;

  if (!movie) {
    return {
      title: "Movie Not Found",
    };
  }

  const title = movie.year ? `${movie.title} (${movie.year})` : movie.title;
  const leadSentence = departedMovie
    ? `${movie.title} is not currently screening at cinemas in London.`
    : `Find screenings for ${movie.title} at cinemas across London.`;
  const description = buildMovieDescription(leadSentence, movie.overview);

  const genreLookup = departedMovie ? departed.genres : data.genres;
  const genreNames = (movie.genres ?? [])
    .map((id) => genreLookup[id]?.name)
    .filter(Boolean) as string[];

  return {
    title,
    description,
    keywords: [
      movie.title,
      ...genreNames,
      "London cinema",
      "film screenings",
      "cinema listings",
    ],
    alternates: {
      canonical: getMovieUrl(movie),
    },
    openGraph: {
      title: `${title} | Clusterflick`,
      description,
      images: movie.posterPath
        ? [`https://image.tmdb.org/t/p/w500${movie.posterPath}`]
        : undefined,
    },
  };
}

export default async function MovieDetailPage({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}) {
  const { id } = await params;
  const data = await getStaticData();
  const movie = data.movies[id];

  // A film whose last performance has been and gone drops out of the combined
  // data entirely, which used to take its page with it. It gets a page of its
  // own instead — there are no showings to render, so none of what follows
  // applies.
  if (!movie) {
    const departed = getDepartedData();
    const departedMovie = departed.movies[id];
    if (departedMovie) {
      // The same structured data the live page publishes, minus what a film
      // with no screenings cannot have: no ScreeningEvents, and no sameAs or
      // ratings, since the match stage only ever sees the combined data. A
      // page that exists to keep an indexed link working has to stay readable
      // to whatever indexed it.
      const departedUrl = `https://clusterflick.com${getMovieUrl(departedMovie)}`;
      return (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify([
                buildMovieJsonLd({
                  movie: departedMovie,
                  url: departedUrl,
                  dateModified: data.generatedAt,
                  genreNames: namesFor(departedMovie.genres, departed.genres),
                  directorNames: namesFor(
                    departedMovie.directors,
                    departed.people,
                  ),
                  actorNames: namesFor(
                    departedMovie.actors,
                    departed.people,
                  ).slice(0, 5),
                }),
                buildMovieBreadcrumbJsonLd(departedMovie, departedUrl),
              ]),
            }}
          />
          <DepartedContent
            movie={departedMovie}
            genres={departed.genres}
            people={departed.people}
            buildTime={new Date(data.generatedAt).getTime()}
          />
        </>
      );
    }

    notFound();
  }

  const genres: Record<string, Genre> = {};
  if (movie.genres) {
    for (const genreId of movie.genres) {
      if (data.genres[genreId]) {
        genres[genreId] = data.genres[genreId];
      }
    }
  }

  const people: Record<string, Person> = {};
  if (movie.directors) {
    for (const personId of movie.directors) {
      if (data.people[personId]) {
        people[personId] = data.people[personId];
      }
    }
  }
  if (movie.actors) {
    for (const personId of movie.actors) {
      if (data.people[personId]) {
        people[personId] = data.people[personId];
      }
    }
  }

  const venues: Record<string, Venue> = {};
  for (const showing of Object.values(movie.showings)) {
    if (data.venues[showing.venueId]) {
      venues[showing.venueId] = data.venues[showing.venueId];
    }
  }

  // Precompute per-venue screening counts at build time so the "Playing at"
  // summary renders statically without shipping full performance data. Deliberately
  // unfiltered — it's a stable overview of every venue the film screens at.
  const venuePlayCountsMap = new Map<string, number>();
  for (const performance of movie.performances) {
    const venueId = movie.showings[performance.showingId]?.venueId;
    if (!venueId) continue;
    venuePlayCountsMap.set(venueId, (venuePlayCountsMap.get(venueId) ?? 0) + 1);
  }
  const venueCounts: VenuePlayCount[] = Array.from(
    venuePlayCountsMap,
    ([venueId, count]) => ({ venueId, count }),
  );

  // Find multi-movie events that include this film
  const containingEvents = getContainingEvents(movie.id, data.movies);

  // Find festivals this movie is part of
  const festivals = getMovieFestivals(
    movie.id,
    data.movies,
    getFestivalImagePath,
  );

  // "Top films" lists this movie appears on (RT's 300 Best, the 100% Club, …)
  const movieLists = getMovieListsForMovie(movie.id, data.movies);

  // The franchise or series this film belongs to, when that collection has a
  // page of its own.
  const collection = movie.collectionId
    ? data.collections[movie.collectionId]
    : undefined;

  // Non-default screening formats (70mm, IMAX, 3D, …) across upcoming
  // performances, for the format tags below the poster.
  const formats = getMovieFormats(
    movie.performances,
    new Date(data.generatedAt).getTime(),
  );

  // Exclude performances from containing events to reduce data size
  const containingEventsWithoutPerformances = containingEvents.map((event) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { performances: _performances, ...eventWithoutPerformances } = event;
    return eventWithoutPerformances as Omit<Movie, "performances">;
  });

  // Exclude performances from the movie object to avoid passing unnecessary data to client
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { performances: _performances, ...movieWithoutPerformances } = movie;

  const buildTime = new Date(data.generatedAt).getTime();

  const movieUrl = `https://clusterflick.com${getMovieUrl(movie)}`;

  const sameAs = [
    movie.bechdel?.url,
    movie.imdb?.url,
    movie.letterboxd?.url,
    movie.metacritic?.url,
    movie.moviedb?.url,
    movie.rottenTomatoes?.url,
  ]
    .filter((url): url is string => Boolean(url))
    .map((url) => hydrateUrl(url, data.urlPrefixes));

  const movieJsonLd = buildMovieJsonLd({
    movie,
    url: movieUrl,
    dateModified: data.generatedAt,
    genreNames: namesFor(movie.genres, genres),
    directorNames: namesFor(movie.directors, people),
    actorNames: namesFor(movie.actors, people).slice(0, 5),
    sameAs,
    aggregateRating:
      movie.imdb?.rating != null
        ? { rating: movie.imdb.rating, reviews: movie.imdb.reviews }
        : undefined,
  });

  const breadcrumbJsonLd = buildMovieBreadcrumbJsonLd(movie, movieUrl);

  const screeningEvents = movie.performances
    .filter((p) => p.time >= buildTime)
    .sort((a, b) => a.time - b.time)
    .flatMap((performance) => {
      const showing = movie.showings[performance.showingId];
      const venue = showing ? data.venues[showing.venueId] : undefined;
      // A ScreeningEvent without a resolvable venue would omit the required
      // `location` field, so skip it rather than emit invalid structured data.
      return venue ? [{ performance, venue }] : [];
    })
    .slice(0, 50)
    .map(({ performance, venue }) =>
      buildScreeningEventSchema(performance, movie, movieUrl, venue),
    );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            movieJsonLd,
            breadcrumbJsonLd,
            ...screeningEvents,
          ]),
        }}
      />
      <PageContent
        movie={movieWithoutPerformances}
        genres={genres}
        people={people}
        venues={venues}
        venueCounts={venueCounts}
        containingEvents={containingEventsWithoutPerformances}
        festivals={festivals}
        movieLists={movieLists}
        collection={collection}
        formats={formats}
        showingsStaticContent={
          <StaticShowingsList
            performances={movie.performances}
            showings={movie.showings}
            venues={venues}
            movieTitle={movie.title}
            buildTime={buildTime}
          />
        }
      />
    </>
  );
}
