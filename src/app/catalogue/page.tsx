import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PageWrapper from "@/components/page-wrapper";
import { getStaticData } from "@/utils/get-static-data";
import { getMovieUrl } from "@/utils/get-movie-url";
import {
  getPrimaryCategory,
  DEFAULT_CATEGORIES,
} from "@/lib/filters/modules/categories";
import { getLondonMidnightTimestamp, MS_PER_DAY } from "@/utils/format-date";
import PageContent from "./page-content";
import SSROnly from "../ssr-only";
import styles from "./page.module.css";

const PAGE_TITLE =
  "Every Film Showing in London — Search London Cinema Listings";
const PAGE_DESCRIPTION =
  "Compare screenings across London cinemas and find your perfect movie night. Whether you're chasing new releases or cult classics, see what's on, where, and when.";

// How many films to bake into the static HTML.
const STATIC_MOVIE_LIMIT = 72;
// How many to name in the ItemList. Matches the cap the genre, format and
// collection pages use, so every film-listing page describes itself the same
// way; `numberOfItems` still reports the real total, as it does there.
const JSON_LD_ITEM_LIMIT = 50;

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: "/catalogue",
  },
};

export default async function FilmsPage() {
  const data = await getStaticData();

  // Apply the same default filters as the client so SSR output matches hydrated content
  const defaultCategories = new Set(DEFAULT_CATEGORIES);
  const todayMidnight = getLondonMidnightTimestamp();
  const rangeStart = todayMidnight;
  const rangeEnd = todayMidnight + 8 * MS_PER_DAY; // 7-day range, end is exclusive (midnight + 1 day)

  const matchingMovies = Object.values(data.movies)
    .filter((movie) => {
      // Category filter: only default categories
      if (!defaultCategories.has(getPrimaryCategory(movie))) return false;
      // Date range filter: must have at least one performance in range
      return movie.performances.some(
        (p) => p.time >= rangeStart && p.time < rangeEnd,
      );
    })
    .sort((a, b) => a.normalizedTitle.localeCompare(b.normalizedTitle));

  const staticMovies = matchingMovies.slice(0, STATIC_MOVIE_LIMIT);

  const canonicalUrl = "https://clusterflick.com/catalogue";
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      url: canonicalUrl,
      isPartOf: {
        "@type": "WebSite",
        name: "Clusterflick",
        url: "https://clusterflick.com",
      },
      ...(matchingMovies.length > 0 && {
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: matchingMovies.length,
          itemListElement: matchingMovies
            .slice(0, JSON_LD_ITEM_LIMIT)
            .map((movie, index) => ({
              "@type": "ListItem",
              position: index + 1,
              url: `https://clusterflick.com${getMovieUrl(movie)}`,
              name: movie.title,
            })),
        },
      }),
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
          name: "Films",
          item: canonicalUrl,
        },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageWrapper className={styles.page}>
        <PageContent />
        <SSROnly>
          <section className={styles.staticMovies}>
            <h1 className={styles.staticHeading}>
              Every Film Showing in London
            </h1>
            <div className={styles.staticGrid}>
              {staticMovies.map((movie) => {
                const posterPath =
                  movie.posterPath ||
                  movie.includedMovies?.find((m) => m.posterPath)?.posterPath;
                return (
                  <Link
                    key={movie.id}
                    href={getMovieUrl(movie)}
                    className={styles.staticMovieLink}
                  >
                    {posterPath && (
                      <Image
                        src={`https://image.tmdb.org/t/p/w200${posterPath}`}
                        alt={movie.title}
                        width={150}
                        height={225}
                        className={styles.staticPoster}
                      />
                    )}
                    <span className={styles.staticTitle}>
                      {movie.title}
                      {movie.year && (
                        <span className={styles.staticYear}>{movie.year}</span>
                      )}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        </SSROnly>
      </PageWrapper>
    </>
  );
}
