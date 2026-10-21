import type { Metadata } from "next";
import Link from "next/link";
import StandardPageLayout from "@/components/standard-page-layout";
import ContentSection from "@/components/content-section";
import RankedBarChart from "@/components/ranked-bar-chart";
import { ButtonLink } from "@/components/button";
import { LONDON_CINEMAS_2026 as DATA } from "@/data/reports/london-cinemas-2026";
import { getVenueUrl } from "@/utils/get-venue-url";
import { formatReportDate } from "../format-report-date";
import styles from "./page.module.css";

type RankedVenue = {
  id: string;
  name: string;
  current: boolean;
  value: number;
};

const fmt = (n: number) => n.toLocaleString("en-GB");
const percent = (n: number) => `${Math.round(n)}%`;
const period = `${formatReportDate(DATA.from)} to ${formatReportDate(DATA.to)}`;

/** Ranked venues as chart rows: the leader emphasised, each linked if open. */
const venueRows = (venues: readonly RankedVenue[]) =>
  venues.map((venue, index) => ({
    key: venue.id,
    label: venue.name,
    value: venue.value,
    href: venue.current ? getVenueUrl(venue) : undefined,
    highlight: index === 0,
  }));

const venueLink = (venue: { name: string }) => (
  <Link href={getVenueUrl(venue)}>{venue.name}</Link>
);

const [topFilm] = DATA.mostScreenedFilms;
const notCinemas = DATA.venuesWithScreenings - DATA.venueTypes.Cinema;
const [nickel, , closeUp] = DATA.repertory;
const [mostFilms, secondMostFilms] = DATA.mostDifferentFilms;
const [printLeader, printRunnerUp] = DATA.printVenues;
const nonOdysseyPrints = DATA.printScreenings - DATA.odysseyPrintScreenings;
const [relaxedLeader, relaxedRunnerUp] = DATA.relaxed.leaders;
const [hohLeader, hohRunnerUp] = DATA.hardOfHearing.leaders;
const ilford = DATA.nonEnglish.find((v) => v.name === "Cineworld Ilford")!;
// The copy names Ilford as having the most non-English screenings too.
if (DATA.mostNonEnglishScreenings.id !== ilford.id) {
  throw new Error(
    "Cineworld Ilford no longer has the most non-English screenings",
  );
}
const [mostLanguages] = DATA.mostLanguages;

const title = "London's Cinemas in 2026";
const description = `Who shows what in London: the most adventurous programmes, films on film, the oldest films on screen, films from around the world and accessible screenings, from ${fmt(DATA.londonScreenings)} film screenings at ${DATA.venuesWithScreenings} venues.`;

export const metadata: Metadata = {
  title: `${title}: Who Shows What`,
  description,
  alternates: { canonical: "/reports/london-cinemas-2026" },
  openGraph: {
    type: "article",
    title: `${title}: Who Shows What | Clusterflick`,
    description,
    url: "https://clusterflick.com/reports/london-cinemas-2026",
    siteName: "Clusterflick",
  },
  twitter: {
    card: "summary_large_image",
    title: `${title}: Who Shows What | Clusterflick`,
    description,
    creator: "@clusterflick",
  },
};

