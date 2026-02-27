import type { Metadata } from "next";
import slugify from "@sindresorhus/slugify";
import HeroSection from "@/components/hero-section";
import OutlineHeading from "@/components/outline-heading";
import PageHeader from "@/components/page-header";
import Divider from "@/components/divider";
import { getButtonClassName } from "@/components/button";
import MoviePoster from "@/components/movie-poster";
import StackedPoster from "@/components/stacked-poster";
import { AccessibilityFeature, type Movie, type CinemaData } from "@/types";
import { getStaticData } from "@/utils/get-static-data";
import { getVenueUrl } from "@/utils/get-venue-url";
import {
  ACCESSIBILITY_LABELS,
  ACCESSIBILITY_EMOJIS,
} from "@/utils/accessibility-labels";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Accessible Cinema",
  description:
    "Find accessible film screenings across London — audio described, captioned, relaxed, baby friendly and subtitled showings at 240+ cinemas.",
};

/**
 * Feature metadata: descriptions sourced from the project accessibility docs,
 * plus visual identifiers for each feature.
 */
const FEATURE_CONFIG: Record<
  AccessibilityFeature,
  { description: string; shortDescription: string }
> = {
  [AccessibilityFeature.AudioDescription]: {
    description:
      "Screenings with a supplementary audio track that describes visual elements — actions, expressions, and scene changes — for blind or visually impaired viewers.",
    shortDescription: "For blind or visually impaired viewers",
  },
  [AccessibilityFeature.BabyFriendly]: {
    description:
      "Screenings designed to welcome parents or carers with babies and young children. Typically includes lower volume, lights slightly raised, and pram parking. Also covers kids club and family programming.",
    shortDescription: "For parents and carers with young children",
  },
  [AccessibilityFeature.HardOfHearing]: {
    description:
      "Screenings with captions or other support for deaf or hard-of-hearing viewers. This covers open captions, closed captions, SDH (Subtitles for the Deaf and Hard of Hearing), and BSL (British Sign Language) interpreted screenings.",
    shortDescription: "For deaf or hard-of-hearing viewers",
  },
  [AccessibilityFeature.Relaxed]: {
    description:
      "Screenings with adjustments for neurodiverse audiences, including autistic viewers and people with learning disabilities or sensory sensitivities. Features lower sound, slightly raised lights, no trailers, and a calm, tolerant atmosphere.",
    shortDescription: "For neurodiverse audiences",
  },
  [AccessibilityFeature.Subtitled]: {
    description:
      "Screenings with subtitles translating dialogue into another language (typically English). This is for language accessibility — making foreign-language films accessible to a broader audience.",
    shortDescription: "For language accessibility",
  },
};

type FeatureStats = {
  feature: AccessibilityFeature;
  movieCount: number;
  performanceCount: number;
  venueCount: number;
  topMovies: {
    id: string;
    title: string;
    posterPath?: string;
    performanceCount: number;
    year?: string;
    includedMovies?: { posterPath?: string; title: string }[];
  }[];
};

type TopVenue = {
  id: string;
  name: string;
  href: string;
  filmCount: number;
  performanceCount: number;
};

/**
 * Computes accessibility statistics from the full cinema dataset.
 * Runs at build time for zero-latency page loads.
 */
