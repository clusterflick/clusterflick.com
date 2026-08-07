import type { Collection, Movie } from "@/types";
import type { FilmPosterGridMovie } from "@/components/film-poster-grid";
import EventDetailPageContent, {
  type EventVenueItem,
} from "@/components/event-detail-page-content";
import ContentSection from "@/components/content-section";
import FilmPosterGrid from "@/components/film-poster-grid";
import styles from "./page.module.css";

interface CollectionDetailPageContentProps {
  collection: Collection;
  canonicalUrl: string;
  /** Every film in the collection, in release order; the unavailable ones dimmed. */
  gridMovies: FilmPosterGridMovie[];
  /** Marathons and double bills drawing on this collection. */
  containingEvents: { movie: Movie; performanceCount: number }[];
  showingCount: number;
  performanceCount: number;
  heroBackgroundImage?: string;
  venues: EventVenueItem[];
}

export default function CollectionDetailPageContent({
  collection,
  canonicalUrl,
  gridMovies,
  containingEvents,
  showingCount,
  performanceCount,
  heroBackgroundImage,
  venues,
}: CollectionDetailPageContentProps) {
  const heroBlurb = collection.overview ? (
    <div className={styles.heroBlurb}>
      <p>{collection.overview}</p>
    </div>
  ) : undefined;

  // Same wording as the movie pages use for the same relationship, so a reader
  // meets one idea rather than two. FilmPosterGrid picks StackedPoster for
  // multi-film entries on its own, so these read as events, not single films.
  const eventsSection =
    containingEvents.length > 0 ? (
      <ContentSection
        title="Also Showing As Part Of"
        as="h2"
        className={styles.eventsSection}
      >
        <FilmPosterGrid movies={containingEvents} showAll />
      </ContentSection>
    ) : null;

  return (
    <EventDetailPageContent
      name={collection.name}
      url=""
      imagePath={null}
      movieCount={showingCount}
      performanceCount={performanceCount}
      backUrl="/collections"
      backText="All collections"
      gridMovies={gridMovies}
      Blurb={null}
      heroChildren={heroBlurb}
      venuesLayout="grid"
      // The films are the point of the page: someone arriving at a collection
      // wants to know which instalments they can see, not which cinemas are
      // involved. Venues follow the grid.
      secondaryContentPlacement="after-films"
      isAlias={false}
      canonicalUrl={canonicalUrl}
      venues={venues}
      cinemasSectionTitle={`Cinemas showing ${collection.name} films`}
      filmsSectionTitle={`${collection.name} Films Showing in London`}
      filmsExploreLabel="Or start exploring all films"
      heroBackgroundImage={heroBackgroundImage}
      heroBackgroundImageAlt={`${collection.name} films showing in London`}
      afterFilmsChildren={eventsSection}
    />
  );
}
