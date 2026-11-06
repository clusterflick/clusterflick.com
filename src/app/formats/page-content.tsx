import { Fragment } from "react";
import Link from "next/link";
import ProgrammeCard from "@/components/programme-card";
import ContentSection from "@/components/content-section";
import StandardPageLayout from "@/components/standard-page-layout";
import StatsBand, { type StatsBandItem } from "@/components/stats-band";
import { getLede } from "@/utils/get-lede";
import {
  FILM_SOURCES,
  getFilmSourcesUrl,
  type FormatListItem,
  type FormatSection,
} from "@/utils/get-formats-index";
import styles from "./page.module.css";

const plural = (count: number, one: string, many: string) =>
  `${count.toLocaleString("en-GB")} ${count === 1 ? one : many}`;

interface FormatsPageContentProps {
  /** Every format, flat, for the figures and the intro's inline links. */
  formats: FormatListItem[];
  /** The formats with something on, grouped by kind, in display order. */
  sections: FormatSection[];
  /** The formats with nothing on, named in a line under the sections. */
  emptyFormats: FormatListItem[];
}

export default function FormatsPageContent({
  formats,
  sections,
  emptyFormats,
}: FormatsPageContentProps) {
  const showingCount = formats.filter((f) => f.movieCount > 0).length;

  // The figures count showings rather than films: a format is a way of seeing
  // a film, and 70mm's handful of films run hundreds of times. Film on film
  // leads, being the one figure no other page can give, then the busiest of
  // the rest. Four, so the band's two columns on a phone come out even.
  const filmSources = new Set<string>(FILM_SOURCES);
  const onFilm = formats
    .filter((f) => filmSources.has(f.id))
    .reduce((total, f) => total + f.performanceCount, 0);
  const others: StatsBandItem[] = formats
    .filter((f) => !filmSources.has(f.id) && f.performanceCount > 0)
    .sort(
      (a, b) =>
        b.performanceCount - a.performanceCount || a.name.localeCompare(b.name),
    )
    .map((f) => ({
      id: f.id,
      value: f.performanceCount,
      label: f.name,
      detail: f.performanceCount === 1 ? "showing" : "showings",
      href: f.href,
    }));
  const figures: StatsBandItem[] = [
    ...(onFilm > 0
      ? [
          {
            id: "on-film",
            value: onFilm,
            label: "On film",
            detail:
              onFilm === 1 ? "showing from a print" : "showings from a print",
            href: getFilmSourcesUrl(),
            highlight: true,
          },
        ]
      : []),
    ...others,
  ].slice(0, 4);

  // Link format names mentioned in the intro to their pages, resolving the href
  // by (case-insensitive) format name.
  const hrefByName = new Map(
    formats.map((f) => [f.name.toLowerCase(), f.href]),
  );
  const formatLink = (text: string) => {
    const href = hrefByName.get(text.toLowerCase());
    return href ? <Link href={href}>{text}</Link> : <>{text}</>;
  };

  return (
    <StandardPageLayout
      title="Formats"
      subtitle={`${formats.length} formats · ${showingCount} showing now`}
    >
      <p className={styles.intro}>
        Some films are best seen in a specific format, whether that&apos;s the
        depth of {formatLink("70mm")}, the grain of {formatLink("35mm")} or the
        immersion of {formatLink("IMAX")}. Below they&apos;re grouped by the{" "}
        <strong>source</strong> a screening plays from, and the{" "}
        <strong>presentation</strong> it&apos;s shown in.
      </p>
      {figures.length > 0 && (
        <div className={styles.figures}>
          <h2 className={styles.sectionHeading}>Coming up</h2>
          <StatsBand items={figures} label="Coming up" />
        </div>
      )}
      {sections.map((section) => (
        <ContentSection
          key={section.id}
          title={section.title}
          intro={section.intro}
        >
          <ul className={styles.formatGrid}>
            {section.formats.map((format) => (
              <li key={format.id}>
                <ProgrammeCard
                  href={format.href}
                  name={`${format.name} Films`}
                  imagePath={format.imagePath}
                  description={getLede(format.seoDescription)}
                  posters={format.posters}
                  next={format.next}
                  meta={
                    <span className={styles.meta}>
                      <span className={styles.filmCount}>
                        {plural(format.movieCount, "film", "films")} ·{" "}
                        {plural(format.performanceCount, "showing", "showings")}
                      </span>
                      <span className={styles.venues}>
                        {format.onlyVenue
                          ? `Only at ${format.onlyVenue}`
                          : `At ${plural(format.venueCount, "venue", "venues")}`}
                      </span>
                    </span>
                  }
                />
              </li>
            ))}
          </ul>
        </ContentSection>
      ))}
      {emptyFormats.length > 0 && (
        <p className={styles.empty}>
          <span className={styles.emptyLabel}>Nothing showing right now:</span>{" "}
          {emptyFormats.map((format, index) => (
            <Fragment key={format.id}>
              {index > 0 && " · "}
              <Link href={format.href}>{format.name}</Link>
            </Fragment>
          ))}
        </p>
      )}
    </StandardPageLayout>
  );
}
