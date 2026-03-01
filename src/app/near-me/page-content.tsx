"use client";

import { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useGeolocationContext } from "@/state/geolocation-context";
import { getDistanceInMiles, NEARBY_RADIUS_MILES } from "@/utils/geo-distance";
import {
  ACCESSIBILITY_LABELS,
  ACCESSIBILITY_EMOJIS,
} from "@/utils/accessibility-labels";
import { formatDateShort } from "@/utils/format-date";
import type { Position, AccessibilityFeature } from "@/types";
import StandardPageLayout from "@/components/standard-page-layout";
import ContentSection from "@/components/content-section";
import VenueCard from "@/components/venue-card";
import EventCard from "@/components/event-card";
import LinkedList from "@/components/linked-list";
import Button from "@/components/button";
import { CalendarIcon } from "@/components/icons";
import type {
  NearMeVenue,
  NearMeFilmClub,
  NearMeFestival,
  NearMeBorough,
} from "./page";
import styles from "./page.module.css";

function findNearestBorough(
  position: Position,
  boroughs: NearMeBorough[],
): NearMeBorough | null {
  let nearest: NearMeBorough | null = null;
  let nearestDistance = Infinity;

  for (const borough of boroughs) {
    const distance = getDistanceInMiles(position, {
      lat: borough.lat,
      lon: borough.lon,
    });
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = borough;
    }
  }

  if (nearest && nearestDistance <= nearest.radiusMiles) {
    return nearest;
  }

  return null;
}

interface NearMePageContentProps {
  venues: NearMeVenue[];
  filmClubs: NearMeFilmClub[];
  festivals: NearMeFestival[];
  boroughs: NearMeBorough[];
  venueAccessibility: Record<string, AccessibilityFeature[]>;
}

