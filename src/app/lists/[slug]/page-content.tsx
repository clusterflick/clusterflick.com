import type { CSSProperties } from "react";
import Image from "next/image";
import StandardPageLayout from "@/components/standard-page-layout";
import DetailPageHero from "@/components/detail-page-hero";
import EmptyState from "@/components/empty-state";
import CanonicalRedirect from "@/components/canonical-redirect";
import FilmPosterGrid from "@/components/film-poster-grid";
import type { Movie } from "@/types";
import type { MovieList } from "@/data/movie-lists";
import styles from "./page.module.css";

export type ListFilm = {
  movie: Movie;
  /** Published position in the list, for ranked lists. */
  rank?: number;
};

interface ListDetailPageContentProps {
  name: string;
  description: string;
  sourceName: string;
  sourceUrl: string;
  /** Logo from `public/images/movie-lists/<id>.*`, if one has been added. */
  imagePath: string | null;
  /** The rule a film has to clear, for lists we compute ourselves. */
  criteria?: string;
  /** How many films the published list holds, for curated lists. */
  totalEntries?: number;
  /** Emblem drawn on every poster, for lists where membership is the award. */
  filmBadge?: MovieList["filmBadge"];
  films: ListFilm[];
  performanceCount: number;
  ranked: boolean;
  isAlias: boolean;
  canonicalUrl: string;
}

export default function ListDetailPageContent({
  name,
  description,
  sourceName,
  sourceUrl,
  imagePath,
  criteria,
  totalEntries,
  filmBadge,
  films,
  performanceCount,
  ranked,
  isAlias,
  canonicalUrl,
}: ListDetailPageContentProps) {
  const showingCount = films.length;
  const countLabel =
    showingCount === 1 ? "one film" : `${showingCount.toLocaleString()} films`;
  const sourceLink = (
    <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
      {sourceName}
    </a>
  );

  return (
    <>
      {isAlias && <CanonicalRedirect canonicalUrl={canonicalUrl} />}
      <StandardPageLayout
        hero={
          <DetailPageHero
            name={name}
            movieCount={showingCount}
            performanceCount={performanceCount}
          />
        }
        backUrl="/lists"
        backText="All film lists"
        afterContent={
          showingCount > 0 ? (
            // Emblem spacing is per-badge, set here because every film on the
            // page belongs to the same list; the grid inherits both values.
            <div
              style={
                {
                  "--emblem-inset-right": `${filmBadge?.insetRight ?? 5}px`,
                  "--emblem-inset-bottom": `${filmBadge?.insetBottom ?? 5}px`,
                  "--emblem-blur": `${filmBadge?.shadowBlur ?? 3}px`,
                } as CSSProperties
              }
            >
              <FilmPosterGrid
                showAll
                movies={films.map(({ movie, rank }) => ({
                  movie,
                  performanceCount: movie.performances.length,
                  badge:
                    rank != null ? (
                      `#${rank}`
                    ) : filmBadge ? (
                      <Image
                        src={filmBadge.src}
                        alt={filmBadge.alt}
                        width={filmBadge.width}
                        height={filmBadge.height}
                      />
                    ) : undefined,
                  badgeVariant:
                    rank == null && filmBadge ? ("icon" as const) : undefined,
                }))}
              />
            </div>
          ) : undefined
        }
      >
        <div className={styles.intro}>
          {imagePath && (
            <Image
              src={imagePath}
              alt={`${sourceName} logo`}
              width={120}
              height={120}
              className={styles.logo}
            />
          )}
          <div className={styles.introText}>
            <p className={styles.about}>
              {description}{" "}
              {criteria ? (
                <>
                  A film makes the list with {criteria} Scores come from{" "}
                  {sourceLink}.
                </>
              ) : (
                <>
                  {totalEntries
                    ? `The list of ${totalEntries} films was`
                    : "It was"}{" "}
                  chosen and published by {sourceLink}, where you can read the
                  write-up for each one.
                </>
              )}{" "}
              {showingCount > 0 && (
                <>
                  Find below the {countLabel} from this list you can see in a
                  London cinema right now
                  {criteria
                    ? ", most-reviewed first"
                    : ranked
                      ? ", in the order they were ranked"
                      : ""}
                  !
                </>
              )}
            </p>
          </div>
        </div>

        {showingCount === 0 && (
          <div className={styles.empty}>
            <EmptyState
              icon={{
                src: "/images/icons/neon-ticket-ripped.svg",
                width: 120,
                height: 80,
              }}
              message="Nothing from this list is showing right now"
              hint="Check back soon — London's repertory cinemas rotate their programmes weekly"
            />
          </div>
        )}
      </StandardPageLayout>
    </>
  );
}
