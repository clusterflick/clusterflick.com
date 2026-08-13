import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import StandardPageLayout from "@/components/standard-page-layout";
import { getStaticData } from "@/utils/get-static-data";
import {
  buildUpdates,
  getUpdateDayPath,
  groupUpdatesByDay,
  readDiffBlobs,
  summariseDay,
} from "@/utils/get-updates";
import type { UpdateDay } from "@/utils/get-updates";
import {
  dateStringToLondonTimestamp,
  formatDateLong,
} from "@/utils/format-date";
import ReleaseSection from "../release-section";
import styles from "../updates.module.css";

/**
 * The window of days is whatever the fetched diffs cover, so the set of pages
 * turns over as runs age out. That is the intended lifetime: an update is worth
 * reading while the screenings it announces are still ahead, and a day that has
 * rolled out is handled by the `/updates` branch in `not-found.tsx` rather than
 * kept alive.
 */
async function getDays(): Promise<UpdateDay[]> {
  const data = await getStaticData();
  return groupUpdatesByDay(buildUpdates(readDiffBlobs(), data));
}

export async function generateStaticParams() {
  const days = await getDays();
  return days.map(({ date }) => ({ date }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ date: string }>;
}): Promise<Metadata> {
  const { date } = await params;
  const days = await getDays();
  const day = days.find((candidate) => candidate.date === date);
  if (!day) return {};

  const label = formatDateLong(dateStringToLondonTimestamp(date));
  const title = `London Cinema Listings Added on ${label}`;
  const description = `${summariseDay(day)} to Clusterflick's London cinema listings on ${label}.`;

  return {
    title,
    description,
    alternates: { canonical: getUpdateDayPath(date) },
    openGraph: {
      title: `${title} | Clusterflick`,
      description,
      url: `https://clusterflick.com${getUpdateDayPath(date)}`,
      siteName: "Clusterflick",
    },
    twitter: {
      card: "summary",
      title: `${title} | Clusterflick`,
      description,
      creator: "@clusterflick",
    },
  };
}

/**
 * Both ends of the chain, labelled by direction in time rather than "previous"
 * and "next" — in an archive read newest-first, "next" is genuinely ambiguous
 * about whether it means the following day or the following entry.
 */
function DayNav({ newer, older }: { newer?: UpdateDay; older?: UpdateDay }) {
  if (!newer && !older) return null;

  return (
    <nav className={styles.dayNav} aria-label="Other updates">
      <div className={styles.dayNavSlot}>
        {newer && (
          <>
            <span className={styles.dayNavLabel}>Newer</span>
            <Link href={getUpdateDayPath(newer.date)} rel="prev">
              {formatDateLong(dateStringToLondonTimestamp(newer.date))}
            </Link>
          </>
        )}
      </div>
      <div className={styles.dayNavSlot}>
        {older && (
          <>
            <span className={styles.dayNavLabel}>Older</span>
            <Link href={getUpdateDayPath(older.date)} rel="next">
              {formatDateLong(dateStringToLondonTimestamp(older.date))}
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default async function UpdateDayPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const days = await getDays();
  const index = days.findIndex((candidate) => candidate.date === date);
  if (index === -1) notFound();

  const day = days[index];
  // Days run newest first, so the entry before this one is the later date
  const newer = days[index - 1];
  const older = days[index + 1];

  return (
    <StandardPageLayout
      title={formatDateLong(dateStringToLondonTimestamp(date))}
      subtitle={summariseDay(day)}
      heroExtra={
        <p className={styles.heroNote}>
          <Link href="/updates">All updates</Link>, or{" "}
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
      <ol className={styles.timeline}>
        {day.releases.map((release) => (
          <ReleaseSection key={release.tag} release={release} />
        ))}
      </ol>

      <DayNav newer={newer} older={older} />
    </StandardPageLayout>
  );
}
