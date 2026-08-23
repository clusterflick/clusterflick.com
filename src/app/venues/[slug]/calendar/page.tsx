import type { Metadata } from "next";
import { notFound } from "next/navigation";
import slugify from "@sindresorhus/slugify";
import { getStaticData } from "@/utils/get-static-data";
import { getVenueImagePath } from "@/utils/get-venue-image";
import { getVenueUrl } from "@/utils/get-venue-url";
import { getVenueCalendarPath } from "@/utils/get-venue-calendar";
import StandardPageLayout from "@/components/standard-page-layout";
import DetailPageHero from "@/components/detail-page-hero";
import VenueHeroDetails from "@/components/venue-hero-details";
import EmptyState from "@/components/empty-state";
import type { Movie, Venue } from "@/types";
import VenueCalendar from "./venue-calendar";
import styles from "./calendar.module.css";

export const dynamicParams = false;

let slugMap: Map<string, Venue> | null = null;

async function getSlugMap(): Promise<Map<string, Venue>> {
  if (slugMap) return slugMap;

  const data = await getStaticData();
  slugMap = new Map();

  for (const venue of Object.values(data.venues)) {
    slugMap.set(slugify(venue.name), venue);
  }

  return slugMap;
}

export async function generateStaticParams() {
  const map = await getSlugMap();
  return Array.from(map.keys()).map((slug) => ({ slug }));
}

function getVenueMovieCounts(venue: Venue, movies: Record<string, Movie>) {
  let movieCount = 0;
  let performanceCount = 0;

  for (const movie of Object.values(movies)) {
    const venueShowingIds = new Set<string>();
    for (const [showingId, showing] of Object.entries(movie.showings)) {
      if (showing.venueId === venue.id) {
        venueShowingIds.add(showingId);
      }
    }
    if (venueShowingIds.size > 0) {
      movieCount++;
      for (const perf of movie.performances) {
        if (venueShowingIds.has(perf.showingId)) {
          performanceCount++;
        }
      }
    }
  }

  return { movieCount, performanceCount };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const map = await getSlugMap();
  const venue = map.get(slug);

  if (!venue) {
    return { title: "Venue Not Found" };
  }

  return {
    title: `${venue.name} calendar`,
    description: `A month-by-month calendar of screenings at ${venue.name}, from the same feed you can subscribe to in your own calendar app.`,
    // The calendar renders client-side from an ICS feed, so there is nothing
    // here for a crawler to read, and what it shows already exists on the venue
    // page. Point the credit at the venue page and keep this one out of the
    // index rather than publishing 336 empty documents.
    robots: { index: false, follow: true },
    alternates: {
      canonical: getVenueUrl(venue),
    },
  };
}

export default async function VenueCalendarPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const map = await getSlugMap();
  const venue = map.get(slug);

  if (!venue) {
    notFound();
  }

  const data = await getStaticData();
  const imagePath = getVenueImagePath(venue.id);
  const calendarPath = getVenueCalendarPath(venue.id);
  const { movieCount, performanceCount } = getVenueMovieCounts(
    venue,
    data.movies,
  );

  return (
    <StandardPageLayout
      backUrl={getVenueUrl(venue)}
      backText={venue.name}
      hideFooter
      hero={
        <DetailPageHero
          name={venue.name}
          imagePath={imagePath}
          url={venue.url}
          movieCount={movieCount}
          performanceCount={performanceCount}
        >
          <VenueHeroDetails
            venueId={venue.id}
            venueName={venue.name}
            venueType={venue.type}
            socials={venue.socials}
          />
        </DetailPageHero>
      }
      // A calendar wants the whole window, the way a desktop calendar app does,
      // so it goes in the full-width slot rather than the 1000px content column.
      afterContent={
        calendarPath ? (
          <div className={styles.calendarWrapper}>
            <VenueCalendar calendarPath={calendarPath} venueName={venue.name} />
          </div>
        ) : undefined
      }
    >
      {calendarPath ? null : (
        <EmptyState
          icon={{
            src: "/images/icons/neon-ticket.svg",
            width: 120,
            height: 120,
          }}
          title="No calendar yet"
          message={`We don't have a published calendar for ${venue.name}.`}
          hint="Screenings still appear on the venue page as soon as we find them."
          className={styles.emptyState}
        />
      )}
    </StandardPageLayout>
  );
}
