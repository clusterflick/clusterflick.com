import Link from "next/link";
import EventCard from "@/components/event-card";
import ContentSection from "@/components/content-section";
import StandardPageLayout from "@/components/standard-page-layout";
import type { FormatListItem, FormatSection } from "./page";
import styles from "./page.module.css";

interface FormatsPageContentProps {
  /** Every format, flat, for the intro's ranking and inline links. */
  formats: FormatListItem[];
  /** The same formats grouped by kind, in display order. */
  sections: FormatSection[];
}

export default function FormatsPageContent({
  formats,
  sections,
}: FormatsPageContentProps) {
  const showingCount = formats.filter((f) => f.movieCount > 0).length;

  // Rank by how many films are currently showing to surface the busiest formats
  // in the intro.
  const byPopularity = [...formats].sort((a, b) => b.movieCount - a.movieCount);
  const [first, second, third] = byPopularity;
  const hasShowings = first && first.movieCount > 0;

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
      backUrl="/films"
      backText="Back to film list"
    >
      <p className={styles.intro}>
        Some films are best seen in a specific format, whether that&apos;s the
        depth of {formatLink("70mm")}, the grain of {formatLink("35mm")} or the
        immersion of {formatLink("IMAX")}.
        {hasShowings && (
          <>
            {" "}
            Right now, <strong>{formatLink(first.name)}</strong> has the most on
            with {first.movieCount.toLocaleString("en-GB")}{" "}
            {first.movieCount === 1 ? "film" : "films"} screening
            {second && second.movieCount > 0 && (
              <>
                , followed by {formatLink(second.name)}
                {third && third.movieCount > 0 && (
                  <> and {formatLink(third.name)}</>
                )}
              </>
            )}
            .
          </>
        )}{" "}
        Below they&apos;re grouped by the <strong>source</strong> a screening
        plays from, and the <strong>presentation</strong> it&apos;s shown in.
      </p>
      {sections.map((section) => (
        <ContentSection
          key={section.id}
          title={section.title}
          intro={section.intro}
        >
          <ul className={styles.formatGrid}>
            {section.formats.map((format) => (
              <li key={format.id}>
                <EventCard
                  href={format.href}
                  name={`${format.name} Films`}
                  imagePath={format.imagePath}
                  description={format.seoDescription}
                  meta={
                    <span className={styles.filmCount}>
                      {format.movieCount > 0
                        ? `${format.movieCount.toLocaleString("en-GB")} ${
                            format.movieCount === 1 ? "film" : "films"
                          } showing`
                        : "Nothing showing right now"}
                    </span>
                  }
                />
              </li>
            ))}
          </ul>
        </ContentSection>
      ))}
    </StandardPageLayout>
  );
}
