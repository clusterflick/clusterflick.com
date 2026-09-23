"use client";

import { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCinemaData } from "@/state/cinema-data-context";
import { useNearMe } from "@/hooks/use-near-me";
import {
  getDistanceInMiles,
  formatShortDistance,
  NEARBY_MAX_RADIUS_MILES,
} from "@/utils/geo-distance";
import { LOCAL_MIN_SCREENINGS } from "@/utils/get-local-venues";
import { computeNearMeRows } from "@/utils/get-discovery-movies";
import {
  ACCESSIBILITY_LABELS,
  ACCESSIBILITY_EMOJIS,
} from "@/utils/accessibility-labels";
import { formatDateShort } from "@/utils/format-date";
import type { Position, AccessibilityFeature } from "@/types";
import StandardPageLayout from "@/components/standard-page-layout";
import ContentSection from "@/components/content-section";
import ColumnsLayout from "@/components/columns-layout";
import VenueMap from "@/components/venue-map";
import LocalVenues from "@/components/local-venues";
import PosterRow from "@/components/poster-row";
import LinkedList from "@/components/linked-list";
import Button, { ButtonLink } from "@/components/button";
import type {
  NearMeVenue,
  NearMeFilmClub,
  NearMeFestival,
  NearMeBorough,
} from "./page";
import styles from "./page.module.css";

// Cinemas listed before the "show all" toggle.
const CINEMA_LIST_INITIAL = 10;

