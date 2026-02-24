import { type ComponentType } from "react";
import type { Movie } from "@/types";
import type { Festival } from "@/data/festivals";
import PageHeader from "@/components/page-header";
import DetailPageHero from "@/components/detail-page-hero";
import ContentSection from "@/components/content-section";
import Divider from "@/components/divider";
import FilmPosterGrid from "@/components/film-poster-grid";
import PreloadCinemaData from "@/components/preload-cinema-data";
import FestivalRedirect from "./festival-redirect";
import styles from "./page.module.css";

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

      {FestivalBlurb && (
        <>
          <div className={styles.content}>
            <ContentSection title="About" as="h2">
              <div className={styles.blurb}>
                <FestivalBlurb />
              </div>
            </ContentSection>
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
