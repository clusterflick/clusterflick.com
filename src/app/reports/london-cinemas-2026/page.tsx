import type { Metadata } from "next";
import Link from "next/link";
import StandardPageLayout from "@/components/standard-page-layout";
import ContentSection from "@/components/content-section";
import RankedBarChart from "@/components/ranked-bar-chart";
import ReportHighlight from "@/components/report-highlight";
import { ButtonLink } from "@/components/button";
import { CalendarIcon } from "@/components/icons";
import { LONDON_CINEMAS_2026 as DATA } from "@/data/reports/london-cinemas-2026";
import { getVenueUrl } from "@/utils/get-venue-url";
import { getVenueImagePath } from "@/utils/get-venue-image";
import { formatReportDate } from "../format-report-date";
import styles from "./page.module.css";

type ReportVenue = {
  id: string;
  name: string;
  type: string;
  current: boolean;
};
type RankedVenue = ReportVenue & { value: number };

const fmt = (n: number) => n.toLocaleString("en-GB");
const percent = (n: number) => `${Math.round(n)}%`;
const period = `${formatReportDate(DATA.from)} to ${formatReportDate(DATA.to)}`;

const FORMAT_LABELS: Record<string, string> = {
  "35mm": "35mm",
  "70mm": "70mm",
  "imax-70mm": "IMAX 70mm",
  "16mm": "16mm",
  vhs: "VHS",
};

// TheMovieDB uses "cn" for Cantonese, which isn't a standard language code.
const LANGUAGE_NAMES: Record<string, string> = { cn: "Cantonese" };
const languageNames = new Intl.DisplayNames(["en"], { type: "language" });
const languageName = (code: string) =>
  LANGUAGE_NAMES[code] ?? languageNames.of(code) ?? code;