function computeAccessibilityStats(data: CinemaData): {
  overall: { movieCount: number; performanceCount: number; venueCount: number };
  features: FeatureStats[];
  topVenues: TopVenue[];
} {
  const features = Object.values(AccessibilityFeature);
  const allMovies = Object.values(data.movies);

  // Per-feature stats
  const featureStats: FeatureStats[] = features.map((feature) => {
    const movieMap = new Map<string, { movie: Movie; perfCount: number }>();
    const venueSet = new Set<string>();
    let performanceCount = 0;

    for (const movie of allMovies) {
      let moviePerfCount = 0;
      for (const perf of movie.performances) {
        if (perf.accessibility?.[feature]) {
          moviePerfCount++;
          performanceCount++;
          const showing = movie.showings[perf.showingId];
          if (showing) {
            venueSet.add(showing.venueId);
          }
        }
      }
      if (moviePerfCount > 0) {
        movieMap.set(movie.id, { movie, perfCount: moviePerfCount });
      }
    }

    // Top movies by performance count
    const topMovies = [...movieMap.values()]
      .sort((a, b) => b.perfCount - a.perfCount)
      .slice(0, 10)
      .map(({ movie, perfCount }) => ({
        id: movie.id,
        title: movie.title,
        posterPath: movie.posterPath,
        performanceCount: perfCount,
        year: movie.year,
        includedMovies: movie.includedMovies?.map((m) => ({
          posterPath: m.posterPath,
          title: m.title,
        })),
      }));

    return {
      feature,
      movieCount: movieMap.size,
      performanceCount,
      venueCount: venueSet.size,
      topMovies,
    };
  });

  // Aggregate stats (any accessibility feature)
  const overallMovieSet = new Set<string>();
  const overallVenueFilms = new Map<string, Set<string>>();
  const overallVenuePerfs = new Map<string, number>();
  let overallPerformanceCount = 0;

  for (const movie of allMovies) {
    for (const perf of movie.performances) {
      if (
        perf.accessibility &&
        Object.values(perf.accessibility).some(Boolean)
      ) {
        overallPerformanceCount++;
        overallMovieSet.add(movie.id);
        const showing = movie.showings[perf.showingId];
        if (showing) {
          const vid = showing.venueId;
          if (!overallVenueFilms.has(vid))
            overallVenueFilms.set(vid, new Set());
          overallVenueFilms.get(vid)!.add(movie.id);
          overallVenuePerfs.set(vid, (overallVenuePerfs.get(vid) || 0) + 1);
        }
      }
    }
  }

  // Top venues by accessible film count (across all features)
  const topVenues = [...overallVenueFilms.entries()]
    .map(([venueId, films]) => {
      const venue = data.venues[venueId];
      return {
        id: venueId,
        name: venue?.name || venueId,
        href: venue ? getVenueUrl(venue) : "#",
        filmCount: films.size,
        performanceCount: overallVenuePerfs.get(venueId) || 0,
      };
    })
    .sort(
      (a, b) =>
        b.filmCount - a.filmCount || b.performanceCount - a.performanceCount,
    )
    .slice(0, 10);

  return {
    overall: {
      movieCount: overallMovieSet.size,
      performanceCount: overallPerformanceCount,
      venueCount: overallVenueFilms.size,
    },
    features: featureStats,
    topVenues,
  };
}

