import PosterRow from "@/components/poster-row";
import CollectionRow from "@/components/collection-row";
import OccasionRow, { type OccasionRowItem } from "@/components/occasion-row";
import type { Venue } from "@/types";
import { getMovieUrl, SHOW_ALL_HASH } from "@/utils/get-movie-url";
import { formatDayAndDate, formatShowingTime } from "@/utils/format-date";
import {
  getMarathonsUrl,
  HIGHLY_RATED,
  type DiscoveryRows,
  type ScoredMovie,
} from "@/utils/get-discovery-movies";
import { getHighlyRatedUrl } from "@/lib/filters/modules/ratings";
import styles from "./page.module.css";

/**
 * Presentational render of the discovery rows. Universal (no client hooks), so
 * it's used both for the SSR fallback (build-time data) and the client refresh
 * (view-time data) — see DiscoverySections.
 */
/** The occasions as cards that lead with the occasion rather than the film. */
function getOccasionItems(
  occasions: ScoredMovie[],
  venues: Record<string, Pick<Venue, "name">> | undefined,
): OccasionRowItem[] {
  return occasions
    .filter((scored) => scored.occasion)
    .map(({ movie, occasion }) => ({
      id: movie.id,
      href: `${getMovieUrl(movie)}${SHOW_ALL_HASH}`,
      title: movie.title,
      posterPath:
        movie.posterPath ??
        movie.includedMovies?.find((included) => included.posterPath)
          ?.posterPath,
      occasion: occasion!.label,
      when: `${formatDayAndDate(occasion!.time)}, ${formatShowingTime(occasion!.time)}`,
      venue: venues?.[occasion!.venueId]?.name ?? null,
    }));
}

export default function DiscoveryRowsView({
  rows,
  venues,
}: {
  rows: DiscoveryRows;
  /** Names the venue on each occasion card. */
  venues?: Record<string, Pick<Venue, "name">>;
}) {
  const {
    popular,
    highlyRated,
    newAdditions,
    lastChance,
    marathons,
    occasions,
    collections,
  } = rows;
  const hasNewAdditions =
    newAdditions.newReleases.length +
      newAdditions.returning.length +
      newAdditions.classics.length >
    0;

  return (
    <>
      <PosterRow
        title="Showing Across London"
        intro="The films showing most widely across the city this week."
        movies={popular}
      />

      {/* Named for what the films are, not where the score comes from, so
          the source can change without the heading. */}
      <PosterRow
        title="Highly Rated"
        intro="The best-reviewed films showing this week."
        movies={highlyRated}
        showAll
        seeAllHref={getHighlyRatedUrl(HIGHLY_RATED.filterId)}
      />

      <OccasionRow
        title="More Than a Screening"
        intro="Q&As, live scores and premieres — nights you can't catch on another date."
        items={getOccasionItems(occasions, venues)}
      />

      <CollectionRow
        title="Sagas & Series"
        intro="Franchises with more than one instalment showing this week."
        collections={collections}
        seeAllHref="/collections"
      />

      <PosterRow
        title="Marathons & Double Bills"
        intro="Multi-film events and double bills showing this week."
        movies={marathons}
        showAll
        seeAllHref={getMarathonsUrl()}
      />

      {hasNewAdditions && (
        <section className={styles.group}>
          <h2 className={styles.groupTitle}>New Additions</h2>
          <p className={styles.groupIntro}>
            Screenings added in the past week.
          </p>
          <PosterRow
            title="New releases just added"
            titleAs="h3"
            movies={newAdditions.newReleases}
            showAll
          />
          <PosterRow
            title="Back on the big screen"
            titleAs="h3"
            movies={newAdditions.returning}
            showAll
          />
          <PosterRow
            title="Classics just added"
            titleAs="h3"
            movies={newAdditions.classics}
            showAll
          />
        </section>
      )}

      <PosterRow
        title="Last Chance"
        intro="Films with their final showing coming up soon!"
        movies={lastChance}
        showAll
      />
    </>
  );
}
