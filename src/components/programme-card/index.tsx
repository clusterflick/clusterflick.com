import { type ReactNode } from "react";
import Image from "next/image";
import NavCard from "@/components/nav-card";
import MoviePoster from "@/components/movie-poster";
import styles from "./programme-card.module.css";

export interface ProgrammeCardPoster {
  title: string;
  posterPath?: string;
}

export interface ProgrammeCardProps {
  href: string;
  name: string;
  imagePath: string | null;
  description: string | null;
  /** A few films from the programme, soonest first. */
  posters: ProgrammeCardPoster[];
  /** The next screening, already formatted: `{ title: "Possession", when: "Sat 10 Oct" }`. */
  next?: { title: string; when: string } | null;
  /** Bottom meta row — caller provides domain-specific content (dates, film count, etc.) */
  meta: ReactNode;
}

/**
 * A card for a festival, film club or film list that is showing something:
 * its logo and name, a fan of posters from what's on, and the next screening.
 * The posters are what make the card read as a programme rather than a name —
 * every other way into films on the site leads with a poster.
 *
 * **When to use:**
 * - Index pages for festivals, film clubs and film lists, for the entries that
 *   have films showing.
 *
 * **When NOT to use:**
 * - An entry with nothing showing — there are no posters to show, so use
 *   `EventCard`, or a `LinkGrid` of names when there are many.
 * - Venues — use `VenueCard`. Single films — use `FilmPosterGrid`.
 */
export default function ProgrammeCard({
  href,
  name,
  imagePath,
  description,
  posters,
  next,
  meta,
}: ProgrammeCardProps) {
  return (
    <NavCard href={href} className={styles.card}>
      <div className={styles.header}>
        <div className={styles.logo}>
          {imagePath ? (
            <Image
              src={imagePath}
              alt=""
              width={56}
              height={56}
              className={styles.logoImage}
            />
          ) : (
            <div className={styles.logoPlaceholder} />
          )}
        </div>
        <div className={styles.name} data-testid="programme-card-name">
          {name}
        </div>
      </div>

      {posters.length > 0 && (
        // Decorative: the films are named on the programme's own page, and
        // reading four titles out as part of the link's name would bury it.
        <div className={styles.posters} aria-hidden="true">
          {posters.map((poster, index) => (
            <div
              key={`${poster.title}-${index}`}
              className={styles.poster}
              style={{ zIndex: posters.length - index }}
            >
              <MoviePoster
                posterPath={poster.posterPath}
                title={poster.title}
                size="xsmall"
                interactive={false}
              />
            </div>
          ))}
        </div>
      )}

      {description && (
        <p className={styles.description}>
          {description.charAt(0).toUpperCase() + description.slice(1)}
        </p>
      )}

      <div className={styles.footer}>
        {next && (
          <p className={styles.next}>
            <span className={styles.nextLabel}>Next</span>{" "}
            <span className={styles.nextTitle}>{next.title}</span>{" "}
            <span className={styles.nextWhen}>· {next.when}</span>
          </p>
        )}
        <div className={styles.meta}>{meta}</div>
      </div>
    </NavCard>
  );
}
