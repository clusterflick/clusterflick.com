import { ReactNode } from "react";
import { Movie } from "@/types";
import LinkCard, {
  CardLabel,
  CardValue,
  CardSubtext,
} from "@/components/link-card";
import CardGrid from "@/components/card-grid";
import { useCinemaData } from "@/state/cinema-data-context";
import styles from "./ratings-grid.module.css";

interface RatingsGridProps {
  imdb: Movie["imdb"];
  letterboxd: Movie["letterboxd"];
  moviedb: Movie["moviedb"];
  rottenTomatoes: Movie["rottenTomatoes"];
  metacritic: Movie["metacritic"];
  extraItem?: ReactNode;
}

export default function RatingsGrid({
  imdb,
  letterboxd,
  moviedb,
  rottenTomatoes,
  metacritic,
  extraItem,
}: RatingsGridProps) {
  const { hydrateUrl } = useCinemaData();
  // Treat a 0 score as "no score" — Metacritic returns 0 for the user score
  // when there are too few audience reviews to be meaningful.
  const hasMetacriticCritics = Boolean(metacritic?.critics?.rating);
  const hasMetacriticAudience = Boolean(metacritic?.audience?.rating);
  const hasRatings =
    (imdb && imdb.rating !== null) ||
    (letterboxd && letterboxd.rating) ||
    (moviedb && moviedb.reviews > 0) ||
    (rottenTomatoes && rottenTomatoes.critics.all?.score) ||
    hasMetacriticCritics ||
    hasMetacriticAudience;

  if (!hasRatings) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.ratingsWrapper}>
        <CardGrid size="md" className={styles.ratingsGrid}>
          {imdb && imdb.rating !== null && (
            <LinkCard href={hydrateUrl(imdb.url)} variant="rating">
              <CardLabel>IMDb</CardLabel>
              <CardValue>
                {imdb.rating.toFixed(1)}
                <span className={styles.suffix}> /10</span>
              </CardValue>
              <CardSubtext>
                {imdb.reviews.toLocaleString("en-GB")} reviews
              </CardSubtext>
            </LinkCard>
          )}

          {letterboxd && letterboxd.rating && (
            <LinkCard href={hydrateUrl(letterboxd.url)} variant="rating">
              <CardLabel>Letterboxd</CardLabel>
              <CardValue>
                {letterboxd.rating.toFixed(1)}
                <span className={styles.suffix}> /5</span>
              </CardValue>
              <CardSubtext>
                {letterboxd.reviews.toLocaleString("en-GB")} reviews
              </CardSubtext>
            </LinkCard>
          )}

          {moviedb && moviedb.reviews > 0 && (
            <LinkCard href={hydrateUrl(moviedb.url)} variant="rating">
              <CardLabel>TMDB</CardLabel>
              <CardValue>
                {Math.round(moviedb.rating * 10)}
                <span className={styles.suffix}>%</span>
              </CardValue>
              <CardSubtext>
                {moviedb.reviews.toLocaleString("en-GB")} reviews
              </CardSubtext>
            </LinkCard>
          )}

          {rottenTomatoes && rottenTomatoes.critics.all?.score && (
            <LinkCard href={hydrateUrl(rottenTomatoes.url)} variant="rating">
              <CardLabel>Rotten Tomatoes</CardLabel>
              <CardValue>
                <div className={styles.ratingsSpacing}>
                  <span>{rottenTomatoes.critics.all.score}%</span>
                  {rottenTomatoes.audience.all?.score && (
                    <span className={styles.audienceRatingsScore}>
                      {rottenTomatoes.audience.all.score}%
                    </span>
                  )}
                </div>
              </CardValue>
              <CardSubtext>
                <div className={styles.ratingsSpacing}>
                  <span>Critics</span>
                  {rottenTomatoes.audience.all?.score && <span>Audience</span>}
                </div>
              </CardSubtext>
            </LinkCard>
          )}

          {metacritic && (hasMetacriticCritics || hasMetacriticAudience) && (
            <LinkCard href={hydrateUrl(metacritic.url)} variant="rating">
              <CardLabel>Metacritic</CardLabel>
              <CardValue>
                <div className={styles.ratingsSpacing}>
                  {metacritic.critics.rating ? (
                    <span>{metacritic.critics.rating}</span>
                  ) : null}
                  {metacritic.audience.rating ? (
                    <span
                      className={
                        hasMetacriticCritics
                          ? styles.audienceRatingsScore
                          : undefined
                      }
                    >
                      {metacritic.audience.rating.toFixed(1)}
                    </span>
                  ) : null}
                </div>
              </CardValue>
              <CardSubtext>
                <div className={styles.ratingsSpacing}>
                  {hasMetacriticCritics && <span>Critics</span>}
                  {hasMetacriticAudience && <span>Audience</span>}
                </div>
              </CardSubtext>
            </LinkCard>
          )}
        </CardGrid>
      </div>

      {extraItem && <div className={styles.extraItem}>{extraItem}</div>}
    </div>
  );
}
