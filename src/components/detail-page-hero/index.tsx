import type { ReactNode } from "react";
import Image from "next/image";
import HeroSection from "@/components/hero-section";
import OutlineHeading from "@/components/outline-heading";
import { formatDateShort, isInPast } from "@/utils/format-date";
import styles from "./detail-page-hero.module.css";

interface DetailPageHeroProps {
  name: string;
  imagePath?: string | null;
  imageAlt?: string;
  url?: string;
  movieCount: number;
  performanceCount: number;
  /** Background image for the hero. Defaults to the decorative light circles. */
  backgroundImage?: string;
  /** Alt text for a custom background image. */
  backgroundImageAlt?: string;
  /**
   * When the last screening here was, for an entity with nothing on. Shown only
   * once that date has passed: a venue can hold performances the listings drop
   * (an event that is not a film, say), which would otherwise date its silence
   * to next month.
   */
  lastPerformance?: number;
  /** Optional content rendered between the URL link and the status card, e.g. a tag/social row */
  children?: ReactNode;
}

export default function DetailPageHero({
  name,
  imagePath,
  imageAlt,
  url,
  movieCount,
  performanceCount,
  backgroundImage = "/images/light-circles.jpg",
  backgroundImageAlt = "Decorative light circles",
  lastPerformance,
  children,
}: DetailPageHeroProps) {
  const hasEvents = performanceCount > 0;
  const showLastPerformance =
    lastPerformance !== undefined && isInPast(lastPerformance);

  return (
    <HeroSection
      backgroundImage={backgroundImage}
      backgroundImageAlt={backgroundImageAlt}
      backdropHeight="standard"
      align="center"
      className={styles.hero}
    >
      {imagePath && (
        <div className={styles.entityImage}>
          <Image
            src={imagePath}
            alt={imageAlt ?? `${name} logo`}
            width={160}
            height={160}
            className={styles.entityLogo}
          />
        </div>
      )}
      <OutlineHeading className={styles.title}>{name}</OutlineHeading>
      {url && (
        <div className={styles.heroLinks}>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.heroLink}
          >
            {url}
          </a>
        </div>
      )}
      {children}
      <div
        className={
          hasEvents ? styles.statusCardActive : styles.statusCardInactive
        }
        data-testid="status-card"
      >
        {hasEvents ? (
          <p>
            <strong>{movieCount.toLocaleString("en-GB")}</strong>{" "}
            {movieCount === 1 ? "film" : "films"} &middot;{" "}
            <strong>{performanceCount.toLocaleString("en-GB")}</strong>{" "}
            {performanceCount === 1 ? "showing" : "showings"}
          </p>
        ) : (
          <>
            <p>No showings currently listed</p>
            {showLastPerformance && (
              <p className={styles.statusDetail}>
                Last screening was{" "}
                {formatDateShort(new Date(lastPerformance), {
                  includeYearIfDifferent: true,
                })}
              </p>
            )}
          </>
        )}
      </div>
    </HeroSection>
  );
}