function formatFestivalDates(festival: NearMeFestival): string | undefined {
  if (festival.dateFrom === null || festival.dateTo === null) return undefined;
  const from = new Date(festival.dateFrom);
  const to = new Date(festival.dateTo);
  const fromLabel = formatDateShort(from, { includeYearIfDifferent: true });
  if (from.toDateString() === to.toDateString()) return fromLabel;
  return `${fromLabel} – ${formatDateShort(to, { includeYearIfDifferent: true })}`;
}

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
    nearbyVenues,
    nearbyVenueIds,
    todayHref,
    locals,
    dataReady,
  } = useNearMe(venues, filmClubs);
  const { movies } = useCinemaData();

  const [showPicker, setShowPicker] = useState(false);

  const currentBorough = useMemo(() => {
    if (!geoPosition) return null;
    return findNearestBorough(geoPosition, boroughs);
  }, [geoPosition, boroughs]);

  const isOutsideLondon = !!geoPosition && !currentBorough;

  // The home page's rows, answered for the nearby venues. Computed against the
  // view-time listings, so they only appear once those have loaded.
  const rows = useMemo(
    () =>
      dataReady && nearbyVenueIds.size > 0
        ? computeNearMeRows(movies, nearbyVenueIds)
        : null,
    [dataReady, movies, nearbyVenueIds],
  );

  // Film pages opened from the rows show every upcoming nearby showing, not
  // just the next week's — the same `base=all` the venue page's rows use.
  const movieUrlParams = useMemo(
    () =>
      `base=all&venues=${[...nearbyVenueIds].map(encodeURIComponent).join(",")}`,
    [nearbyVenueIds],
  );

  const localIds = useMemo(
    () => new Set((locals ?? []).map(({ venue }) => venue.id)),
    [locals],
  );

  const nearbyMapVenues = useMemo(
    () =>
      nearbyVenues.map((v) => ({
        id: v.id,
        name: v.name,
        href: v.href,
        type: v.type,
        lat: v.lat,
        lon: v.lon,
        filmCount: v.filmCount,
        highlighted: localIds.has(v.id),
      })),
    [nearbyVenues, localIds],
  );

  const nearbyFilmClubs = useMemo(
    () =>
      filmClubs.filter(
        (club) =>
          club.movieCount > 0 &&
          club.venueIds.some((id) => nearbyVenueIds.has(id)),
      ),
    [filmClubs, nearbyVenueIds],
  );

  const nearbyFestivals = useMemo(
    () =>
      festivals.filter(
        (festival) =>
          festival.movieCount > 0 &&
          festival.venueIds.some((id) => nearbyVenueIds.has(id)),
      ),
    [festivals, nearbyVenueIds],
  );

  const nearbyAccessibility = useMemo(() => {
    const featureVenueCounts = new Map<AccessibilityFeature, number>();
    for (const venueId of nearbyVenueIds) {
      for (const feature of venueAccessibility[venueId] ?? []) {
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
  } else if (showResults) {
    subtitle = "Your local cinemas and what\u2019s on near you";
  } else if (isOutsideLondon) {
    subtitle =
      "You appear to be outside London \u2014 choose a borough to explore";
  } else {
    subtitle =
      "Your local cinemas, what\u2019s on at them, and the film clubs and festivals nearby";
  }

  const heroExtra = showResults ? (
    <div className={styles.heroMeta}>
      {todayHref && (
        <ButtonLink href={todayHref}>What&apos;s on near me today →</ButtonLink>
      )}
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

  const hasSidebar =
    nearbyFilmClubs.length > 0 ||
    nearbyFestivals.length > 0 ||
    nearbyAccessibility.length > 0;

  return (
    <StandardPageLayout
      title="Near Me"
      subtitle={subtitle}
      heroExtra={heroExtra}
    >
      {!showResults && boroughPicker}

      {showResults && nearbyVenues.length === 0 && (
        <div className={styles.noResults}>
          <p>
            No cinemas with screenings found within {NEARBY_MAX_RADIUS_MILES}{" "}
            miles of your location.
          </p>
          <Button variant="primary" onClick={() => setShowPicker(true)}>
            Browse by borough instead
          </Button>
        </div>
      )}

      {showResults && nearbyVenues.length > 0 && (
        <>
          <ContentSection
            title="Your Locals"
            as="h2"
            intro={`The closest cinemas with more than ${LOCAL_MIN_SCREENINGS} screenings this week.`}
          >
            {locals === null ? (
              <p className={styles.pending}>Finding what&apos;s on…</p>
            ) : locals.length > 0 ? (
              <LocalVenues locals={locals} />
            ) : (
              <p className={styles.pending}>
                None of the cinemas near you has more than{" "}
                {LOCAL_MIN_SCREENINGS} screenings this week — see them all
                below.
              </p>
            )}
          </ContentSection>

          {rows && (
            <div className={styles.rows}>
              <PosterRow
                title="Critics' Picks Near Me"
                intro="Highly rated films showing nearby this week."
                movies={rows.criticsPicks}
                movieUrlParams={movieUrlParams}
              />
              <PosterRow
                title="More Than a Screening Near Me"
                intro="Q&As, live scores and premieres nearby — nights you can't catch on another date."
                movies={rows.occasions}
                movieUrlParams={movieUrlParams}
              />
              <PosterRow
                title="Just Added Near Me"
                intro="Screenings added nearby in the past week."
                movies={rows.justAdded}
                movieUrlParams={movieUrlParams}
              />
              <PosterRow
                title="Marathons & Double Bills Near Me"
                intro="Multi-film events and double bills showing nearby this week."
                movies={rows.marathons}
                movieUrlParams={movieUrlParams}
              />
              <PosterRow
                title="Last Chance Near Me"
                intro="Films with their final nearby showing coming up soon."
                movies={rows.lastChance}
                movieUrlParams={movieUrlParams}
              />
            </div>
          )}

          <div className={styles.mapSection}>
            <VenueMap venues={nearbyMapVenues} distanceRingsMiles={[1, 2]} />
          </div>

          <ColumnsLayout
            main={
              <ContentSection
                title="Cinemas Near Me"
                as="h2"
                intro={`${nearbyVenues.length} ${nearbyVenues.length === 1 ? "cinema" : "cinemas"} with screenings, closest first.`}
              >
                <LinkedList
                  items={nearbyVenues.map((venue) => ({
                    key: venue.id,
                    href: venue.href,
                    label: venue.name,
                    detail: `${formatShortDistance(venue.distance)} · ${venue.filmCount.toLocaleString("en-GB")} ${venue.filmCount === 1 ? "film" : "films"}`,
                  }))}
                  initialCount={CINEMA_LIST_INITIAL}
                  showAllLabel={`Show all ${nearbyVenues.length} nearby cinemas`}
                />
              </ContentSection>
            }
            sidebar={
              hasSidebar ? (
                <>
                  {nearbyFilmClubs.length > 0 && (
                    <ContentSection title="Film Clubs Near Me" as="h2">
                      <LinkedList
                        items={nearbyFilmClubs.map((club) => ({
                          key: club.id,
                          href: club.href,
                          label: club.name,
                          detail: `${club.movieCount} ${club.movieCount === 1 ? "film" : "films"}`,
                        }))}
                      />
                    </ContentSection>
                  )}
                  {nearbyFestivals.length > 0 && (
                    <ContentSection title="Festivals Near Me" as="h2">
                      <LinkedList
                        items={nearbyFestivals.map((festival) => ({
                          key: festival.id,
                          href: festival.href,
                          label: festival.name,
                          detail: formatFestivalDates(festival),
                        }))}
                      />
                    </ContentSection>
                  )}
                  {nearbyAccessibility.length > 0 && (
                    <ContentSection
                      title="Accessible Screenings"
                      as="h2"
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
                            label: `${ACCESSIBILITY_EMOJIS[feature]} ${ACCESSIBILITY_LABELS[feature]}`,
                            detail: `at ${venueCount} nearby ${venueCount === 1 ? "cinema" : "cinemas"}`,
                          }),
                        )}
                      />
                    </ContentSection>
                  )}
                </>
              ) : null
            }
          />
        </>
      )}
    </StandardPageLayout>
  );
}
