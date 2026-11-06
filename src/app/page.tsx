import type { Metadata } from "next";
import Link from "next/link";
import PageWrapper from "@/components/page-wrapper";
import MainHeader from "@/components/main-header";
import SiteFooter from "@/components/site-footer";
import OutlineHeading from "@/components/outline-heading";
import { ButtonLink } from "@/components/button";
import { getStaticData } from "@/utils/get-static-data";
import { computeDiscoveryRows } from "@/utils/get-discovery-movies";
import { getEditorialSummary } from "@/utils/get-editorial-summary";
import {
  linkifySummary,
  type SummaryLinkTarget,
} from "@/utils/linkify-summary";
import { getMovieUrl, SHOW_ALL_HASH } from "@/utils/get-movie-url";
import { getVenueUrl } from "@/utils/get-venue-url";
import { getFormatUrl } from "@/utils/get-format-url";
import { FORMATS } from "@/data/formats";
import StatsBand, { type StatsBandItem } from "@/components/stats-band";
import { getFeaturedScreenings } from "@/utils/get-featured-screenings";
import { getListingsStats } from "@/utils/get-listings-stats";
import { formatDayAndDate, formatShowingTime } from "@/utils/format-date";
import { FormatSource } from "@/types";
import DiscoverySections from "./discovery-sections";
import { FeaturedHero, FeaturedPicks } from "./featured-screenings";
import DiscoveryRowsView from "./discovery-rows-view";
import WatchlistRow from "./watchlist-row";
import ReleaseDot from "@/components/release-dot";
import styles from "./page.module.css";
import { VENUE_COUNT } from "@/utils/venue-count";

export const metadata: Metadata = {
  // The root page shares a segment with the layout that defines the title
  // template, so the "| Clusterflick" suffix isn't applied automatically here.
  title:
    "What's On at London Cinemas — Discover Films Showing Now | Clusterflick",
  description: `Discover what's worth seeing across ${VENUE_COUNT} London venues — the films showing most widely, new additions and last chance screenings.`,
  alternates: {
    canonical: "/",
  },
};

