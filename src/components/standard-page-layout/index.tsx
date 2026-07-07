import type { ReactNode } from "react";
import PageHeader from "@/components/page-header";
import HeroSection from "@/components/hero-section";
import OutlineHeading from "@/components/outline-heading";
import Divider from "@/components/divider";
import PreloadCinemaData from "@/components/preload-cinema-data";
import styles from "./standard-page-layout.module.css";

interface StandardPageLayoutProps {
  /**
   * Main heading displayed as an OutlineHeading inside the default hero.
   * Must be a plain string (OutlineHeading renders the text twice for the
   * outline effect and does not support nested elements).
   *
   * Provide EITHER `title` (default centred hero) OR `hero` (a custom hero such
   * as DetailPageHero) — not both. When `hero` is set, title/subtitle/heroExtra
   * are ignored.
   */
  title?: string;
  /**
   * Optional subtitle rendered as a paragraph below the heading.
   * For richer hero content (e.g. a status badge), use heroExtra instead.
   */
  subtitle?: string;
  /**
   * Optional extra content rendered inside the default hero below the
   * title/subtitle. Use this for structured elements like stat cards or status
   * badges that cannot be expressed as a plain string subtitle.
   */
  heroExtra?: ReactNode;
  /**
   * Fully-rendered hero that replaces the default title-based HeroSection.
   * Pass a `<DetailPageHero>` for entity pages (venues, events).
   */
  hero?: ReactNode;
  /** URL for the PageHeader back button */
  backUrl: string;
  /** Label for the PageHeader back button */
  backText: string;
  /** Page body rendered below the hero and divider */
  children: ReactNode;
  /**
   * Optional full-width content rendered below the constrained content area,
   * outside the centred max-width wrapper. Use for edge-to-edge sections like a
   * poster grid that should span the full page width.
   */
  afterContent?: ReactNode;
}

/**
 * Standard layout for listing/section and entity pages (Venues, Festivals,
 * London Cinemas, Borough, and — via the `hero` slot — venue/event detail
 * pages). Combines PreloadCinemaData, PageHeader, a hero, a Divider, and a
 * constrained content wrapper into a single consistent shell.
 *
 * Use this when a page follows the pattern:
 * - Back navigation to a parent route
 * - A centred hero (default title-based, or a custom `hero` such as DetailPageHero)
 * - Content below a horizontal divider
 * - Optional full-width `afterContent` (e.g. an edge-to-edge poster grid)
 *
 * Do NOT use this for the home page, movie detail pages, or the About page —
 * those have bespoke hero layouts that don't fit this mould.
 */
export default function StandardPageLayout({
  title,
  subtitle,
  heroExtra,
  hero,
  backUrl,
  backText,
  children,
  afterContent,
}: StandardPageLayoutProps) {
  return (
    <main id="main-content">
      <PreloadCinemaData />
      <PageHeader backUrl={backUrl} backText={backText} />

      {hero ?? (
        <HeroSection
          backgroundImage="/images/light-circles.jpg"
          backgroundImageAlt="Decorative light circles"
          backdropHeight="standard"
          align="center"
        >
          <OutlineHeading className={styles.title}>
            {title ?? ""}
          </OutlineHeading>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          {heroExtra}
        </HeroSection>
      )}

      <Divider />

      {children && <div className={styles.content}>{children}</div>}
      {afterContent}
    </main>
  );
}