/** "French, Spanish and Georgian": a venue's main non-English languages. */
const formatLanguages = (venueId: keyof typeof DATA.languageMix, count = 3) => {
  const names = DATA.languageMix[venueId]
    .slice(0, count)
    .map((l) => languageName(l.language));
  return names.length > 1
    ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`
    : names.join("");
};

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

const cardVenue = (venue: ReportVenue) => ({
  name: venue.name,
  type: venue.type,
  href: venue.current ? getVenueUrl(venue) : undefined,
  imagePath: getVenueImagePath(venue.id),
});

/** Says that a section covers less than the whole year, and why. */
function WindowNote({ what, from }: { what: string; from: string }) {
  return (
    <p className={styles.window}>
      <CalendarIcon size={16} />
      <span>
        We started recording {what} on {formatReportDate(from)}, so this section
        covers screenings from then to {formatReportDate(DATA.to)}.
      </span>
    </p>
  );
}

const [topFilm] = DATA.mostScreenedFilms;
const vhs = DATA.formats.find((f) => f.format === "vhs")!;
// The aside only holds while The Odyssey has no 16mm or VHS screenings.
const odysseyFreeFormats = DATA.formats
  .filter((f) => f.format === "16mm" || f.format === "vhs")
  .every((f) => f.odyssey === 0);
const notCinemas = DATA.venuesWithScreenings - DATA.venueTypes.Cinema;
const [nickel] = DATA.repertory;
const [mostFilms] = DATA.mostDifferentFilms;
const [printLeader, printRunnerUp] = DATA.printVenues;
const [oldest] = DATA.oldestFilms;
const [sixteen] = DATA.sixteenMillimetre;
// Named here rather than exported: the films are the copy, not a measure.
const sixteenSample = "Buster Keaton's The General to The Big Sleep";
const vhsBars = DATA.vhs.filter((v) => v.type === "Pub & Bar");
const vhsOthers = DATA.vhs.filter((v) => v.type !== "Pub & Bar");
// The VHS line names two Hackney bars and one other venue.
if (
  vhsBars.length !== 2 ||
  vhsOthers.length !== 1 ||
  vhsBars.some((v) => v.borough !== "Hackney")
) {
  throw new Error("The VHS venues no longer match the report's copy");
}
const [mostInternational] = DATA.nonEnglish;
const [relaxedLeader, relaxedRunnerUp] = DATA.relaxed.leaders;
const [hohLeader, hohRunnerUp] = DATA.hardOfHearing.leaders;
const [mostLanguages] = DATA.mostLanguages;
const ilford = DATA.nonEnglish.find((v) => v.name === "Cineworld Ilford")!;
const ilfordCount = DATA.mostNonEnglishScreenings;
// The copy names Ilford as having the most non-English screenings too.
if (ilfordCount.id !== ilford.id) {
  throw new Error(
    "Cineworld Ilford no longer has the most non-English screenings",
  );
}

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
          intro="Most screens show this year's releases. A few give most of their time to older films, and show each one only once or twice."
        >
          <div className={styles.highlights}>
            <ReportHighlight
              title="Most adventurous programme"
              stat={percent(nickel.value)}
              statLabel={`of screenings were of films at least 25 years old. ${DATA.nickel.onceShare}% of its ${DATA.nickel.films} films were shown just once.`}
              venue={cardVenue(nickel)}
            />
            <ReportHighlight
              title="Widest range"
              stat={fmt(mostFilms.value)}
              statLabel={`different films, from ${DATA.mostDecades.value} decades of cinema`}
              venue={cardVenue(mostFilms)}
            />
          </div>
          <RankedBarChart
            caption="Share of screenings of films at least 25 years old"
            labelHeading="Venue"
            valueHeading="Share of screenings"
            formatValue={percent}
            items={venueRows(DATA.repertory)}
          />
        </ContentSection>

        <ContentSection title="Film on film">
          <WindowNote what="screening formats" from={DATA.formatFrom} />
          <p className={styles.body}>
            {fmt(DATA.printScreenings)} screenings were from a film print (and{" "}
            {vhs.total} from VHS). {fmt(DATA.odysseyPrintScreenings)} of the
            prints were The Odyssey, on 35mm, 70mm and IMAX 70mm. Without it,
            70mm almost disappears, and what&apos;s left on film is mostly 35mm.
            {odysseyFreeFormats &&
              " (16mm and VHS remain an Odyssey-free zone.)"}
          </p>
          <RankedBarChart
            caption="Screenings from film and tape, by format"
            labelHeading="Format"
            valueHeading="Screenings"
            split={{ split: "Everything else", rest: "The Odyssey" }}
            items={DATA.formats.map((f) => ({
              key: f.format,
              label: FORMAT_LABELS[f.format] ?? f.format,
              value: f.total,
              splitValue: f.total - f.odyssey,
            }))}
          />
          <div className={styles.highlights}>
            <ReportHighlight
              title="Most film on film"
              stat={fmt(printLeader.value)}
              statLabel={`print screenings, not counting The Odyssey. Almost four times as many as ${printRunnerUp.name}.`}
              venue={cardVenue(printLeader)}
            />
            <ReportHighlight
              variant="mention"
              title="Most 16mm"
              stat={fmt(sixteen.value)}
              statLabel={`screenings on 16mm, more than anywhere else in London: classics from ${sixteenSample}`}
              venue={cardVenue(sixteen)}
            />
          </div>
          <RankedBarChart
            caption="Screenings from a physical print, not counting The Odyssey"
            labelHeading="Venue"
            valueHeading="Print screenings"
            items={venueRows(DATA.printVenues)}
          />
          <p className={styles.body}>
            And VHS isn&apos;t dead: all {vhs.total} VHS screenings were at two
            Hackney bars, {venueLink(vhsBars[0])} and {venueLink(vhsBars[1])},
            and at {venueLink(vhsOthers[0])}.
          </p>
          <div className={styles.action}>
            <ButtonLink href="/formats" variant="secondary">
              Browse films by format
            </ButtonLink>
          </div>
        </ContentSection>

        <ContentSection
          title="The oldest films on screen"
          intro="The oldest film screened in London this year was older than the ship it was shown in."
        >
          <div className={styles.highlights}>
            <ReportHighlight
              title="Oldest film screened"
              stat={`${oldest.title} (${oldest.year})`}
              statLabel="screened aboard a floating arts centre, built inside a 1913 cargo ship at South Quay"
              venue={cardVenue(oldest)}
            />
          </div>
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

        <ContentSection title="Around the world">
          <WindowNote
            what="films' original languages"
            from={DATA.languageFrom}
          />
          <p className={styles.body}>
            {DATA.nonEnglishShare.toFixed(0)}% of London&apos;s screenings were
            of films not in English, in {DATA.languages} original languages.{" "}
            {venueLink(mostLanguages)} showed films in {mostLanguages.value}{" "}
            original languages, more than any other venue.
          </p>
          <div className={styles.highlights}>
            <ReportHighlight
              title="Most international programme"
              stat={percent(mostInternational.value)}
              statLabel={`of screenings were of films not in English, mostly in ${formatLanguages(mostInternational.id)}`}
              venue={cardVenue(mostInternational)}
            />
            <ReportHighlight
              variant="mention"
              title="Most international multiplex"
              stat={fmt(ilfordCount.value)}
              statLabel={`screenings of films not in English, more than any other venue in London: ${percent(ilford.value)} of its programme, mostly in ${formatLanguages(ilford.id, 4)}`}
              venue={cardVenue(ilford)}
            />
          </div>
          <RankedBarChart
            caption="Share of screenings of films not in English"
            labelHeading="Venue"
            valueHeading="Share of screenings"
            formatValue={percent}
            items={venueRows(DATA.nonEnglish)}
          />
        </ContentSection>

        <ContentSection
          title="Accessible screenings"
          intro={`Relaxed screenings, with the lights up, the sound down and freedom to move around, are rare: ${fmt(DATA.relaxed.screenings)} all year, at ${DATA.relaxed.venues} venues, about one in every ${fmt(Math.round(DATA.londonScreenings / DATA.relaxed.screenings))} screenings.`}
        >
          <div className={styles.highlights}>
            <ReportHighlight
              title="Most relaxed screenings"
              stat={fmt(relaxedLeader.value)}
              statLabel={`relaxed screenings, three times as many as ${relaxedRunnerUp.name}`}
              venue={cardVenue(relaxedLeader)}
            />
          </div>
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
              <strong>Shorter windows.</strong> We started recording a
              screening&apos;s format on {formatReportDate(DATA.formatFrom)} and
              a film&apos;s original language on{" "}
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
