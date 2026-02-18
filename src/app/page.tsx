import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import slugify from "@sindresorhus/slugify";
import PageWrapper from "@/components/page-wrapper";
import { getStaticData } from "@/utils/get-static-data";
import { getPrimaryCategory } from "@/lib/filters/modules/categories";
import { Category } from "@/types";
import { getLondonMidnightTimestamp, MS_PER_DAY } from "@/utils/format-date";
import IntroSection from "./intro-section";
import PageContent from "./page-content";
import SSROnly from "./ssr-only";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Every Film Showing in London — Search London Cinema Listings",
  description:
    "Compare screenings across London cinemas and find your perfect movie night. Whether you're chasing new releases or cult classics, see what's on, where, and when.",
  alternates: {
    canonical: "/",
  },
};

export default async function Home() {
  const data = await getStaticData();

  // Apply the same default filters as the client so SSR output matches hydrated content
  const defaultCategories = new Set([
    Category.Movie,
    Category.MultipleMovies,
    Category.Shorts,
  ]);
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
    .slice(0, 30);

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
        <IntroSection
          heading={
            <h1>
              Every Film Showing in London &mdash; Search London Cinema Listings
            </h1>
          }
          signOff={
            <p className={styles.signOff}>
              We hope you enjoy the site! Any questions?{" "}
              <Link href="/about">Please get in touch</Link> &mdash; Your
              friends at{" "}
              <span className={styles.textWithIcon}>
                Clusterflick
                <Image
                  src="/images/icon.svg"
                  alt="Clusterflick"
                  width={20}
                  height={20}
                />
              </span>
            </p>
          }
        >
          <p>
            Welcome to Clusterflick 👋 &mdash; Find every film showing across
            London, all in one place. From blockbusters at Picturehouses and
            Everyman, to independent gems at BFI, Genesis Cinema, and Prince
            Charles Cinema (and more, there&apos;s way too many venues to name
            them all!)
            <br />
            We&apos;re currently tracking over 1,000 films showing across{" "}
            <Link href="/venues">London&apos;s 240+ venues</Link>.
          </p>
          <p>
            With so much to choose from, use the menu at the top to filter for
            the showings you&apos;re looking for. We&apos;ve started you off
            with{" "}
            <span className={styles.filterHighlight}>
              Films, Multiple Films & Short Film
            </span>
            {" • "}
            <span className={styles.filterHighlight}>At all Venues</span>
            {" • "}
            <span className={styles.filterHighlight}>
              Showing in Next 7 Days
            </span>{" "}
            but that&apos;s just the start of your discovery journey. Jump in!
            🍿
          </p>
          <p>
            Compare showtimes, find screenings, discover late-night films, and
            book tickets all from one page. No more checking dozens of cinema
            websites ❤️
          </p>
        </IntroSection>
        <PageContent />
        <SSROnly>
          <section className={styles.staticMovies}>
            <h2
              style={{
                marginTop: -49,
                textAlign: "center",
                color: "var(--color-black)",
              }}
            >
              Films Showing in London
            </h2>
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
