import { type ComponentType } from "react";
import type { Movie } from "@/types";
import type { FilmClub } from "@/data/film-clubs";
import PageHeader from "@/components/page-header";
import DetailPageHero from "@/components/detail-page-hero";
import ContentSection from "@/components/content-section";
import Divider from "@/components/divider";
import FilmPosterGrid from "@/components/film-poster-grid";
import VenueCard from "@/components/venue-card";
import PreloadCinemaData from "@/components/preload-cinema-data";
import FilmClubRedirect from "./film-club-redirect";
import styles from "./page.module.css";

export type FilmClubVenueItem = {
  id: string;
  name: string;
  href: string;
  type: string;
  imagePath: string | null;
  filmCount: number;
  performanceCount: number;
};

export interface FilmClubDetailPageContentProps {
  club: FilmClub;
  imagePath: string | null;
  movieCount: number;
  performanceCount: number;
  gridMovies: { movie: Movie; performanceCount: number }[];
  gridMoviesTruncated?: boolean;
  FilmClubBlurb: ComponentType | null;
  isAlias: boolean;
  canonicalUrl: string;
  venues: FilmClubVenueItem[];
}

export default function FilmClubDetailPageContent({
  club,
  imagePath,
  movieCount,
  performanceCount,
  gridMovies,
  gridMoviesTruncated,
  FilmClubBlurb,
  isAlias,
  canonicalUrl,
  venues,
}: FilmClubDetailPageContentProps) {
  return (
    <main id="main-content">
      <PreloadCinemaData />
      {isAlias && <FilmClubRedirect canonicalUrl={canonicalUrl} />}
      <PageHeader backUrl="/film-clubs" backText="All film clubs" />

      <DetailPageHero
        name={club.name}
        imagePath={imagePath}
        url={club.url}
        movieCount={movieCount}
        performanceCount={performanceCount}
      />

      <Divider />

      {(FilmClubBlurb || venues.length > 0) && (
        <>
          <div className={styles.content}>
            <div className={styles.columns}>
              {FilmClubBlurb && (
                <div className={styles.main}>
                  <ContentSection title="About" as="h2">
                    <div className={styles.blurb}>
                      <FilmClubBlurb />
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
          title={`Films at ${club.name}`}
          as="h2"
          className={styles.clubFilms}
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
