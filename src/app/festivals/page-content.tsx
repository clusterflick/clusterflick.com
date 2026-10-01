import Link from "next/link";
import Image from "next/image";
import ProgrammeCard from "@/components/programme-card";
import StandardPageLayout from "@/components/standard-page-layout";
import EmptyState from "@/components/empty-state";
import PosterRow from "@/components/poster-row";
import FestivalTimeline from "@/components/festival-timeline";
import Tag from "@/components/tag";
import { ButtonLink } from "@/components/button";
import { CalendarIcon } from "@/components/icons";
import { formatDateShort, formatDayAndDate } from "@/utils/format-date";
import type {
  FestivalListItem,
  FeaturedFestival,
} from "@/utils/get-festivals-index";
import styles from "./page.module.css";

/**
 * Past this many venues the intro sentence stops naming them. A run of links
 * that long stops reading as a sentence and buries the festival cards below it,
 * and the venues are all reachable from the festivals themselves anyway.
 */
const MAX_LISTED_VENUES = 10;

interface FestivalsPageContentProps {
  /** Every festival with something showing, in start-date order. */
  festivals: FestivalListItem[];
  /** The festival the page leads with, or null when there are none. */
  featured: FeaturedFestival | null;
  venues: { name: string; href: string }[];
  /** When the page was built. */
  now: number;
  /** London midnight on the day the page was built: the timeline's left edge. */
  today: number;
}

function formatDateRange(festival: FestivalListItem): string | null {
  if (festival.dateFrom === null || festival.dateTo === null) return null;
  const from = formatDateShort(new Date(festival.dateFrom), {
    includeYearIfDifferent: true,
  });
  const to = formatDateShort(new Date(festival.dateTo), {
    includeYearIfDifferent: true,
  });
  return from === to ? from : `${from} – ${to}`;
}

function FestivalCard({ festival }: { festival: FestivalListItem }) {
  const dates = formatDateRange(festival);
  return (
    <ProgrammeCard
      href={festival.href}
      name={festival.name}
      imagePath={festival.imagePath}
      description={festival.seoDescription}
      posters={festival.posters}
      next={festival.next}
      meta={
        <>
          {dates && (
            <span className={styles.metaItem}>
              <CalendarIcon size={14} />
              {dates}
            </span>
          )}
          <span className={styles.filmCount}>
            {festival.movieCount} {festival.movieCount === 1 ? "film" : "films"}
          </span>
        </>
      }
    />
  );
}

/**
 * "On now" only when the listings still hold a screening that has passed:
 * venues drop past screenings, so a festival can be under way with every
 * listed screening still ahead, and that case says "This week" instead of
 * claiming a start date that has already been.
 */
function getFeaturedStatus(festival: FestivalListItem, now: number) {
  if (festival.dateFrom !== null && festival.dateFrom < now) {
    return { label: "On now", color: "pink" as const };
  }
  if (festival.thisWeek || festival.dateFrom === null) {
    return { label: "This week", color: "pink" as const };
  }
  return {
    label: `Starts ${formatDayAndDate(festival.dateFrom)}`,
    color: "blue" as const,
  };
}

