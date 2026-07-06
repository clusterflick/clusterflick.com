import type { Metadata } from "next";
import Link from "next/link";
import PageWrapper from "@/components/page-wrapper";
import MainHeader from "@/components/main-header";
import OutlineHeading from "@/components/outline-heading";
import Divider from "@/components/divider";
import { ButtonLink } from "@/components/button";
import { getStaticData } from "@/utils/get-static-data";
import { computeDiscoveryRows } from "@/utils/get-discovery-movies";
import { getEditorialSummary } from "@/utils/get-editorial-summary";
import { getNearMeVenues, getNearMeFilmClubs } from "@/utils/get-near-me-data";
import {
  linkifySummary,
  type SummaryLinkTarget,
} from "@/utils/linkify-summary";
import { getMovieUrl } from "@/utils/get-movie-url";
import { getVenueUrl } from "@/utils/get-venue-url";
import DiscoverySections from "./discovery-sections";
import DiscoveryRowsView from "./discovery-rows-view";
import NearYouSection from "./near-you-section";
import styles from "./page.module.css";

export const metadata: Metadata = {
  // The root page shares a segment with the layout that defines the title
  // template, so the "| Clusterflick" suffix isn't applied automatically here.
  title:
    "What's On at London Cinemas — Discover Films Showing Now | Clusterflick",
  description:
    "Discover what's worth seeing across London's 300+ cinemas — the films showing most widely, new additions, last chance screenings, and what's on near you. Every London cinema listing in one place.",
  alternates: {
    canonical: "/",
  },
};

export default async function Home() {
  const data = await getStaticData();
  const summary = getEditorialSummary();

  // Resolve the summary's known entities to canonical hrefs so the prose can be
  // linkified at render — the AI text never carries URLs of its own.
  const summaryTargets: SummaryLinkTarget[] = (summary?.links ?? [])
    .map((link) => {
      if (link.movieId) {
        const movie = data.movies[link.movieId];
        return movie ? { phrase: link.phrase, href: getMovieUrl(movie) } : null;
      }
      if (link.venueId) {
        const venue = data.venues[link.venueId];
        return venue ? { phrase: link.phrase, href: getVenueUrl(venue) } : null;
      }
      return null;
    })
    .filter((target): target is SummaryLinkTarget => target !== null);

  // Build-time snapshot of the rows for SSR / no-JS / slow connections. The
  // client re-computes these against view-time data once it loads (see
  // DiscoverySections), so lapsed showings drop out.
  const serverRows = computeDiscoveryRows(data.movies);

  const nearMeVenues = getNearMeVenues(data);
  // Count all of a club's current films (matching the club page), not just this
  // week's — otherwise the tile count differs from the club page on click-through.
  const nearMeFilmClubs = await getNearMeFilmClubs(data);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Clusterflick",
            description: "Every London cinema listing in one place",
            url: "https://clusterflick.com",
          }),
        }}
      />
      <MainHeader showFilters={false} />
      <PageWrapper className={styles.page}>
        <header className={styles.intro}>
          <OutlineHeading as="h1" className={styles.introTitle}>
            What&apos;s On at London Cinemas
          </OutlineHeading>
          <p className={styles.introLead}>
            Clusterflick brings every film screening across 300+ London venues
            into one place.
            <br />
            From blockbusters at{" "}
            <Link href="/cinema-groups/picturehouse">
              Picturehouses
            </Link> and <Link href="/cinema-groups/everyman">Everyman</Link> to
            independent gems at the{" "}
            <Link href="/venues/bfi-southbank">BFI</Link>,{" "}
            <Link href="/venues/genesis-cinema">Genesis</Link> and the{" "}
            <Link href="/venues/prince-charles-cinema">Prince Charles</Link>{" "}
            cinemas.
          </p>
          {summary && (
            <>
              <Divider />
              <div className={styles.summary} data-source={summary.source}>
                {summary.text
                  .split(/(?:\\n|\n)+/)
                  .filter((para) => para.trim().length > 0)
                  .map((para, index) => (
                    <p key={index}>{linkifySummary(para, summaryTargets)}</p>
                  ))}
              </div>
            </>
          )}
        </header>

        <div className={styles.sections}>
          <div className={styles.browseCta}>
            <ButtonLink href="/films">Browse all films →</ButtonLink>
          </div>

          <DiscoverySections
            fallback={<DiscoveryRowsView rows={serverRows} />}
          />

          <div className={styles.browseCta}>
            <ButtonLink href="/films">Browse all films →</ButtonLink>
          </div>

          <Divider />

          <NearYouSection venues={nearMeVenues} filmClubs={nearMeFilmClubs} />
        </div>
      </PageWrapper>
    </>
  );
}
