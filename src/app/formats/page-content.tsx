import Link from "next/link";
import EventCard from "@/components/event-card";
import StandardPageLayout from "@/components/standard-page-layout";
import type { FormatListItem } from "./page";
import styles from "./page.module.css";

interface FormatsPageContentProps {
  formats: FormatListItem[];
}

export default function FormatsPageContent({
  formats,
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
        Some films are best seen in a specific format — the depth of{" "}
        {formatLink("70mm")}, the grain of {formatLink("35mm")}, or the
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
        Pick a format to see what&apos;s currently screening and where.
      </p>
      <ul className={styles.formatGrid}>
        {formats.map((format) => (
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
    </StandardPageLayout>
  );
}
