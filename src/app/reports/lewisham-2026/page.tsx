import type { Metadata } from "next";
import Link from "next/link";
import StandardPageLayout from "@/components/standard-page-layout";
import ContentSection from "@/components/content-section";
import RankedBarChart from "@/components/ranked-bar-chart";
import VenueCard from "@/components/venue-card";
import { ButtonLink } from "@/components/button";
import { LONDON_BOROUGHS } from "@/data/london-boroughs";
import { VENUE_GROUPS } from "@/data/venue-groups";
import { LEWISHAM_2026 as DATA } from "@/data/reports/lewisham-2026";
import { getBoroughUrl } from "@/utils/get-borough-url";
import { getVenueUrl } from "@/utils/get-venue-url";
import { getVenueImagePath } from "@/utils/get-venue-image";
import { getVenueGroupUrl } from "@/utils/get-venue-group-url";
import { formatReportDate } from "../format-report-date";
import styles from "./page.module.css";

const TIME_OUT_CLOSURE =
  "https://www.timeout.com/london/news/lewishams-only-cinema-has-just-been-shuttered-and-the-community-is-reeling-110424";
const LADYWELL_LIVE_DELAY =
  "https://ladywell-live.org/2026/09/26/independent-group-castle-cinema-to-take-over-former-catford-mews-site-and-open-cinema-in-the-summer/";

const fmt = (n: number) => n.toLocaleString("en-GB");
const screeningsIn = (slug: string) =>
  DATA.boroughs.find((b) => b.slug === slug)!.screenings;

const lewisham = screeningsIn("lewisham");
const runnerUp = DATA.boroughs.at(-2)!;
const runnerUpName = LONDON_BOROUGHS.find(
  (b) => b.slug === runnerUp.slug,
)!.name;
const screeningShare = (lewisham / DATA.londonScreenings) * 100;
const populationShare =
  (DATA.population.lewisham / DATA.population.london) * 100;
const busiestMonth = Object.entries(DATA.lewishamByMonth).sort(
  (a, b) => b[1] - a[1],
)[0];
const communityCinemas = DATA.lewishamVenues.filter(
  (v) => v.type === "Community Cinema",
);
const castleCinema = VENUE_GROUPS.find((g) => g.slug === "castle-cinema")!;

// "14:30" → "2:30pm"
const [passHour, passMinute] = DATA.westminsterPassesLewishamAt
  .split(":")
  .map(Number);
const westminsterPassesAt = `${passHour % 12 || 12}${
  passMinute ? `:${String(passMinute).padStart(2, "0")}` : ""
}${passHour < 12 ? "am" : "pm"}`;

// Venues first followed after the year's opening weeks: whatever they screened
// before then can't be in the count.
const addedLater = DATA.lewishamVenues.filter(
  (v) => v.followedFrom > "2026-02",
);
const addedLaterScreenings = addedLater.reduce((n, v) => n + v.screenings, 0);

const period = `${formatReportDate(DATA.from)} to ${formatReportDate(DATA.to)}`;

const title = "Lewisham's Year Without a Cinema";
const description = `From ${period}, Lewisham had ${lewisham} film screenings: as many as Westminster has by ${westminsterPassesAt} on a typical day. A Clusterflick report on London's only borough without a cinema.`;

