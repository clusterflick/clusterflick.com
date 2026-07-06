import Link from "next/link";
import EventCard from "@/components/event-card";
import StandardPageLayout from "@/components/standard-page-layout";
import type { GenreListItem } from "./page";
import styles from "./page.module.css";

interface GenresPageContentProps {
  genres: GenreListItem[];
}

export default function GenresPageContent({ genres }: GenresPageContentProps) {
  const showingCount = genres.filter((g) => g.movieCount > 0).length;

  // Rank by how many films are currently showing to surface the busiest genres
  // in the intro.
  const byPopularity = [...genres].sort((a, b) => b.movieCount - a.movieCount);
  const [first, second, third] = byPopularity;
  const hasShowings = first && first.movieCount > 0;

  // Link genre names mentioned in the intro to their pages, resolving the href
  // by (case-insensitive) genre name.
  const hrefByName = new Map(genres.map((g) => [g.name.toLowerCase(), g.href]));
  const genreLink = (text: string) => {
    const href = hrefByName.get(text.toLowerCase());
    return href ? <Link href={href}>{text}</Link> : <>{text}</>;
  };

  return (
    <StandardPageLayout
      title="Genres"
      subtitle={`${genres.length} genres · ${showingCount} showing now`}
      backUrl="/films"
      backText="Back to film list"
    >
      <p className={styles.intro}>
        Clusterflick sorts every film showing across London into {genres.length}{" "}
        genres — from {genreLink("horror")} and {genreLink("comedy")} to{" "}
        {genreLink("documentary")} and {genreLink("science fiction")}.
        {hasShowings && (
          <>
            {" "}
            Right now, <strong>{genreLink(first.name)}</strong> has the most on
            with {first.movieCount.toLocaleString("en-GB")}{" "}
            {first.movieCount === 1 ? "film" : "films"} screening
            {second && second.movieCount > 0 && (
              <>
                , followed by {genreLink(second.name)}
                {third && third.movieCount > 0 && (
                  <> and {genreLink(third.name)}</>
                )}
              </>
            )}
            .
          </>
        )}{" "}
        Pick a genre to see what&apos;s currently screening and where.
      </p>
      <ul className={styles.genreGrid}>
        {genres.map((genre) => (
          <li key={genre.id}>
            <EventCard
              href={genre.href}
              name={`${genre.name} Films`}
              imagePath={genre.imagePath}
              description={genre.seoDescription}
              meta={
                <span className={styles.filmCount}>
                  {genre.movieCount > 0
                    ? `${genre.movieCount.toLocaleString("en-GB")} ${
                        genre.movieCount === 1 ? "film" : "films"
                      } showing`
                    : "Nothing showing right now"}
                </span>
              }
            />
          </li>
        ))}
      </ul>
    </StandardPageLayout>
  );
}