export default async function Home() {
  const data = await getStaticData();
  const summary = getEditorialSummary();

  // Resolve the summary's known entities to canonical hrefs so the prose can be
  // linkified at render — the AI text never carries URLs of its own.
  const summaryEntityTargets: SummaryLinkTarget[] = (summary?.links ?? [])
    .map((link) => {
      if (link.movieId) {
        const movie = data.movies[link.movieId];
        // The summary names a film for a reason the reader's own filters may
        // hide, so open the page on the full schedule (as the discovery rows do).
        return movie
          ? {
              phrase: link.phrase,
              href: `${getMovieUrl(movie)}${SHOW_ALL_HASH}`,
            }
          : null;
      }
      if (link.venueId) {
        const venue = data.venues[link.venueId];
        return venue ? { phrase: link.phrase, href: getVenueUrl(venue) } : null;
      }
      return null;
    })
    .filter((target): target is SummaryLinkTarget => target !== null);

  // Format terms (e.g. "35mm", "IMAX", "3D") appear in the AI prose but aren't
  // in the summary's links. Every format has a permanent landing page, so link
  // each one by its display name wherever it's mentioned.
  const formatTargets: SummaryLinkTarget[] = FORMATS.map((format) => ({
    phrase: format.name,
    href: getFormatUrl(format),
  }));

  const summaryTargets: SummaryLinkTarget[] = [
    ...summaryEntityTargets,
    ...formatTargets,
  ];

  // Build-time snapshot of the rows for SSR / no-JS / slow connections. The
  // client re-computes these against view-time data once it loads (see
  // DiscoverySections), so lapsed showings drop out.
  const serverRows = computeDiscoveryRows(data.movies, {
    collections: data.collections,
  });

  // The films the summary names, with why and when, and the week's scale. Both
  // are build-time snapshots; the featured screenings re-check the reader's
  // clock on the client so a lapsed showing drops out.
  const builtAt = new Date().toISOString();
  const now = Date.parse(builtAt);
  const featured = getFeaturedScreenings(summary, data, now);
  const stats = getListingsStats(data, now);
  const thirtyFiveMm = FORMATS.find(
    (format) => format.id === FormatSource.ThirtyFiveMm,
  );
  const statItems: StatsBandItem[] = [
    {
      id: "films",
      value: stats.films,
      label: "Films",
      detail: "showing this week",
      href: "/catalogue",
    },
    {
      id: "screenings",
      value: stats.screenings,
      label: "Screenings",
      detail: "in the next 7 days",
      href: "/planner",
    },
    {
      id: "venues",
      value: stats.venues,
      label: "Venues",
      detail: `screening, of ${stats.venuesTracked} we track`,
      href: "/venues",
    },
  ];
  if (thirtyFiveMm && stats.thirtyFiveMm.screenings > 0) {
    statItems.push({
      id: "35mm",
      value: stats.thirtyFiveMm.screenings,
      label: "On 35mm",
      detail: `${stats.thirtyFiveMm.films} ${stats.thirtyFiveMm.films === 1 ? "film" : "films"} on celluloid`,
      href: getFormatUrl(thirtyFiveMm),
      highlight: true,
    });
  }
  const updatedAt = Date.parse(data.generatedAt);

  const summaryProse = summary
    ? summary.text
        .split(/(?:\\n|\n)+/)
        .filter((para) => para.trim().length > 0)
        .map((para, index) => (
          <p key={index}>{linkifySummary(para, summaryTargets)}</p>
        ))
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Clusterflick",
            description: "Every film showing in London",
            url: "https://clusterflick.com",
          }),
        }}
      />
      <MainHeader showFilters={false} />
      <PageWrapper
        className={featured.length > 0 ? styles.pageWithFeature : styles.page}
      >
        {featured.length > 0 && (
          <FeaturedHero featured={featured} builtAt={builtAt} />
        )}

        <header className={styles.intro}>
          <OutlineHeading as="h1" className={styles.introTitle}>
            Every Film Showing in London
          </OutlineHeading>
          <p className={styles.introLead}>
            From blockbusters at{" "}
            <Link href="/cinema-groups/picturehouse">Picturehouses</Link> and{" "}
            <Link href="/cinema-groups/everyman">Everyman</Link> to independent
            gems at the <Link href="/venues/bfi-southbank">BFI</Link>,{" "}
            <Link href="/venues/genesis-cinema">Genesis</Link> and the{" "}
            <Link href="/venues/prince-charles-cinema">Prince Charles</Link>{" "}
            cinemas.
          </p>
          <StatsBand items={statItems} label="This week in London" />
          {!Number.isNaN(updatedAt) && (
            <p className={styles.freshness}>
              <ReleaseDot />
              Listings updated {formatShowingTime(updatedAt)},{" "}
              {formatDayAndDate(updatedAt)}
            </p>
          )}
        </header>

        {featured.length > 0 ? (
          <FeaturedPicks
            featured={featured}
            builtAt={builtAt}
            summary={summaryProse}
          />
        ) : (
          // A summary with nothing to feature (one written before highlights
          // existed) is shown as prose, as it always was.
          summaryProse && (
            <div className={styles.summaryFallback}>
              <div className={styles.summary} data-source={summary?.source}>
                {summaryProse}
              </div>
            </div>
          )
        )}

        <div className={styles.sections}>
          <div className={styles.browseCta}>
            <ButtonLink href="/catalogue">Browse all films →</ButtonLink>
          </div>

          <WatchlistRow />

          <DiscoverySections
            fallback={
              <DiscoveryRowsView rows={serverRows} venues={data.venues} />
            }
          />

          <div className={styles.browseCta}>
            <ButtonLink href="/catalogue">Browse all films →</ButtonLink>
          </div>
        </div>
        <SiteFooter />
      </PageWrapper>
    </>
  );
}
