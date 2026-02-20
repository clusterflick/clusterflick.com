import type { Metadata } from "next";
import { notFound } from "next/navigation";
import slugify from "@sindresorhus/slugify";
import { getStaticData } from "@/utils/get-static-data";
import { getMovieUrl } from "@/utils/get-movie-url";
import { getContainingEvents } from "@/utils/get-containing-events";
import type { Genre, Person, Venue, Movie } from "@/types";
import PageContent from "./page-content";

// Only allow routes from generateStaticParams, 404 for everything else
export const dynamicParams = false;

export async function generateStaticParams() {
  const data = await getStaticData();

  return Object.values(data.movies).map((movie) => ({
    id: movie.id,
    slug: slugify(movie.title),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await getStaticData();
  const movie = data.movies[id];

  if (!movie) {
    return {
      title: "Movie Not Found",
    };
  }

  const title = movie.year ? `${movie.title} (${movie.year})` : movie.title;
  const description =
    movie.overview ||
    `Find screenings for ${movie.title} at cinemas across London.`;

  return {
    title,
    description,
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

  if (!movie) {
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

  // Find multi-movie events that include this film
  const containingEvents = getContainingEvents(movie.id, data.movies);

  // Exclude performances from containing events to reduce data size
  const containingEventsWithoutPerformances = containingEvents.map((event) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { performances: _performances, ...eventWithoutPerformances } = event;
    return eventWithoutPerformances as Omit<Movie, "performances">;
  });

  // Exclude performances from the movie object to avoid passing unnecessary data to client
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { performances: _performances, ...movieWithoutPerformances } = movie;

  const movieUrl = `https://clusterflick.com${getMovieUrl(movie)}`;

  const genreNames = (movie.genres ?? [])
    .map((id) => genres[id]?.name)
    .filter(Boolean);

  const directors = (movie.directors ?? [])
    .map((id) => people[id]?.name)
    .filter(Boolean)
    .map((name) => ({ "@type": "Person", name }));

  const actors = (movie.actors ?? [])
    .slice(0, 5)
    .map((id) => people[id]?.name)
    .filter(Boolean)
    .map((name) => ({ "@type": "Person", name }));

  const sameAs = [
    movie.imdb?.url,
    movie.letterboxd?.url,
    movie.metacritic?.url,
    movie.rottenTomatoes?.url,
  ].filter(Boolean);

  const movieJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Movie",
    name: movie.title,
    url: movieUrl,
    ...(movie.overview && { description: movie.overview }),
    ...(movie.posterPath && {
      image: `https://image.tmdb.org/t/p/w500${movie.posterPath}`,
    }),
    ...((movie.releaseDate || movie.year) && {
      datePublished: movie.releaseDate ?? movie.year,
    }),
    ...(movie.duration && {
      duration: (() => {
        const totalMinutes = Math.floor(movie.duration / 1000 / 60);
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return h > 0 && m > 0 ? `PT${h}H${m}M` : h > 0 ? `PT${h}H` : `PT${m}M`;
      })(),
    }),
    ...(movie.classification &&
      movie.classification !== "Unknown" && {
        contentRating: movie.classification,
      }),
    ...(genreNames.length > 0 && { genre: genreNames }),
    ...(directors.length > 0 && { director: directors }),
    ...(actors.length > 0 && { actor: actors }),
    ...(sameAs.length > 0 && { sameAs }),
    ...(movie.imdb?.rating != null &&
      movie.imdb.reviews > 0 && {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: movie.imdb.rating,
          bestRating: 10,
          worstRating: 1,
          ratingCount: movie.imdb.reviews,
        },
      }),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://clusterflick.com",
      },
      { "@type": "ListItem", position: 2, name: movie.title, item: movieUrl },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([movieJsonLd, breadcrumbJsonLd]),
        }}
      />
      <PageContent
        movie={movieWithoutPerformances}
        genres={genres}
        people={people}
        venues={venues}
        containingEvents={containingEventsWithoutPerformances}
      />
    </>
  );
}
