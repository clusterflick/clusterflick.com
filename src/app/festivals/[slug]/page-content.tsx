import { type ComponentType } from "react";
import type { Movie } from "@/types";
import type { Festival } from "@/data/festivals";
import PageHeader from "@/components/page-header";
import DetailPageHero from "@/components/detail-page-hero";
import ContentSection from "@/components/content-section";
import Divider from "@/components/divider";
import FilmPosterGrid from "@/components/film-poster-grid";
import VenueCard from "@/components/venue-card";
import PreloadCinemaData from "@/components/preload-cinema-data";
import FestivalRedirect from "./festival-redirect";
import styles from "./page.module.css";

export type FestivalVenueItem = {
  id: string;
  name: string;
  href: string;
  type: string;
  imagePath: string | null;
  filmCount: number;
  performanceCount: number;
};

export interface FestivalDetailPageContentProps {
  festival: Festival;
  imagePath: string | null;
  movieCount: number;
  performanceCount: number;
  gridMovies: { movie: Movie; performanceCount: number }[];
  gridMoviesTruncated?: boolean;
  FestivalBlurb: ComponentType | null;
  isAlias: boolean;
  canonicalUrl: string;
  venues: FestivalVenueItem[];
}

export default function FestivalDetailPageContent({
  festival,
  imagePath,
  movieCount,
  performanceCount,
  gridMovies,
  gridMoviesTruncated,
  FestivalBlurb,
  isAlias,
  canonicalUrl,
  venues,
}: FestivalDetailPageContentProps) {
  return (
    <main id="main-content">
      <PreloadCinemaData />
      {isAlias && <FestivalRedirect canonicalUrl={canonicalUrl} />}
      <PageHeader backUrl="/festivals" backText="All festivals" />

      <DetailPageHero
        name={festival.name}
        imagePath={imagePath}
        url={festival.url}
        movieCount={movieCount}
        performanceCount={performanceCount}
      />

      <Divider />

      {(FestivalBlurb || venues.length > 0) && (
        <>
          <div className={styles.content}>
            <div className={styles.columns}>
              {FestivalBlurb && (
                <div className={styles.main}>
                  <ContentSection title="About" as="h2">
                    <div className={styles.blurb}>
                      <FestivalBlurb />
                    </div>
                  </ContentSection>
                </div>
              )}
              {venues.length > 0 && (
                <div className={styles.sidebar}>
                  <ContentSection title="Cinemas" as="h2">
                    <div className={styles.venueGrid}>
                      {venues.map((venue) => (
                        <VenueCard
                          key={venue.id}
                          href={venue.href}
                          name={venue.name}
                          type={venue.type}
                          imagePath={venue.imagePath}
                          filmCount={venue.filmCount}
                          performanceCount={venue.performanceCount}
                        />
                      ))}
                    </div>
                  </ContentSection>
                </div>
              )}
            </div>
          </div>
          <Divider />
        </>
      )}

      <div className={styles.filmsSection}>
        <ContentSection
          title={`Films at ${festival.name}`}
          as="h2"
          className={styles.festivalFilms}
        >
          <FilmPosterGrid
            movies={gridMovies}
            truncated={gridMoviesTruncated}
            exploreHref="/"
            exploreLabel="Or start exploring all films"
            showAll
          />
        </ContentSection>
      </div>
    </main>
  );
}