export default function NearMePageContent({
  venues,
  filmClubs,
  festivals,
  boroughs,
  venueAccessibility,
}: NearMePageContentProps) {
  const {
    position: geoPosition,
    loading,
    error,
    requestLocation,
  } = useGeolocationContext();

  const [showPicker, setShowPicker] = useState(false);

  const currentBorough = useMemo(() => {
    if (!geoPosition) return null;
    return findNearestBorough(geoPosition, boroughs);
  }, [geoPosition, boroughs]);

  const isOutsideLondon = !!geoPosition && !currentBorough;

  // Nearby venues sorted by distance
  const nearbyVenues = useMemo(() => {
    if (!geoPosition) return [];
    return venues
      .map((venue) => ({
        ...venue,
        distance: getDistanceInMiles(geoPosition, {
          lat: venue.lat,
          lon: venue.lon,
        }),
      }))
      .filter((v) => v.distance <= NEARBY_RADIUS_MILES)
      .sort((a, b) => a.distance - b.distance);
  }, [geoPosition, venues]);

  const nearbyVenueIds = useMemo(
    () => new Set(nearbyVenues.map((v) => v.id)),
    [nearbyVenues],
  );

  // Film clubs at nearby venues
  const nearbyFilmClubs = useMemo(() => {
    if (nearbyVenueIds.size === 0) return [];
    return filmClubs.filter(
      (club) =>
        club.movieCount > 0 &&
        club.venueIds.some((id) => nearbyVenueIds.has(id)),
    );
  }, [filmClubs, nearbyVenueIds]);

  // Festivals at nearby venues
  const nearbyFestivals = useMemo(() => {
    if (nearbyVenueIds.size === 0) return [];
    return festivals.filter(
      (festival) =>
        festival.movieCount > 0 &&
        festival.venueIds.some((id) => nearbyVenueIds.has(id)),
    );
  }, [festivals, nearbyVenueIds]);

  // Accessibility features at nearby venues
  const nearbyAccessibility = useMemo(() => {
    if (nearbyVenueIds.size === 0) return [];
    const featureVenueCounts = new Map<AccessibilityFeature, number>();

    for (const venueId of nearbyVenueIds) {
      const features = venueAccessibility[venueId];
      if (!features) continue;
      for (const feature of features) {
        featureVenueCounts.set(
          feature,
          (featureVenueCounts.get(feature) ?? 0) + 1,
        );
      }
    }

    return [...featureVenueCounts.entries()]
      .map(([feature, venueCount]) => ({ feature, venueCount }))
      .sort((a, b) => b.venueCount - a.venueCount);
  }, [nearbyVenueIds, venueAccessibility]);

  const handleRequestLocation = useCallback(async () => {
    setShowPicker(false);
    await requestLocation();
  }, [requestLocation]);

  const hasPosition = geoPosition !== null;
  const showResults = hasPosition && !showPicker && !isOutsideLondon;

  let subtitle: string;
  if (loading) {
    subtitle = "Finding your location\u2026";
  } else if (showResults && currentBorough) {
    subtitle = `Showing results near you`;
  } else if (isOutsideLondon) {
    subtitle =
      "You appear to be outside London \u2014 choose a borough to explore";
  } else {
    subtitle =
      "Discover cinemas, film clubs, festivals, and accessible screenings near you";
  }

  const heroExtra = showResults ? (
    <div className={styles.heroMeta}>
      <p className={styles.exploreLinks}>
        {currentBorough && (
          <>
            See all cinemas in{" "}
            <Link href={`/london-cinemas/${currentBorough.slug}`}>
              {currentBorough.name}
            </Link>
            , or browse <Link href="/london-cinemas">all London boroughs</Link>
            .{" "}
          </>
        )}
        <Button
          variant="link"
          onClick={() => setShowPicker(true)}
          className={styles.changeLocationButton}
        >
          Not your area?
        </Button>
      </p>
    </div>
  ) : undefined;

  const boroughPicker = (
    <>
      {showPicker && hasPosition && (
        <div className={styles.locationPrompt}>
          <Button
            variant="primary"
            onClick={handleRequestLocation}
            disabled={loading}
          >
            {loading ? "Finding your location\u2026" : "Use my location"}
          </Button>
        </div>
      )}

      {!showPicker && !hasPosition && (
        <div className={styles.locationPrompt}>
          <Button
            variant="primary"
            onClick={handleRequestLocation}
            disabled={loading}
          >
            {loading ? "Finding your location\u2026" : "Use my location"}
          </Button>
          {error && <p className={styles.errorMessage}>{error}</p>}
        </div>
      )}

      <div className={styles.boroughPickerSection}>
        <h2 className={styles.boroughPickerTitle}>
          {error || isOutsideLondon
            ? "Choose your borough"
            : "Or choose your borough"}
        </h2>
        <div className={styles.boroughGrid}>
          {boroughs.map((borough) => (
            <Link
              key={borough.slug}
              href={`/london-cinemas/${borough.slug}`}
              className={styles.boroughCard}
            >
              <Image
                src={`/images/boroughs/${borough.slug}.png`}
                alt={`Map of ${borough.name}`}
                width={280}
                height={186}
                className={styles.boroughMapImage}
              />
              <div className={styles.boroughCardBody}>
                <span className={styles.boroughName}>{borough.name}</span>
                <span className={styles.boroughVenueCount}>
                  {borough.venueCount}{" "}
                  {borough.venueCount === 1 ? "cinema" : "cinemas"}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <StandardPageLayout
      title="Near You"
      subtitle={subtitle}
      heroExtra={heroExtra}
      backUrl="/"
      backText="Back to film list"
    >
      {!showResults && boroughPicker}

      {showResults && (
        <>
          {nearbyVenues.length > 0 ? (
            <>
              {nearbyFilmClubs.length > 0 && (
                <ContentSection title="Film Clubs Near You" as="h2">
                  <ul className={styles.eventGrid}>
                    {nearbyFilmClubs.map((club) => (
                      <li key={club.id}>
                        <EventCard
                          href={club.href}
                          name={club.name}
                          imagePath={club.imagePath}
                          description={club.seoDescription}
                          meta={
                            <span className={styles.filmCount}>
                              {club.movieCount}{" "}
                              {club.movieCount === 1 ? "film" : "films"}
                            </span>
                          }
                        />
                      </li>
                    ))}
                  </ul>
                </ContentSection>
              )}

              {nearbyFestivals.length > 0 && (
                <ContentSection title="Festivals Near You" as="h2">
                  <ul className={styles.eventGrid}>
                    {nearbyFestivals.map((festival) => (
                      <li key={festival.id}>
                        <EventCard
                          href={festival.href}
                          name={festival.name}
                          imagePath={festival.imagePath}
                          description={festival.seoDescription}
                          meta={
                            <>
                              {festival.dateFrom !== null &&
                                festival.dateTo !== null && (
                                  <span className={styles.metaItem}>
                                    <CalendarIcon size={14} />
                                    {formatDateShort(
                                      new Date(festival.dateFrom),
                                      { includeYearIfDifferent: true },
                                    )}
                                    {new Date(
                                      festival.dateFrom,
                                    ).toDateString() !==
                                      new Date(
                                        festival.dateTo,
                                      ).toDateString() && (
                                      <>
                                        {" "}
                                        &ndash;{" "}
                                        {formatDateShort(
                                          new Date(festival.dateTo),
                                          { includeYearIfDifferent: true },
                                        )}
                                      </>
                                    )}
                                  </span>
                                )}
                              <span className={styles.filmCount}>
                                {festival.movieCount}{" "}
                                {festival.movieCount === 1 ? "film" : "films"}
                              </span>
                            </>
                          }
                        />
                      </li>
                    ))}
                  </ul>
                </ContentSection>
              )}

              {nearbyAccessibility.length > 0 && (
                <ContentSection
                  title="Accessible Screenings"
                  as="h2"
                  className={styles.accessibilitySection}
                  intro={
                    <Link href="/accessibility">
                      Learn more about accessible screenings
                    </Link>
                  }
                >
                  <LinkedList
                    items={nearbyAccessibility.map(
                      ({ feature, venueCount }) => ({
                        key: feature,
                        href: `/accessibility/#${feature}`,
                        label: `${ACCESSIBILITY_EMOJIS[feature as AccessibilityFeature]} ${ACCESSIBILITY_LABELS[feature as AccessibilityFeature]}`,
                        detail: `at ${venueCount} nearby ${venueCount === 1 ? "cinema" : "cinemas"}`,
                      }),
                    )}
                  />
                </ContentSection>
              )}

              <ContentSection
                title={`Cinemas Near You`}
                as="h2"
                intro={`${nearbyVenues.length} cinema${nearbyVenues.length === 1 ? "" : "s"} within ${NEARBY_RADIUS_MILES} miles of you`}
              >
                <div className={styles.venueGrid}>
                  {nearbyVenues.map((venue) => (
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
            </>
          ) : (
            <div className={styles.noResults}>
              <p>
                No cinemas found within {NEARBY_RADIUS_MILES} miles of your
                location.
              </p>
              <Button variant="primary" onClick={() => setShowPicker(true)}>
                Browse by borough instead
              </Button>
            </div>
          )}
        </>
      )}
    </StandardPageLayout>
  );
}