export const metadata: Metadata = {
  title: `${title} — ${lewisham} Screenings in 2026`,
  description,
  alternates: { canonical: "/reports/lewisham-2026" },
  openGraph: {
    type: "article",
    title: `${title} | Clusterflick`,
    description,
    url: "https://clusterflick.com/reports/lewisham-2026",
    siteName: "Clusterflick",
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} | Clusterflick`,
    description,
    creator: "@clusterflick",
  },
};

export default function Lewisham2026Report() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Report",
      headline: title,
      description,
      url: "https://clusterflick.com/reports/lewisham-2026",
      temporalCoverage: `${DATA.from}/${DATA.to}`,
      spatialCoverage: { "@type": "Place", name: "London Borough of Lewisham" },
      publisher: { "@type": "Organization", name: "Clusterflick" },
      license: "https://creativecommons.org/licenses/by/4.0/",
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://clusterflick.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Reports",
          item: "https://clusterflick.com/reports",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: title,
          item: "https://clusterflick.com/reports/lewisham-2026",
        },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <StandardPageLayout
        title={title}
        subtitle={`A Clusterflick report · Data from ${period}`}
        backUrl="/reports"
        backText="All reports"
      >
        <div className={styles.lead}>
          <p>
            Since Catford Mews{" "}
            <a
              href={TIME_OUT_CLOSURE}
              target="_blank"
              rel="noopener noreferrer"
            >
              closed in October 2024
            </a>
            , Lewisham has been the only London borough without a cinema. Two
            years on, it is still waiting:{" "}
            <Link href={getVenueGroupUrl(castleCinema)}>The Castle Cinema</Link>{" "}
            plans to reopen the site, but{" "}
            <a
              href={LADYWELL_LIVE_DELAY}
              target="_blank"
              rel="noopener noreferrer"
            >
              as of September its lease had yet to be signed
            </a>
            .
          </p>
          <p>
            Clusterflick collects the listings of every place we can find that
            screens films in London: cinemas, but also libraries, pubs,
            universities and community centres. From {period}, we found{" "}
            {fmt(DATA.londonScreenings)} film screenings across London.{" "}
            {lewisham} of them were in Lewisham.
          </p>
        </div>

        <dl className={styles.stats}>
          <div className={styles.stat}>
            <dt>Film screenings in Lewisham, all year</dt>
            <dd>{lewisham}</dd>
          </div>
          <div className={styles.stat}>
            <dt>By then on a typical day, Westminster has screened as many</dt>
            <dd>{westminsterPassesAt}</dd>
          </div>
          <div className={styles.stat}>
            <dt>
              Lewisham&apos;s share of London&apos;s film screenings. It is home
              to {populationShare.toFixed(1)}% of Londoners.
            </dt>
            <dd>{screeningShare.toFixed(2)}%</dd>
          </div>
        </dl>

        <ContentSection
          title="Every borough"
          intro={`Lewisham's bar is there: it is ${lewisham} screenings long. The next lowest, the ${runnerUpName}, had ${fmt(runnerUp.screenings)}.`}
        >
          <RankedBarChart
            caption={`Film screenings by borough, ${period}`}
            labelHeading="Borough"
            valueHeading="Film screenings"
            items={DATA.boroughs.map((b) => {
              const borough = LONDON_BOROUGHS.find((x) => x.slug === b.slug)!;
              return {
                key: b.slug,
                label: borough.name,
                value: b.screenings,
                href: getBoroughUrl(borough),
                highlight: b.slug === "lewisham",
              };
            })}
          />
        </ContentSection>

        <ContentSection
          title={`Where Lewisham's ${lewisham} screenings were`}
          intro={`None is a cinema with a regular programme. The busiest month was ${new Date(`${busiestMonth[0]}-01T12:00:00Z`).toLocaleDateString("en-GB", { month: "long", timeZone: "UTC" })}, with ${busiestMonth[1]}.`}
        >
          <div className={styles.venueGrid}>
            {DATA.lewishamVenues.map((venue) => (
              <VenueCard
                key={venue.id}
                href={getVenueUrl(venue)}
                name={venue.name}
                type={venue.type}
                imagePath={getVenueImagePath(venue.id)}
                detail={`${venue.screenings} ${venue.screenings === 1 ? "screening" : "screenings"} this year`}
              />
            ))}
          </div>
          <p className={styles.body}>
            Two are volunteer-run community cinemas,{" "}
            {communityCinemas.map((v) => v.name).join(" and ")}, which screened{" "}
            {communityCinemas.reduce((sum, v) => sum + v.screenings, 0)} films
            between them. The borough&apos;s best-known volunteer cinema,{" "}
            <Link href="/film-clubs/deptford-cinema">Deptford Cinema</Link>,
            lost its home on Deptford Broadway in 2020 and has screened as
            pop-ups ever since.
          </p>
          <ButtonLink href="/london-cinemas/lewisham">
            What&apos;s on in Lewisham now
          </ButtonLink>
        </ContentSection>

        <ContentSection title="How we counted">
          <ul className={styles.method}>
            <li>
              <strong>What counts.</strong> A film screening is one listed with
              a date and time: a film, a shorts programme, a double bill or a TV
              screening. Talks, live music and other events are left out, in
              Lewisham and everywhere else.
            </li>
            <li>
              <strong>What actually screened.</strong> Clusterflick&apos;s
              listings only look ahead, so we rebuilt the year from the copies
              we save every day: each screening is counted once, from the last
              copy before it happened. A screening cancelled before then
              isn&apos;t counted.
            </li>
            <li>
              <strong>Clusterflick grew through the year.</strong> We follow
              more venues all the time: across London,{" "}
              {DATA.venuesWithScreeningsInJanuary} had screenings in January and{" "}
              {DATA.venuesWithScreenings} by October. A venue&apos;s screenings
              count from when we began following it. Most of Lewisham&apos;s
              came from venues we have followed since January; the{" "}
              {addedLater.length} we added later account for{" "}
              {addedLaterScreenings} of the {lewisham}. If you know of
              screenings in Lewisham we missed, tell us at{" "}
              <a href="mailto:hello@clusterflick.com">hello@clusterflick.com</a>
              .
            </li>
            <li>
              <strong>Population.</strong> ONS mid-2024 estimates: Lewisham{" "}
              {fmt(DATA.population.lewisham)}, London{" "}
              {fmt(DATA.population.london)}.
            </li>
            <li>
              <strong>Using these numbers.</strong> They&apos;re free to use
              with credit, under CC BY 4.0 like the data behind them: see our{" "}
              <Link href="/data-licence">data licence</Link>. Please credit
              Clusterflick and link to this page.
            </li>
          </ul>
        </ContentSection>
      </StandardPageLayout>
    </>
  );
}
