import type { Metadata } from "next";
import Link from "next/link";
import StandardPageLayout from "@/components/standard-page-layout";
import OutlineHeading from "@/components/outline-heading";
import LinkedList from "@/components/linked-list";
import type { LinkedListItem } from "@/components/linked-list";
import EmptyState from "@/components/empty-state";
import { getStaticData } from "@/utils/get-static-data";
import {
  buildUpdates,
  getUpdateDayPath,
  groupUpdatesByDay,
  readDiffBlobs,
  summariseDay,
} from "@/utils/get-updates";
import {
  dateStringToLondonTimestamp,
  formatDateLong,
} from "@/utils/format-date";
import ReleaseSection from "./release-section";
import styles from "./updates.module.css";

export const metadata: Metadata = {
  title: "Recently Added London Cinema Listings",
  description:
    "New films, new showings and new venues added to Clusterflick's London cinema listings, updated with every run of the data pipeline.",
  alternates: {
    canonical: "/updates",
    // Autodiscovery: this is what a reader looks for when given the page URL,
    // and matters more than the feed's path.
    types: {
      "application/rss+xml": [
        { url: "/updates/feed.xml", title: "Clusterflick — Updates" },
      ],
    },
  },
  openGraph: {
    title: "Recently Added London Cinema Listings | Clusterflick",
    description:
      "New films, new showings and new venues added to Clusterflick's London cinema listings.",
    url: "https://clusterflick.com/updates",
    siteName: "Clusterflick",
  },
  twitter: {
    card: "summary",
    title: "Recently Added London Cinema Listings | Clusterflick",
    description:
      "New films, new showings and new venues added to Clusterflick's London cinema listings.",
    creator: "@clusterflick",
  },
};

/**
 * The landing page carries the newest day in full and lists the rest.
 *
 * It is not a redirect to the newest dated page, though it shows the same runs:
 * `/updates` is in the nav, the sitemap and the feed's autodiscovery link, and
 * static export has no way to redirect that wouldn't leave those pointing at a
 * client-side bounce. Showing the latest day here also gives the archive
 * somewhere to live, so reaching a day from last week is one click rather than
 * a walk back through the chain.
 */
export default async function UpdatesPage() {
  const data = await getStaticData();
  const days = groupUpdatesByDay(buildUpdates(readDiffBlobs(), data));

  const [latest, ...earlier] = days;

  const archiveItems: LinkedListItem[] = earlier.map((day) => ({
    key: day.date,
    href: getUpdateDayPath(day.date),
    label: formatDateLong(dateStringToLondonTimestamp(day.date)),
    detail: summariseDay(day),
  }));

  return (
    <StandardPageLayout
      title="Updates"
      subtitle="New films, new showings and new venues, each time the listings are refreshed."
      heroExtra={
        <p className={styles.heroNote}>
          Listings are refreshed automatically throughout the day —{" "}
          <Link href="/about#behind-the-scenes">see how it works</Link>, or{" "}
          <a
            href="/updates/feed.xml"
            type="application/rss+xml"
            target="_blank"
            className={styles.feedLink}
          >
            subscribe via RSS
          </a>
          .
        </p>
      }
    >
      {!latest ? (
        <EmptyState
          variant="contained"
          icon={{
            src: "/images/icons/neon-clapper.svg",
            width: 120,
            height: 120,
          }}
          title="Nothing new yet"
          message="Updates appear here after the next run of the listings pipeline."
        />
      ) : (
        <>
          <ol className={styles.timeline}>
            {latest.releases.map((release) => (
              <ReleaseSection key={release.tag} release={release} />
            ))}
          </ol>

          {archiveItems.length > 0 && (
            <section className={styles.archive}>
              <OutlineHeading
                as="h2"
                color="pink"
                className={styles.archiveHeading}
              >
                Earlier updates
              </OutlineHeading>
              <p className={styles.archiveNote}>
                Each day&apos;s changes, kept for as long as the screenings they
                announce are still worth knowing about.
              </p>
              <LinkedList items={archiveItems} />
            </section>
          )}
        </>
      )}
    </StandardPageLayout>
  );
}
