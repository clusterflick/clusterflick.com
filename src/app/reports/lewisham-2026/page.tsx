import type { Metadata } from "next";
import Link from "next/link";
import StandardPageLayout from "@/components/standard-page-layout";
import ContentSection from "@/components/content-section";
import LinkedList from "@/components/linked-list";
import RankedBarChart from "@/components/ranked-bar-chart";
import { ButtonLink } from "@/components/button";
import { LONDON_BOROUGHS } from "@/data/london-boroughs";
import { LEWISHAM_2026 as DATA } from "@/data/reports/lewisham-2026";
import { getBoroughUrl } from "@/utils/get-borough-url";
import { getVenueUrl } from "@/utils/get-venue-url";
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
const westminster = screeningsIn("westminster");
const westminsterPerDay = Math.round(westminster / DATA.days);
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
const period = `${formatReportDate(DATA.from)} to ${formatReportDate(DATA.to)}`;

const title = "Lewisham's Year Without a Cinema";
const description = `From ${period}, Lewisham had ${lewisham} film screenings. Westminster averaged ${westminsterPerDay} a day. A Clusterflick report on London's only borough without a cinema.`;

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
            years on, it is still waiting: The Castle Cinema plans to reopen the
            site, but{" "}
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
            universities and community centres. From {period}, they listed{" "}
            {fmt(DATA.londonScreenings)} film screenings. {lewisham} of them
            were in Lewisham.
          </p>
        </div>

        <dl className={styles.stats}>
          <div className={styles.stat}>
            <dt>Film screenings in Lewisham in 2026 so far</dt>
            <dd>{lewisham}</dd>
          </div>
          <div className={styles.stat}>
            <dt>Film screenings a day, on average, in Westminster</dt>
            <dd>{westminsterPerDay}</dd>
          </div>
          <div className={styles.stat}>
            <dt>
              Lewisham&apos;s share of London&apos;s screenings, for{" "}
              {populationShare.toFixed(1)}% of its residents
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
          <LinkedList
            items={DATA.lewishamVenues.map((venue) => ({
              key: venue.name,
              href: getVenueUrl(venue),
              label: venue.name,
              detail: `${venue.type} · ${venue.screenings} ${venue.screenings === 1 ? "screening" : "screenings"}`,
            }))}
          />
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
              <strong>Counted once, from the listings.</strong> Clusterflick
              publishes London&apos;s listings at least once a day. Each
              day&apos;s first copy supplied the screenings up to the next
              day&apos;s, so every screening is counted once, as it was listed
              shortly before it happened. One cancelled before then isn&apos;t
              counted; one cancelled later may be.
            </li>
            <li>
              <strong>Coverage grew through the year.</strong>{" "}
              {DATA.venuesWithScreeningsInJanuary} venues had screenings listed
              in January and {DATA.venuesWithScreenings} by October, as we found
              and added more. A venue counts from when we began following it.
              Lewisham&apos;s figure is every screening we could find there: if
              you know of one we missed, tell us at{" "}
              <a href="mailto:hello@clusterflick.com">hello@clusterflick.com</a>
              .
            </li>
            <li>
              <strong>Boroughs.</strong> Each venue is placed in a borough by
              its location, as on our{" "}
              <Link href="/london-cinemas">borough pages</Link>.
            </li>
            <li>
              <strong>Population.</strong> ONS mid-2024 estimates: Lewisham{" "}
              {fmt(DATA.population.lewisham)}, London{" "}
              {fmt(DATA.population.london)}.
            </li>
            <li>
              <strong>Using these numbers.</strong> They&apos;re free to use
              with credit, under the same{" "}
              <Link href="/data-licence">CC BY 4.0 licence</Link> as the data
              behind them. Please credit Clusterflick and link to this page.
            </li>
          </ul>
        </ContentSection>
      </StandardPageLayout>
    </>
  );
}
