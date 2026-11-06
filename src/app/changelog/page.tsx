import type { Metadata } from "next";
import slugify from "@sindresorhus/slugify";
import Link from "next/link";
import HeroSection from "@/components/hero-section";
import StandardPageLayout from "@/components/standard-page-layout";
import OutlineHeading from "@/components/outline-heading";
import Tag from "@/components/tag";
import { getStaticData } from "@/utils/get-static-data";
import { FESTIVALS } from "@/data/festivals";
import { getFestivalUrl } from "@/utils/get-festival-url";
import { CHANGELOG, tagColor, type ChangeHelpers, type Ref } from "./data";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Changelog",
  description:
    "A running record of what's new on Clusterflick — new venues, sources, festivals, features and improvements across the site and its data.",
  alternates: {
    canonical: "/changelog",
  },
};

/**
 * Formats an ISO date (YYYY-MM-DD) as e.g. "Sunday,\n12 July 2026". The
 * newline collapses to a space wherever the heading runs on one line, and is
 * the break when it sits in the narrow rail beside its changes, so the date
 * always wraps after the weekday rather than wherever the width runs out.
 * OutlineHeading takes only a string, so a newline rather than markup.
 */
function formatDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  const weekday = date.toLocaleDateString("en-GB", {
    weekday: "long",
    timeZone: "UTC",
  });
  const rest = date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return `${weekday},\n${rest}`;
}

/** Outbound link used when no Clusterflick page exists for a reference. */
function Outbound({ name, url }: Ref) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      {name}
    </a>
  );
}

/**
 * Builds the link helpers passed into each changelog entry. Venues and
 * festivals link to their Clusterflick page when one exists, and fall back to
 * the outbound URL otherwise — so a venue that hasn't yet landed in the dataset
 * (or a festival that isn't registered) still links somewhere useful, and
 * upgrades to an internal link automatically once the data catches up.
 */
async function buildHelpers(): Promise<ChangeHelpers> {
  const data = await getStaticData();
  const venueSlugs = new Set(
    Object.values(data.venues).map((venue) => slugify(venue.name)),
  );

  const Venue = ({ name, url }: Ref) => {
    const slug = slugify(name);
    return venueSlugs.has(slug) ? (
      <Link href={`/venues/${slug}`}>{name}</Link>
    ) : (
      <Outbound name={name} url={url} />
    );
  };

  const VenueList = ({ items }: { items: Ref[] }) => (
    <>
      {items.map((item, i) => (
        // By name: venues can share a website (a brewery's three taprooms).
        <span key={item.name}>
          <Venue {...item} />
          {i < items.length - 2 ? ", " : null}
          {i === items.length - 2 ? " and " : null}
        </span>
      ))}
    </>
  );

  const Festival = ({ name, url }: Ref) => {
    const match = FESTIVALS.find((festival) => festival.name === name);
    return match ? (
      <Link href={getFestivalUrl(match)}>{name}</Link>
    ) : (
      <Outbound name={name} url={url} />
    );
  };

  return { Venue, VenueList, Festival };
}

export default async function ChangelogPage() {
  const helpers = await buildHelpers();

  return (
    <StandardPageLayout
      width="prose"
      hero={
        <HeroSection
          backgroundImage="/images/light-circles.jpg"
          backgroundImageAlt="Abstract blurred cinema lights"
          align="center"
          className={styles.hero}
        >
          <OutlineHeading className={styles.title}>Changelog</OutlineHeading>
          <p className={styles.tagline}>
            A running record of what&apos;s new on Clusterflick — the venues,
            sources and festivals we&apos;ve added, plus features and
            improvements across the site and its data.
          </p>
        </HeroSection>
      }
    >
      <ol className={styles.timeline}>
        {CHANGELOG.map((day) => (
          <li key={day.date} className={styles.day}>
            <OutlineHeading as="h2" color="blue" className={styles.dayHeading}>
              {formatDate(day.date)}
            </OutlineHeading>
            <ul className={styles.changes}>
              {day.changes.map((change, i) => (
                <li key={i} className={styles.change}>
                  <Tag color={tagColor(change.tag)} size="sm">
                    {change.tag}
                  </Tag>
                  <p className={styles.changeBody}>{change.body(helpers)}</p>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </StandardPageLayout>
  );
}
