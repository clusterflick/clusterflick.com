import type { Metadata } from "next";
import slugify from "@sindresorhus/slugify";
import Link from "next/link";
import HeroSection from "@/components/hero-section";
import OutlineHeading from "@/components/outline-heading";
import PageHeader from "@/components/page-header";
import Divider from "@/components/divider";
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

/** Formats an ISO date (YYYY-MM-DD) as e.g. "Sunday, 12 July 2026". */
function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
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
        <span key={item.url}>
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
    <main id="main-content">
      <PageHeader backUrl="/about" backText="Back to about" />

      <HeroSection
        backgroundImage="/images/light-circles.jpg"
        backgroundImageAlt="Abstract blurred cinema lights"
        align="center"
        className={styles.hero}
      >
        <OutlineHeading className={styles.title}>Changelog</OutlineHeading>
        <p className={styles.tagline}>
          A running record of what&apos;s new on Clusterflick — the venues,
          sources and festivals we&apos;ve added, plus features and improvements
          across the site and its data.
        </p>
      </HeroSection>

      <Divider />

      <section className={styles.content}>
        <ol className={styles.timeline}>
          {CHANGELOG.map((day) => (
            <li key={day.date} className={styles.day}>
              <OutlineHeading
                as="h2"
                color="blue"
                className={styles.dayHeading}
              >
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
      </section>
    </main>
  );
}
