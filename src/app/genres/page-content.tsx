import Link from "next/link";
import EventCard from "@/components/event-card";
import ProgrammeCard from "@/components/programme-card";
import StandardPageLayout from "@/components/standard-page-layout";
import type { GenreListItem } from "./page";
import styles from "./page.module.css";

/**
 * The description's first sentence. The rest is written for search ("Find
 * horror films showing across London…") and says nothing a card's posters
 * and count don't, while crowding out the line that sets the genre's tone.
 */
function getLede(description: string): string {
  return description.split(/(?<=[.!?])\s/)[0];
}

interface GenresPageContentProps {
  genres: GenreListItem[];
}

export default function GenresPageContent({ genres }: GenresPageContentProps) {
  const showingGenres = genres.filter((g) => g.movieCount > 0);
  const emptyGenres = genres.filter((g) => g.movieCount === 0);
  const showingCount = showingGenres.length;

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
    >
      <p className={styles.intro}>
        Every film showing across London, sorted into {genres.length} genres —
        from {genreLink("horror")} and {genreLink("comedy")} to{" "}
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
      {showingGenres.length > 0 && (
        <ul className={styles.genreGrid}>
          {showingGenres.map((genre) => (
            <li key={genre.id}>
              <ProgrammeCard
                href={genre.href}
                name={`${genre.name} Films`}
                imagePath={genre.imagePath}
                description={getLede(genre.seoDescription)}
                posters={genre.posters}
                meta={
                  <span className={styles.filmCount}>
                    {genre.movieCount.toLocaleString("en-GB")}{" "}
                    {genre.movieCount === 1 ? "film" : "films"} showing
                  </span>
                }
              />
            </li>
          ))}
        </ul>
      )}
      {emptyGenres.length > 0 && (
        <section className={styles.section} aria-labelledby="empty-genres">
          <h2 id="empty-genres" className={styles.sectionHeading}>
            Nothing showing right now
          </h2>
          <ul className={styles.genreGrid}>
            {emptyGenres.map((genre) => (
              <li key={genre.id}>
                <EventCard
                  href={genre.href}
                  name={`${genre.name} Films`}
                  imagePath={genre.imagePath}
                  description={getLede(genre.seoDescription)}
                  meta={
                    <span className={styles.noFilms}>
                      No films currently showing
                    </span>
                  }
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </StandardPageLayout>
  );
}