function FeaturedFestivalSection({
  featured: { festival, films, catalogueHref, plannerHref },
  now,
}: {
  featured: FeaturedFestival;
  now: number;
}) {
  const dates = formatDateRange(festival);
  const status = getFeaturedStatus(festival, now);
  return (
    <section className={styles.featured} aria-labelledby="featured-festival">
      <div className={styles.featuredHeader}>
        {festival.imagePath && (
          <div className={styles.featuredLogo}>
            <Image
              src={festival.imagePath}
              alt=""
              width={96}
              height={96}
              className={styles.featuredLogoImage}
            />
          </div>
        )}
        <div className={styles.featuredText}>
          <div className={styles.featuredStatus}>
            <Tag color={status.color} size="sm">
              {status.label}
            </Tag>
            {dates && <span className={styles.featuredDates}>{dates}</span>}
          </div>
          <h2 id="featured-festival" className={styles.featuredName}>
            <Link href={festival.href}>{festival.name}</Link>
          </h2>
          {festival.seoDescription && (
            <p className={styles.featuredDescription}>
              {festival.seoDescription.charAt(0).toUpperCase() +
                festival.seoDescription.slice(1)}
              .
            </p>
          )}
          <div className={styles.featuredLinks}>
            <ButtonLink href={festival.href} size="sm">
              See the programme
            </ButtonLink>
            <ButtonLink href={catalogueHref} variant="secondary" size="sm">
              Explore in the catalogue
            </ButtonLink>
            <ButtonLink href={plannerHref} variant="secondary" size="sm">
              Plan in the planner
            </ButtonLink>
          </div>
        </div>
      </div>
      <PosterRow
        title={`${festival.movieCount} ${festival.movieCount === 1 ? "film" : "films"} showing`}
        titleAs="h3"
        movies={films}
        seeAllHref={festival.href}
        seeAllLabel="Full programme"
      />
    </section>
  );
}

export default function FestivalsPageContent({
  festivals,
  featured,
  venues,
  now,
  today,
}: FestivalsPageContentProps) {
  const count = festivals.length;

  const subtitle =
    count === 0
      ? "No festivals currently running"
      : `${count} ${count === 1 ? "festival" : "festivals"} running`;

  // The featured festival has the page's top to itself; listing it again in
  // the cards below would just repeat it.
  const rest = festivals.filter((f) => f.id !== featured?.festival.id);
  const thisWeek = rest.filter((f) => f.thisWeek);
  const comingUp = rest.filter((f) => !f.thisWeek);

  const timelineItems = festivals.flatMap((f) =>
    f.dateFrom !== null && f.dateTo !== null
      ? [
          {
            id: f.id,
            name: f.name,
            href: f.href,
            dateFrom: f.dateFrom,
            dateTo: f.dateTo,
          },
        ]
      : [],
  );

  return (
    <StandardPageLayout title="Festivals" subtitle={subtitle}>
      {count > 0 && (
        <p className={styles.intro}>
          Clusterflick tracks film festivals happening right now across London.
          {venues.length > 0 && (
            <>
              {" "}
              Current festivals are screening at{" "}
              {venues.length < MAX_LISTED_VENUES ? (
                venues.map((venue, i) => (
                  <span key={venue.href}>
                    <Link href={venue.href}>{venue.name}</Link>
                    {i < venues.length - 2
                      ? ", "
                      : i === venues.length - 2
                        ? " and "
                        : ""}
                  </span>
                ))
              ) : (
                <>{venues.length} venues</>
              )}
              .
            </>
          )}
        </p>
      )}
      {count === 0 ? (
        <EmptyState
          icon={{
            src: "/images/icons/neon-ticket-ripped.svg",
            width: 120,
            height: 80,
          }}
          message="No festivals currently showing"
          hint="Check back soon — festival listings are updated regularly"
        />
      ) : (
        <>
          {featured && (
            <FeaturedFestivalSection featured={featured} now={now} />
          )}

          {/* One festival is its own timeline: the featured section says it. */}
          {timelineItems.length > 1 && (
            <section className={styles.section} aria-labelledby="at-a-glance">
              <h2 id="at-a-glance" className={styles.sectionHeading}>
                At a glance
              </h2>
              <FestivalTimeline
                items={timelineItems}
                start={today}
                highlightId={featured?.festival.id}
              />
            </section>
          )}

          {[
            { id: "this-week", title: "This week", items: thisWeek },
            {
              id: "coming-up",
              title: "Coming up",
              items: comingUp,
            },
          ]
            .filter((group) => group.items.length > 0)
            .map((group) => (
              <section
                key={group.id}
                className={styles.section}
                aria-labelledby={group.id}
              >
                <h2 id={group.id} className={styles.sectionHeading}>
                  {group.title}
                </h2>
                <ul className={styles.festivalGrid}>
                  {group.items.map((festival) => (
                    <li key={festival.id}>
                      <FestivalCard festival={festival} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
        </>
      )}
    </StandardPageLayout>
  );
}
