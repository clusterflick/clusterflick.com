"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useGeolocationContext } from "@/state/geolocation-context";
import { getDistanceInMiles, NEARBY_RADIUS_MILES } from "@/utils/geo-distance";
import type { NearMeVenue, NearMeFilmClub } from "@/utils/get-near-me-data";
import ContentSection from "@/components/content-section";
import VenueCard from "@/components/venue-card";
import Button from "@/components/button";
import styles from "./near-you-section.module.css";

// Cinemas shown inline before linking out to the full /near-me page.
const VENUE_DISPLAY_LIMIT = 6;

interface NearYouSectionProps {
  venues: NearMeVenue[];
  /** Film clubs with at least one screening in the discovery window. */
  filmClubs: NearMeFilmClub[];
}

export default function NearYouSection({
  venues,
  filmClubs,
}: NearYouSectionProps) {
  const { position, loading, error, requestLocation } = useGeolocationContext();

  const nearbyVenues = useMemo(() => {
    if (!position) return [];
    return venues
      .map((venue) => ({
        ...venue,
        distance: getDistanceInMiles(position, {
          lat: venue.lat,
          lon: venue.lon,
        }),
      }))
      .filter((v) => v.distance <= NEARBY_RADIUS_MILES)
      .sort((a, b) => a.distance - b.distance);
  }, [position, venues]);

  // Only surface cinemas that actually have something on — the closest 6 with showings.
  const cinemasWithShowings = useMemo(
    () => nearbyVenues.filter((v) => v.filmCount > 0),
    [nearbyVenues],
  );

  const nearbyClubs = useMemo(() => {
    if (nearbyVenues.length === 0) return [];
    const nearbyVenueIds = new Set(nearbyVenues.map((v) => v.id));
    return filmClubs.filter(
      (club) =>
        club.movieCount > 0 &&
        club.venueIds.some((id) => nearbyVenueIds.has(id)),
    );
  }, [filmClubs, nearbyVenues]);

  // Collapsed, opt-in state: just a prompt until the user shares their location.
  if (!position) {
    return (
      <section className={styles.prompt}>
        <h2 className={styles.promptTitle}>What&apos;s on near you?</h2>
        <p className={styles.promptText}>
          Find the closest cinemas and the film clubs screening near you this
          week.
        </p>
        <Button onClick={() => requestLocation()} disabled={loading}>
          {loading ? "Finding your location…" : "See what's on near you"}
        </Button>
        {error && (
          <p className={styles.error}>
            {error} <Link href="/near-me">Browse by borough instead</Link>
          </p>
        )}
      </section>
    );
  }

  if (nearbyVenues.length === 0) {
    return (
      <section className={styles.prompt}>
        <h2 className={styles.promptTitle}>Nothing close by</h2>
        <p className={styles.promptText}>
          We couldn&apos;t find any cinemas within {NEARBY_RADIUS_MILES} miles
          of you. <Link href="/near-me">Browse by borough instead</Link>.
        </p>
      </section>
    );
  }

  const displayedVenues = cinemasWithShowings.slice(0, VENUE_DISPLAY_LIMIT);

  return (
    <div className={styles.results}>
      {nearbyClubs.length > 0 && (
        <ContentSection
          title="Your Local Film Clubs"
          as="h2"
          className={styles.section}
        >
          <div className={styles.venueGrid}>
            {nearbyClubs.map((club) => (
              <VenueCard
                key={club.id}
                href={club.href}
                name={club.name}
                imagePath={club.imagePath}
                filmCount={club.movieCount}
                performanceCount={club.performanceCount}
              />
            ))}
          </div>
        </ContentSection>
      )}

      {displayedVenues.length > 0 && (
        <ContentSection
          title="Cinemas Near You"
          as="h2"
          intro={`${nearbyVenues.length} cinema${nearbyVenues.length === 1 ? "" : "s"} showing within ${NEARBY_RADIUS_MILES} miles of you`}
          className={styles.section}
          action={
            cinemasWithShowings.length > VENUE_DISPLAY_LIMIT ? (
              <Link href="/near-me">See all →</Link>
            ) : undefined
          }
        >
          <div className={styles.venueGrid}>
            {displayedVenues.map((venue) => (
              <div key={venue.id} className={styles.venueItem}>
                <VenueCard
                  href={venue.href}
                  name={venue.name}
                  type={venue.type}
                  imagePath={venue.imagePath}
                  filmCount={venue.filmCount}
                  performanceCount={venue.performanceCount}
                />
                <span className={styles.distance}>
                  {venue.distance < 0.1
                    ? "< 0.1 miles"
                    : `${venue.distance.toFixed(1)} mi`}
                </span>
              </div>
            ))}
          </div>
        </ContentSection>
      )}
    </div>
  );
}