export default async function AccessibilityPage() {
  const data = await getStaticData();
  const { overall, features, topVenues } = computeAccessibilityStats(data);

  return (
    <main id="main-content">
      <PageHeader backUrl="/" backText="Back to film list" />

      <HeroSection
        backgroundImage="/images/various-movie-seats.jpg"
        backgroundImageAlt="Rows of cinema seats"
        backdropHeight="extended"
        align="center"
        className={styles.hero}
      >
        <OutlineHeading className={styles.title}>
          Accessible Cinema
        </OutlineHeading>
        <p className={styles.tagline}>
          <strong>Cinema for everyone.</strong>
          <br />
          Find screenings with audio description, captions, relaxed
          environments, and more across London&apos;s 240+ venues.
        </p>
        <p className={styles.heroNote}>
          Our accessibility data is sourced directly from each venue and
          cross-referenced against the{" "}
          <span className="nowrap">UK Cinema Association&apos;s</span>{" "}
          <a
            href="https://accessiblescreeningsuk.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className="nowrap"
          >
            Accessible Screenings UK
          </a>{" "}
          data to ensure accuracy.
        </p>
      </HeroSection>

      <Divider />

      {/* Overview stats */}
      <section className={styles.content}>
        <div className={styles.overviewSection}>
          <OutlineHeading as="h2" color="blue" className={styles.sectionTitle}>
            At a Glance
          </OutlineHeading>
          <p className={styles.overviewIntro}>
            Accessibility features are tracked on individual screenings across
            London. Here&apos;s what&apos;s currently available.
          </p>
          <div className={styles.overviewStats}>
            <div className={styles.overviewStat}>
              <span className={styles.overviewStatValue}>
                {overall.movieCount.toLocaleString("en-GB")}
              </span>
              <span className={styles.overviewStatLabel}>Films</span>
            </div>
            <div className={styles.overviewStat}>
              <span className={styles.overviewStatValue}>
                {overall.performanceCount.toLocaleString("en-GB")}
              </span>
              <span className={styles.overviewStatLabel}>Showings</span>
            </div>
            <div className={styles.overviewStat}>
              <span className={styles.overviewStatValue}>
                {overall.venueCount.toLocaleString("en-GB")}
              </span>
              <span className={styles.overviewStatLabel}>Venues</span>
            </div>
          </div>
          <p className={styles.overviewSubtext}>
            with at least one accessible screening
          </p>
        </div>

        {/* Quick nav */}
        <nav className={styles.quickNav} aria-label="Jump to feature">
          {features.map((f) => (
            <a
              key={f.feature}
              href={`#${f.feature}`}
              className={styles.quickNavLink}
            >
              <span aria-hidden="true">{ACCESSIBILITY_EMOJIS[f.feature]}</span>
              {ACCESSIBILITY_LABELS[f.feature]}
            </a>
          ))}
        </nav>
      </section>

      {/* Top venues section */}
      {topVenues.length > 0 && (
        <section className={styles.content}>
          <div className={styles.topVenues}>
            <h2 className={styles.topVenuesTitle}>
              Top Venues for Accessible Screenings
            </h2>
            <p className={styles.topVenuesIntro}>
              Venues with the most films offering accessibility features.
            </p>
            <ol className={styles.venueList}>
              {topVenues.map((venue, index) => (
                <li key={venue.id} className={styles.venueItem}>
                  <a href={venue.href} className={styles.venueLink}>
                    <span className={styles.venueRank}>{index + 1}</span>
                    <span className={styles.venueName}>{venue.name}</span>
                    <span className={styles.venueStats}>
                      {venue.filmCount.toLocaleString("en-GB")}{" "}
                      {venue.filmCount === 1 ? "film" : "films"}
                      {" · "}
                      {venue.performanceCount.toLocaleString("en-GB")}{" "}
                      {venue.performanceCount === 1 ? "showing" : "showings"}
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      <Divider />

      {/* Feature sections */}
      <div className={styles.content}>
        <div className={styles.featuresContainer}>
          {features.map((featureStat) => {
            const config = FEATURE_CONFIG[featureStat.feature];
            const label = ACCESSIBILITY_LABELS[featureStat.feature];
            const filterUrl = `/?accessibility=${featureStat.feature}`;

            return (
              <section
                key={featureStat.feature}
                className={styles.featureSection}
                id={featureStat.feature}
              >
                <div className={styles.featureHeader}>
                  <span className={styles.featureEmoji} aria-hidden="true">
                    {ACCESSIBILITY_EMOJIS[featureStat.feature]}
                  </span>
                  <div>
                    <h3 className={styles.featureTitle}>{label}</h3>
                    <p className={styles.featureShortDesc}>
                      {config.shortDescription}
                    </p>
                  </div>
                </div>

                <p className={styles.featureDescription}>
                  {config.description}
                </p>

                {featureStat.performanceCount > 0 ? (
                  <>
                    <div className={styles.featureStats}>
                      <div className={styles.featureStatCard}>
                        <span className={styles.featureStatValue}>
                          {featureStat.movieCount.toLocaleString("en-GB")}
                        </span>
                        <span className={styles.featureStatLabel}>Films</span>
                      </div>
                      <div className={styles.featureStatCard}>
                        <span className={styles.featureStatValue}>
                          {featureStat.performanceCount.toLocaleString("en-GB")}
                        </span>
                        <span className={styles.featureStatLabel}>
                          Showings
                        </span>
                      </div>
                      <div className={styles.featureStatCard}>
                        <span className={styles.featureStatValue}>
                          {featureStat.venueCount.toLocaleString("en-GB")}
                        </span>
                        <span className={styles.featureStatLabel}>Venues</span>
                      </div>
                    </div>

                    {featureStat.topMovies.length > 0 && (
                      <div className={styles.topMovies}>
                        <h4 className={styles.topMoviesTitle}>
                          Most Shown with {label}
                        </h4>
                        <div className={styles.posterGrid}>
                          {featureStat.topMovies.map((movie) => {
                            const included = movie.includedMovies || [];
                            const includedWithPosters = included.filter(
                              (m) => m.posterPath,
                            );
                            const totalPosters =
                              (movie.posterPath ? 1 : 0) +
                              includedWithPosters.length;
                            const useStacked =
                              included.length > 1 && totalPosters >= 2;
                            const subtitle = `${movie.performanceCount.toLocaleString("en-GB")} ${movie.performanceCount === 1 ? "showing" : "showings"}`;

                            return (
                              <a
                                key={movie.id}
                                href={`/movies/${movie.id}/${slugify(movie.title)}?accessibility=${featureStat.feature}&allDates=true`}
                                className={styles.posterLink}
                              >
                                {useStacked ? (
                                  <StackedPoster
                                    mainPosterPath={movie.posterPath}
                                    mainTitle={movie.title}
                                    includedMovies={included}
                                    subtitle={subtitle}
                                    showOverlay
                                    interactive
                                    headingLevel="h3"
                                  />
                                ) : (
                                  <MoviePoster
                                    posterPath={
                                      movie.posterPath ||
                                      includedWithPosters[0]?.posterPath
                                    }
                                    title={movie.title}
                                    subtitle={subtitle}
                                    showOverlay
                                    interactive
                                    headingLevel="h3"
                                  />
                                )}
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Plain <a> instead of <Link> to force full page load,
                        ensuring FilterConfigProvider re-initialises and
                        picks up the ?accessibility= URL param */}
                    <a href={filterUrl} className={getButtonClassName()}>
                      Browse {label} screenings →
                    </a>
                  </>
                ) : (
                  <p className={styles.noScreenings}>
                    No {label.toLowerCase()} screenings are currently listed.
                    Check back soon — data is refreshed daily.
                  </p>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
