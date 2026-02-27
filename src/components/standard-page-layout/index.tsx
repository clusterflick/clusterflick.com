import type { ReactNode } from "react";
import PageHeader from "@/components/page-header";
import HeroSection from "@/components/hero-section";
import OutlineHeading from "@/components/outline-heading";
import Divider from "@/components/divider";
import PreloadCinemaData from "@/components/preload-cinema-data";
import styles from "./standard-page-layout.module.css";

interface StandardPageLayoutProps {
  /**
   * Main heading displayed as an OutlineHeading inside the hero.
   * Must be a plain string (OutlineHeading renders the text twice for the
   * outline effect and does not support nested elements).
   */
  title: string;
  /**
   * Optional subtitle rendered as a paragraph below the heading.
   * For richer hero content (e.g. a status badge), use heroExtra instead.
   */
  subtitle?: string;
  /**
   * Optional extra content rendered inside the hero below the title/subtitle.
   * Use this for structured elements like stat cards or status badges that
   * cannot be expressed as a plain string subtitle.
   */
  heroExtra?: ReactNode;
  /** URL for the PageHeader back button */
  backUrl: string;
  /** Label for the PageHeader back button */
  backText: string;
  /** Page body rendered below the hero and divider */
  children: ReactNode;
}

/**
 * Standard layout for listing/section pages (Venues, Festivals, London Cinemas,
 * Borough). Combines PreloadCinemaData, PageHeader, a centred light-circles hero,
 * a Divider, and a constrained content wrapper into a single consistent shell.
 *
 * Use this when a page follows the pattern:
 * - Back navigation to a parent route
 * - Centred hero with an OutlineHeading title and optional subtitle
 * - Content below a horizontal divider
 *
 * Do NOT use this for the home page, movie detail pages, or the About page —
 * those have bespoke hero layouts that don't fit this mould.
 */
export default function StandardPageLayout({
  title,
  subtitle,
  heroExtra,
  backUrl,
  backText,
  children,
}: StandardPageLayoutProps) {
  return (
    <main id="main-content">
      <PreloadCinemaData />
      <PageHeader backUrl={backUrl} backText={backText} />

      <HeroSection
        backgroundImage="/images/light-circles.jpg"
        backgroundImageAlt="Decorative light circles"
        backdropHeight="standard"
        align="center"
      >
        <OutlineHeading className={styles.title}>{title}</OutlineHeading>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        {heroExtra}
      </HeroSection>

      <Divider />

      <div className={styles.content}>{children}</div>
    </main>
  );
}