export default function LondonCinemas2026Report() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Report",
      headline: `${title}: Who Shows What`,
      description,
      url: "https://clusterflick.com/reports/london-cinemas-2026",
      temporalCoverage: `${DATA.from}/${DATA.to}`,
      spatialCoverage: { "@type": "Place", name: "London" },
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
          item: "https://clusterflick.com/reports/london-cinemas-2026",
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
        subtitle={`Who shows what · A Clusterflick report · Data from ${period}`}
        backUrl="/reports"
        backText="All reports"
      >
        <div className={styles.lead}>
          <p>
            Clusterflick collects the listings of every place we can find that
            screens films in London. From {period}, we found{" "}
            {fmt(DATA.londonScreenings)} film screenings at{" "}
            {DATA.venuesWithScreenings} venues.
          </p>
          <p>
            A few films took a huge share of them. {topFilm.title} was screened{" "}
            {fmt(topFilm.screenings)} times,{" "}
            {fmt(DATA.mostScreeningsOfOneFilm.screenings)} of them at{" "}
            {venueLink(DATA.mostScreeningsOfOneFilm)} alone. But London&apos;s
            programme is far wider than its multiplexes, and much of it is
            somewhere you might not think to look. This is who shows what.
          </p>
        </div>

        <dl className={styles.stats}>
          <div className={styles.stat}>
            <dt>Film screenings in London this year</dt>
            <dd>{fmt(DATA.londonScreenings)}</dd>
          </div>
          <div className={styles.stat}>
            <dt>Of them were {topFilm.title}</dt>
            <dd>{fmt(topFilm.screenings)}</dd>
          </div>
          <div className={styles.stat}>
            <dt>
              Of the {DATA.venuesWithScreenings} places that screened films
              aren&apos;t cinemas
            </dt>
            <dd>{notCinemas}</dd>
          </div>
        </dl>

        <ContentSection
          title="The most adventurous programmes"
          intro={
            <>
              {venueLink(nickel)} in Clerkenwell gives {percent(nickel.value)}{" "}
              of its screenings to films at least 25 years old. Of the{" "}
              {DATA.nickel.films} films it showed this year,{" "}
              {DATA.nickel.onceShare}% were shown just once, and the typical
              film on its screen was released in {DATA.nickel.medianYear}.
            </>
          }
        >
          <RankedBarChart
            caption="Share of screenings of films at least 25 years old"
            labelHeading="Venue"
            valueHeading="Share of screenings"
            formatValue={percent}
            items={venueRows(DATA.repertory)}
          />
          <p className={styles.body}>
            {venueLink(closeUp)} in Shoreditch is close behind the Prince
            Charles. For sheer range, {venueLink(mostFilms)} showed the most
            different films, {fmt(mostFilms.value)}, from{" "}
            {DATA.mostDecades.value} decades of cinema; the{" "}
            {venueLink(secondMostFilms)} showed {fmt(secondMostFilms.value)}.
          </p>
        </ContentSection>

        <ContentSection
          title="Film on film"
          intro={
            <>
              Since {formatReportDate(DATA.formatFrom)}, London has had{" "}
              {fmt(DATA.printScreenings)} screenings from a physical print:{" "}
              {fmt(DATA.formats["35mm"])} on 35mm, {fmt(DATA.formats["70mm"])}{" "}
              on 70mm, {fmt(DATA.formats["imax-70mm"])} on IMAX 70mm and{" "}
              {DATA.formats["16mm"]} on 16mm, plus {DATA.formats.vhs} from VHS.{" "}
              {fmt(DATA.odysseyPrintScreenings)} of the prints were The Odyssey.
              Of the other {fmt(nonOdysseyPrints)}, {venueLink(printLeader)}{" "}
              showed {printLeader.value}, almost four times as many as{" "}
              {venueLink(printRunnerUp)}.
            </>
          }
        >
          <RankedBarChart
            caption={`Screenings from a physical print since ${formatReportDate(DATA.formatFrom)}, not counting The Odyssey`}
            labelHeading="Venue"
            valueHeading="Print screenings"
            items={venueRows(DATA.printVenues)}
          />
          <div className={styles.action}>
            <ButtonLink href="/formats" variant="secondary">
              Browse films by format
            </ButtonLink>
          </div>
        </ContentSection>

        <ContentSection
          title="The oldest films on screen"
          intro={
            <>
              The oldest film screened in London this year was older than the
              ship it was shown in. {venueLink(DATA.oldestFilms[0])}, a floating
              arts centre built inside a 1913 cargo ship at South Quay, screened{" "}
              {DATA.oldestFilms[0].title} from {DATA.oldestFilms[0].year}.
            </>
          }
        >
          <ol className={styles.films}>
            {DATA.oldestFilms.map((film) => (
              <li key={`${film.title}-${film.id}`}>
                <span className={styles.filmTitle}>
                  {film.title} ({film.year})
                </span>
                <span className={styles.filmVenue}>at {venueLink(film)}</span>
              </li>
            ))}
          </ol>
        </ContentSection>

        <ContentSection
          title="Around the world"
          intro={
            <>
              Since {formatReportDate(DATA.languageFrom)},{" "}
              {DATA.nonEnglishShare.toFixed(0)}% of London&apos;s screenings
              were of films not in English, in {DATA.languages} original
              languages. Some of the most international screens are in
              multiplexes. At {venueLink(ilford)}, {percent(ilford.value)} of
              screenings weren&apos;t in English:{" "}
              {fmt(DATA.mostNonEnglishScreenings.value)} in two months, mostly
              of South Asian films, and more than at any other venue in London.
            </>
          }
        >
          <RankedBarChart
            caption={`Share of screenings of films not in English, since ${formatReportDate(DATA.languageFrom)}`}
            labelHeading="Venue"
            valueHeading="Share of screenings"
            formatValue={percent}
            items={venueRows(DATA.nonEnglish)}
          />
          <p className={styles.body}>
            {venueLink(mostLanguages)} showed films in the most languages,{" "}
            {mostLanguages.value}.
          </p>
        </ContentSection>

        <ContentSection
          title="Accessible screenings"
          intro={
            <>
              Relaxed screenings, with the lights up, the sound down and freedom
              to move around, are rare: {fmt(DATA.relaxed.screenings)} all year,
              at {DATA.relaxed.venues} venues, about one in every{" "}
              {fmt(Math.round(DATA.londonScreenings / DATA.relaxed.screenings))}{" "}
              screenings. {venueLink(relaxedLeader)} ran {relaxedLeader.value},
              three times as many as {venueLink(relaxedRunnerUp)}.
            </>
          }
        >
          <RankedBarChart
            caption="Relaxed screenings"
            labelHeading="Venue"
            valueHeading="Relaxed screenings"
            items={venueRows(DATA.relaxed.leaders)}
          />
          <p className={styles.body}>
            For screenings subtitled for people who are deaf or hard of hearing,{" "}
            {venueLink(hohLeader)} ({fmt(hohLeader.value)}) and{" "}
            {venueLink(hohRunnerUp)} ({fmt(hohRunnerUp.value)}) lead.
          </p>
          <div className={styles.action}>
            <ButtonLink href="/accessibility" variant="secondary">
              Find accessible screenings
            </ButtonLink>
          </div>
        </ContentSection>

        <ContentSection
          title="Not just cinemas"
          intro={`${DATA.venueTypes.Cinema} cinemas screened films this year. So did ${DATA.venueTypes["Pub & Bar"]} pubs and bars, ${DATA.venueTypes["Library & Archive"]} libraries, ${DATA.venueTypes["Place of Worship"]} places of worship and ${DATA.venueTypes.Hotel} hotels.`}
        >
          <RankedBarChart
            caption="Places that screened films this year, by type"
            labelHeading="Type of venue"
            valueHeading="Venues"
            items={Object.entries(DATA.venueTypes).map(([type, count]) => ({
              key: type,
              label: type,
              value: count,
            }))}
          />
          <div className={styles.action}>
            <ButtonLink href="/venues" variant="secondary">
              See every venue
            </ButtonLink>
          </div>
        </ContentSection>

        <ContentSection title="How we counted">
          <ul className={styles.method}>
            <li>
              <strong>What counts.</strong> A film screening is one listed with
              a date and time: a film, a shorts programme, a double bill or a TV
              screening. Talks, live music and other events are left out.
            </li>
            <li>
              <strong>What actually screened.</strong> Clusterflick&apos;s
              listings only look ahead, so we rebuilt the year from the copies
              we save every day: each screening is counted once, from the last
              copy before it happened. A screening cancelled before then
              isn&apos;t counted.
            </li>
            <li>
              <strong>Fair rankings.</strong> We follow more venues all the
              time, so the year-long rankings only include venues we have
              followed since January or February, and the shares only venues
              with at least 200 screenings. A venue that changed its name or
              listing is counted once; a new operator in the same building is a
              new venue.
            </li>
            <li>
              <strong>Shorter windows.</strong> Our data has recorded the format
              of a screening since {formatReportDate(DATA.formatFrom)} and a
              film&apos;s original language since{" "}
              {formatReportDate(DATA.languageFrom)}, so those sections cover
              only that time. For languages, a venue needs at least 100
              screenings in it.
            </li>
            <li>
              <strong>A film&apos;s age</strong> is from its original release
              year, so a re-release or restoration counts as the original.
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
