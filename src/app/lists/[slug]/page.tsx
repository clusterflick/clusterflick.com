import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStaticData } from "@/utils/get-static-data";
import { getMovieListUrl } from "@/utils/get-movie-list-url";
import { getMovieListImagePath } from "@/utils/get-movie-list-image";
import { getMovieListFilms } from "@/utils/get-movie-list-movies";
import {
  MOVIE_LISTS,
  findMovieList,
  isRanked,
  type MovieList,
} from "@/data/movie-lists";
import ListDetailPageContent from "./page-content";

export const dynamicParams = false;

export function generateStaticParams() {
  return MOVIE_LISTS.flatMap((list) => [
    { slug: list.id },
    ...list.aliases.map((alias) => ({ slug: alias })),
  ]);
}

function buildDescription(list: MovieList, movieCount: number): string {
  const filmWord = movieCount === 1 ? "film" : "films";

  if (movieCount > 0) {
    return `${list.description} ${movieCount} ${filmWord} from the list showing in London cinemas — find screenings and book tickets.`;
  }

  return `${list.description} Nothing from the list is showing in London right now — check back soon.`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resolved = findMovieList(slug);

  if (!resolved) {
    return { title: "List Not Found" };
  }

  const { list } = resolved;
  const data = await getStaticData();
  const movieCount = getMovieListFilms(list, data.movies).length;

  const description = buildDescription(list, movieCount);
  const canonicalUrl = getMovieListUrl(list);

  return {
    title: list.name,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${list.name} | Clusterflick`,
      description,
      url: `https://clusterflick.com${canonicalUrl}`,
      siteName: "Clusterflick",
    },
    twitter: {
      card: "summary",
      title: `${list.name} | Clusterflick`,
      description,
      creator: "@clusterflick",
    },
  };
}

export default async function MovieListDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const resolved = findMovieList(slug);

  if (!resolved) {
    notFound();
  }

  const { list, isAlias } = resolved;
  const canonicalUrl = getMovieListUrl(list);

  const data = await getStaticData();
  const films = getMovieListFilms(list, data.movies);

  const performanceCount = films.reduce(
    (total, film) => total + film.performanceCount,
    0,
  );

  const listJsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: list.name,
      description: buildDescription(list, films.length),
      url: `https://clusterflick.com${canonicalUrl}`,
      isBasedOn: list.sourceUrl,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: films.length,
        itemListElement: films.map((film, index) => ({
          "@type": "ListItem",
          position: film.rank ?? index + 1,
          item: {
            "@type": "Movie",
            name: film.movie.title,
          },
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://clusterflick.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Film Lists",
          item: "https://clusterflick.com/lists",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: list.name,
          item: `https://clusterflick.com${canonicalUrl}`,
        },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(listJsonLd) }}
      />
      <ListDetailPageContent
        name={list.name}
        description={list.description}
        sourceName={list.sourceName}
        sourceUrl={list.sourceUrl}
        imagePath={getMovieListImagePath(list.id)}
        criteria={list.kind === "computed" ? list.criteria : undefined}
        totalEntries={list.kind === "curated" ? list.entries.length : undefined}
        filmBadge={list.filmBadge}
        films={films.map(({ movie, rank }) => ({ movie, rank }))}
        performanceCount={performanceCount}
        ranked={isRanked(list)}
        isAlias={isAlias}
        canonicalUrl={canonicalUrl}
      />
    </>
  );
}
