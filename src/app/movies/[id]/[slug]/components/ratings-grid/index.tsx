import { Movie } from "@/types";
import LinkCard, {
  CardLabel,
  CardValue,
  CardSubtext,
} from "@/components/link-card";
import CardGrid from "@/components/card-grid";
import { TickIcon, CrossIcon } from "@/components/icons";
import { useCinemaData } from "@/state/cinema-data-context";
import styles from "./ratings-grid.module.css";

interface RatingsGridProps {
  bechdel: Movie["bechdel"];
  imdb: Movie["imdb"];
  letterboxd: Movie["letterboxd"];
  moviedb: Movie["moviedb"];
  rottenTomatoes: Movie["rottenTomatoes"];
  metacritic: Movie["metacritic"];
}

export default function RatingsGrid({
  bechdel,
  imdb,
  letterboxd,
  moviedb,
  rottenTomatoes,
  metacritic,
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
    hasMetacriticAudience ||
    Boolean(bechdel);

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

          {/* Trails the scores deliberately: a pass/fail verdict is a
              different kind of thing from a rating out of 10, so it reads
              better after them than interleaved. Absence of a card means the
              film isn't on the list, which is the common case — the list is
              crowd-sourced and covers under half our films — so nothing is
              rendered to stand in for "not rated". */}
          {bechdel && (
            <LinkCard
              href={hydrateUrl(bechdel.url)}
              variant="rating"
              // The verdict is carried by a tick or cross, so it has to be
              // spelled out here - "1 of 3 criteria" only implies it. The rest
              // repeats the visible text verbatim, parentheses included, so
              // the accessible name still contains the label a speech-input
              // user would read off the card.
              aria-label={`Bechdel Test: ${bechdel.passes ? "passes" : "fails"}, ${bechdel.rating} of 3 criteria${bechdel.dubious ? " (disputed)" : ""}`}
            >
              <CardLabel>Bechdel Test</CardLabel>
              <CardValue>
                <span
                  className={
                    bechdel.passes ? styles.bechdelPass : styles.bechdelFail
                  }
                >
                  {bechdel.passes ? (
                    <TickIcon size={28} />
                  ) : (
                    <CrossIcon size={28} />
                  )}
                </span>
              </CardValue>
              <CardSubtext>
                {bechdel.rating} of 3 criteria
                {bechdel.dubious && " (disputed)"}
              </CardSubtext>
            </LinkCard>
          )}
        </CardGrid>
      </div>
    </div>
  );
}
