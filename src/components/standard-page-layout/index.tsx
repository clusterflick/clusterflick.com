import type { ReactNode } from "react";
import clsx from "clsx";
import PageHeader from "@/components/page-header";
import HeroSection from "@/components/hero-section";
import OutlineHeading from "@/components/outline-heading";
import Divider from "@/components/divider";
import PreloadCinemaData from "@/components/preload-cinema-data";
import SiteFooter from "@/components/site-footer";
import styles from "./standard-page-layout.module.css";

/**
 * The content column's width, by what the page mostly holds:
 * - `prose` — reading pages (the data licence, the changelog)
 * - `default` — cards and lists (venues, festivals, clubs, boroughs)
 * - `wide` — poster rows and discovery content
 * Full-bleed content goes in `afterContent` instead.
 */
export type StandardPageWidth = "prose" | "default" | "wide";

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
  /**
   * URL and label for the PageHeader back button. Provide both or neither.
   *
   * Set these only on pages that sit under a parent route — a venue inside
   * Venues, a festival inside Festivals. Section pages are siblings of one
   * another rather than children of the films grid, so they omit the back link
   * and rely on the header nav, which PageHeader now carries everywhere.
   */
  backUrl?: string;
  backText?: string;
  /** Width of the content column (default: "default") */
  width?: StandardPageWidth;
  /** Page body rendered below the hero and divider */
  children: ReactNode;
  /**
   * Optional full-width content rendered below the constrained content area,
   * outside the centred max-width wrapper. Use for edge-to-edge sections like a
   * poster grid that should span the full page width.
   */
  afterContent?: ReactNode;
  /**
   * Omit the site footer. For pages that are a single self-contained tool
   * rather than a destination to read and move on from — the venue calendar,
   * where the page is one full-height widget and the footer's link columns are
   * just noise below it.
   */
  hideFooter?: boolean;
  /**
   * Omit the hero and the divider under it. For a page whose top is a feature
   * of its own, rendered in `afterContent` along with the page's heading —
   * the venues page, which opens on a full-screen map with its title over it.
   */
  hideHero?: boolean;
}

/**
 * Standard layout for listing/section and entity pages (Venues, Festivals,
 * London Cinemas, Borough, and — via the `hero` slot — venue/event detail
 * pages). Combines PreloadCinemaData, PageHeader, a hero, a Divider, and a
 * constrained content wrapper into a single consistent shell.
 *
 * Use this when a page follows the pattern:
 * - Optional back navigation to a parent route (detail pages only)
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
  width = "default",
  children,
  afterContent,
  hideFooter = false,
  hideHero = false,
}: StandardPageLayoutProps) {
  return (
    <main id="main-content">
      <PreloadCinemaData />
      <PageHeader backUrl={backUrl} backText={backText} />

      {!hideHero &&
        (hero ?? (
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
        ))}

      {!hideHero && <Divider />}

      {children && (
        <div
          className={clsx(
            styles.content,
            width === "prose" && styles.prose,
            width === "wide" && styles.wide,
          )}
        >
          {children}
        </div>
      )}
      {afterContent}
      {!hideFooter && <SiteFooter />}
    </main>
  );
}
