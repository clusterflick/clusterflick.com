import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import slugify from "@sindresorhus/slugify";
import PageWrapper from "@/components/page-wrapper";
import { getStaticData } from "@/utils/get-static-data";
import {
  getPrimaryCategory,
  DEFAULT_CATEGORIES,
} from "@/lib/filters/modules/categories";
import { getLondonMidnightTimestamp, MS_PER_DAY } from "@/utils/format-date";
import PageContent from "./page-content";
import SSROnly from "../ssr-only";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Every Film Showing in London — Search London Cinema Listings",
  description:
    "Compare screenings across London cinemas and find your perfect movie night. Whether you're chasing new releases or cult classics, see what's on, where, and when.",
  alternates: {
    canonical: "/films",
  },
};

export default async function FilmsPage() {
  const data = await getStaticData();

  // Apply the same default filters as the client so SSR output matches hydrated content
  const defaultCategories = new Set(DEFAULT_CATEGORIES);
  const todayMidnight = getLondonMidnightTimestamp();
  const rangeStart = todayMidnight;
  const rangeEnd = todayMidnight + 8 * MS_PER_DAY; // 7-day range, end is exclusive (midnight + 1 day)

  const staticMovies = Object.values(data.movies)
    .filter((movie) => {
      // Category filter: only default categories
      if (!defaultCategories.has(getPrimaryCategory(movie))) return false;
      // Date range filter: must have at least one performance in range
      return movie.performances.some(
        (p) => p.time >= rangeStart && p.time < rangeEnd,
      );
    })
    .sort((a, b) => a.normalizedTitle.localeCompare(b.normalizedTitle))
    .slice(0, 72);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Clusterflick",
            description: "Every London cinema listing in one place",
            url: "https://clusterflick.com",
          }),
        }}
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
                    href={`/movies/${movie.id}/${slugify(movie.title)}`}
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
