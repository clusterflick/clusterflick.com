"use client";

import Link from "next/link";
import { useNearMe } from "@/hooks/use-near-me";
import { NEARBY_MAX_RADIUS_MILES } from "@/utils/geo-distance";
import { LOCAL_MIN_SCREENINGS } from "@/utils/get-local-venues";
import type { NearMeVenue, NearMeFilmClub } from "@/utils/get-near-me-data";
import ContentSection from "@/components/content-section";
import LocalVenues from "@/components/local-venues";
import Button, { ButtonLink } from "@/components/button";
import styles from "./near-me-section.module.css";

interface NearMeSectionProps {
  venues: NearMeVenue[];
  filmClubs: NearMeFilmClub[];
}

/**
 * The home page's slice of `/near-me`: the reader's locals and the link to
 * what's on near them today. Shares `useNearMe` with the page, so the locals
 * here are the locals there.
 */
export default function NearMeSection({
  venues,
  filmClubs,
}: NearMeSectionProps) {
  const {
    position,
    loading,
    error,
    requestLocation,
    nearbyVenues,
    todayHref,
    locals,
  } = useNearMe(venues, filmClubs);

  // Collapsed, opt-in state: just a prompt until the user shares their location.
  if (!position) {
    return (
      <section className={styles.prompt}>
        <h2 className={styles.promptTitle}>What&apos;s on near me?</h2>
        <p className={styles.promptText}>
          Find your local cinemas, what&apos;s on at them next, and the film
          clubs screening there.
        </p>
        <Button onClick={() => requestLocation()} disabled={loading}>
          {loading ? "Finding your location…" : "See what's on near me"}
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
          We couldn&apos;t find any cinemas with screenings within{" "}
          {NEARBY_MAX_RADIUS_MILES} miles of you.{" "}
          <Link href="/near-me">Browse by borough instead</Link>.
        </p>
      </section>
    );
  }

  return (
    <div className={styles.results}>
      <ContentSection
        title="Your Locals"
        as="h2"
        intro={`The closest cinemas with more than ${LOCAL_MIN_SCREENINGS} screenings this week.`}
        action={<Link href="/near-me">More near me →</Link>}
      >
        {locals === null ? (
          <p className={styles.pending}>Finding what&apos;s on…</p>
        ) : locals.length > 0 ? (
          <LocalVenues locals={locals} />
        ) : (
          <p className={styles.pending}>
            None of the cinemas near you has more than {LOCAL_MIN_SCREENINGS}{" "}
            screenings this week.{" "}
            <Link href="/near-me">See every cinema near me</Link>.
          </p>
        )}
      </ContentSection>
      {todayHref && (
        <div className={styles.cta}>
          <ButtonLink href={todayHref}>
            What&apos;s on near me today →
          </ButtonLink>
        </div>
      )}
    </div>
  );
}
