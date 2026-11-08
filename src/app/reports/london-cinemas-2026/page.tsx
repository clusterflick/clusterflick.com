import type { Metadata } from "next";
import { Fragment } from "react";
import Link from "next/link";
import StandardPageLayout from "@/components/standard-page-layout";
import ContentSection from "@/components/content-section";
import RankedBarChart from "@/components/ranked-bar-chart";
import DecadeFingerprint from "@/components/decade-fingerprint";
import FilmStockChart from "@/components/film-stock-chart";
import VenueDotMap from "@/components/venue-dot-map";
import MoviePoster from "@/components/movie-poster";
import PosterTile, { PosterTileList } from "@/components/poster-tile";
import ReportHighlight from "@/components/report-highlight";
import StatsBand from "@/components/stats-band";
import { ButtonLink } from "@/components/button";
import { CalendarIcon } from "@/components/icons";
import { LONDON_CINEMAS_2026 as DATA } from "@/data/reports/london-cinemas-2026";
import { getVenueUrl } from "@/utils/get-venue-url";
import { getVenueImagePath } from "@/utils/get-venue-image";
import { getBoroughMapShapes } from "@/utils/get-borough-map-shapes";
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
/** "January to October 2026": the period by month, for the headline band. */
const monthRange = [DATA.from, DATA.to]
  .map((iso) =>
    new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", {
      month: "long",
      timeZone: "UTC",
    }),
  )
  .join(" to ")
  .concat(` ${DATA.to.slice(0, 4)}`);

const FORMAT_LABELS: Record<string, string> = {
  "35mm": "35mm",
  "70mm": "70mm",
  "imax-70mm": "IMAX 70mm",
  "16mm": "16mm",
  vhs: "VHS",
};

// Each format's stock, drawn to its gauge: film width in mm, or half-inch tape.
const FORMAT_STOCK: Record<string, { gauge: number; stock: "film" | "tape" }> =
  {
    "35mm": { gauge: 35, stock: "film" },
    "70mm": { gauge: 70, stock: "film" },
    "imax-70mm": { gauge: 70, stock: "film" },
    "16mm": { gauge: 16, stock: "film" },
    vhs: { gauge: 12.7, stock: "tape" },
  };

// The map's kinds of place. "Not a cinema" means any type but Cinema, as the
// headline counts it, so a community cinema is coloured, not grey.
const PLACE_GROUPS = [
  {
    key: "cinema",
    label: "Cinemas",
    color: "rgba(var(--color-light-gray-rgb), 0.35)",
    muted: true,
    types: ["Cinema"],
  },
  {
    key: "pubs",
    label: "Pubs, bars and music venues",
    color: "var(--color-neon-pink)",
    types: ["Pub & Bar", "Music Venue"],
  },
  {
    key: "community",
    label: "Community spaces and places of worship",
    color: "var(--color-buttery-yellow)",
    types: [
      "Community Centre",
      "Community Cinema",
      "Cultural Centre",
      "Place of Worship",
    ],
  },
  {
    key: "learning",
    label: "Libraries, museums and universities",
    color: "var(--color-electric-blue)",
    types: ["Library & Archive", "Museum", "University & College"],
  },
  {
    key: "arts",
    label: "Arts centres, galleries and theatres",
    color: "#b07be0",
    types: ["Arts Centre", "Creative Space", "Gallery", "Theatre"],
  },
  {
    key: "other",
    label: "Everywhere else",
    color: "var(--color-release-green)",
    types: [] as string[],
  },
];
const placeGroupOf = (type: string) =>
  (
    PLACE_GROUPS.find((group) => group.types.includes(type)) ??
    PLACE_GROUPS[PLACE_GROUPS.length - 1]
  ).key;

/** A named film's poster path, fixed when the report was made. */
const posterOf = (movieId: string) =>
  (DATA.posters as Record<string, string | null>)[movieId] ?? undefined;

/** "2 to 27 October", or "28 September to 3 October" across a month. */
const formatDayRange = (from: string, to: string) => {
  const date = (iso: string) => new Date(`${iso}T12:00:00Z`);
  const part = (iso: string, options: Intl.DateTimeFormatOptions) =>
    date(iso).toLocaleDateString("en-GB", { ...options, timeZone: "UTC" });
  return from.slice(0, 7) === to.slice(0, 7)
    ? `${part(from, { day: "numeric" })} to ${part(to, { day: "numeric", month: "long" })}`
    : `${part(from, { day: "numeric", month: "long" })} to ${part(to, { day: "numeric", month: "long" })}`;
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
// "Almost half" is the copy; a share outside it needs new words.
const shownOnceShare = DATA.filmsShownOnce / DATA.distinctFilms;
if (shownOnceShare < 0.45 || shownOnceShare >= 0.5) {
  throw new Error("Films shown once are no longer almost half");
}
const mapShapes = getBoroughMapShapes();
const mapItems = DATA.venuePoints.map((venue) => {
  const [x, y] = mapShapes.project(venue.lon, venue.lat);
  return {
    key: venue.id,
    x,
    y,
    group: placeGroupOf(venue.type),
    label: `${venue.name} (${venue.type})`,
  };
});
const odysseyPoster = posterOf(DATA.odysseyMovieId);
const vistaVision = DATA.vistaVision;
const [nickel] = DATA.repertory;
const [mostFilms] = DATA.mostDifferentFilms;
const [printLeader, printRunnerUp] = DATA.printVenues;
const [oldest] = DATA.oldestFilms;
const [sixteen] = DATA.sixteenMillimetre;
// Named here rather than exported: the films are the copy, not a measure.
const sixteenSample = "Buster Keaton's The General to The Evil Dead";
const vhsBars = DATA.vhs.filter((v) => v.type === "Pub & Bar");
const vhsOthers = DATA.vhs.filter((v) => v.type !== "Pub & Bar");
// The VHS line names the bars by borough, then the one other venue.
if (vhsBars.length < 2 || vhsOthers.length !== 1) {
  throw new Error("The VHS venues no longer match the report's copy");
}
const vhsBarBoroughs = [...new Set(vhsBars.map((v) => v.borough))];

const capitalise = (text: string) => text[0].toUpperCase() + text.slice(1);
const NUMBER_WORDS = ["no", "one", "two", "three", "four", "five", "six"];

/** "more than three times", for a ratio of at least 2. */
const timesAsMany = (value: number, than: number) => {
  const whole = Math.floor(value / than);
  const words = ["", "", "twice", "three times", "four times", "five times"];
  if (!words[whole]) throw new Error(`No wording for ${whole} times as many`);
  return value / than - whole < 0.1
    ? words[whole]
    : `more than ${words[whole]}`;
};
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
            screens films in London, and counted every film screening from{" "}
            {period}. London&apos;s programme is far wider than its multiplexes,
            and much of it is somewhere you might not think to look. This is who
            shows what.
          </p>
        </div>

        <div className={styles.band}>
          <StatsBand
            label="London's year in film"
            items={[
              {
                id: "screenings",
                value: DATA.londonScreenings,
                compact: true,
                label: "Screenings",
                detail: `${fmt(DATA.londonScreenings)}, ${monthRange}`,
              },
              {
                id: "films",
                value: DATA.distinctFilms,
                label: "Films",
                detail: "and programmes, almost half of them shown just once",
                href: "#adventurous",
              },
              {
                id: "languages",
                value: DATA.languages,
                label: "Languages",
                detail: `${DATA.nonEnglishShare.toFixed(0)}% of screenings weren't in English`,
                href: "#around-the-world",
              },
              {
                id: "places",
                value: DATA.venuesWithScreenings,
                label: "Places",
                detail: `${Math.round((notCinemas / DATA.venuesWithScreenings) * 10)} in 10 of them aren't cinemas: pubs, libraries, churches and more`,
                href: "#not-just-cinemas",
              },
            ]}
          />
        </div>

        <aside className={styles.counterpoint}>
          <span className={styles.counterpointPoster}>
            <MoviePoster
              title={topFilm.title}
              posterPath={posterOf(topFilm.movieId)}
              size="xsmall"
              interactive={false}
              fluid
            />
          </span>
          <p>
            <span className={styles.counterpointEyebrow}>And yet</span>
            <span className={styles.counterpointStat}>
              1 in {Math.round(DATA.londonScreenings / topFilm.screenings)}
            </span>
            screenings were one film: {topFilm.title}, screened{" "}
            {fmt(topFilm.screenings)} times,{" "}
            {fmt(DATA.mostScreeningsOfOneFilm.screenings)} of them at{" "}
            {venueLink(DATA.mostScreeningsOfOneFilm)} alone.
          </p>
        </aside>

        <ContentSection
          id="adventurous"
          title="The most adventurous programmes"
          intro={`Most screens show this year's releases. A few give most of their time to older films, and show each one only once or twice: ${fmt(DATA.filmsShownOnce)} of the ${fmt(DATA.distinctFilms)} films and programmes screened this year were shown just once.`}
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
          <DecadeFingerprint
            caption={`Screenings by the decade of their film, with ${DATA.mostScreeningsOfOneFilm.name} for comparison`}
            labelHeading="Venue"
            detailHeading="Films at least 25 years old"
            items={DATA.decadeFingerprints.map((venue, index) => ({
              key: venue.id,
              label: venue.name,
              href: venue.current ? getVenueUrl(venue) : undefined,
              highlight: index === 0,
              muted: venue.id === DATA.mostScreeningsOfOneFilm.id,
              decades: venue.decades,
              detail: `${percent(venue.oldShare)} 25+ years old`,
            }))}
          />
        </ContentSection>

        <ContentSection title="Film on film">
          <WindowNote what="screening formats" from={DATA.formatFrom} />
          <div className={styles.withPoster}>
            <span className={styles.sidePoster}>
              <MoviePoster
                title="The Odyssey"
                posterPath={odysseyPoster}
                size="xsmall"
                interactive={false}
                fluid
              />
            </span>
            <p className={styles.body}>
              {fmt(DATA.printScreenings)} screenings were from a film print (and{" "}
              {vhs.total} from VHS). {fmt(DATA.odysseyPrintScreenings)} of the
              prints were The Odyssey, on 35mm, 70mm and IMAX 70mm. Without it,
              70mm almost disappears, and what&apos;s left on film is mostly
              35mm.
              {odysseyFreeFormats &&
                " (16mm and VHS remain an Odyssey-free zone.)"}
            </p>
          </div>
          <FilmStockChart
            caption="Screenings from film and tape, by format, each drawn to its gauge"
            labelHeading="Format"
            valueHeading="Screenings"
            split={{ split: "Everything else", rest: "The Odyssey" }}
            items={DATA.formats.map((f) => ({
              key: f.format,
              label: FORMAT_LABELS[f.format] ?? f.format,
              ...(FORMAT_STOCK[f.format] ?? { gauge: 35, stock: "film" }),
              value: f.total,
              splitValue: f.total - f.odyssey,
            }))}
          />
          <div className={styles.highlights}>
            <ReportHighlight
              title="Most film on film"
              stat={fmt(printLeader.value)}
              statLabel={`print screenings, not counting The Odyssey. ${capitalise(timesAsMany(printLeader.value, printRunnerUp.value))} as many as ${printRunnerUp.name}.`}
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
          {vistaVision && (
            <div className={styles.withPoster}>
              <span className={styles.sidePoster}>
                <MoviePoster
                  title={vistaVision.title}
                  posterPath={posterOf(vistaVision.movieId)}
                  size="xsmall"
                  interactive={false}
                  fluid
                />
              </span>
              <p className={styles.body}>
                {venueLink(vistaVision)} showed {vistaVision.title} in
                VistaVision from{" "}
                {formatDayRange(vistaVision.from, vistaVision.to)}:{" "}
                {vistaVision.screenings} screenings of 35mm film run sideways
                through the projector.
              </p>
            </div>
          )}
          <RankedBarChart
            caption="Screenings from a physical print, not counting The Odyssey"
            labelHeading="Venue"
            valueHeading="Print screenings"
            items={venueRows(DATA.printVenues)}
          />
          <p className={styles.body}>
            And VHS isn&apos;t dead. All {vhs.total} VHS screenings were at{" "}
            {venueLink(vhsOthers[0])} and{" "}
            {NUMBER_WORDS[vhsBars.length] ?? vhsBars.length} bars:{" "}
            {vhsBarBoroughs.map((borough, index) => {
              const bars = vhsBars.filter((v) => v.borough === borough);
              return (
                <Fragment key={borough}>
                  {index > 0 &&
                    (index === vhsBarBoroughs.length - 1 ? ", and " : ", ")}
                  {bars.map((bar, i) => (
                    <Fragment key={bar.id}>
                      {i > 0 && (i === bars.length - 1 ? " and " : ", ")}
                      {venueLink(bar)}
                    </Fragment>
                  ))}{" "}
                  in {borough}
                </Fragment>
              );
            })}
            .
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
          <PosterTileList>
            {DATA.oldestFilms.map((film) => (
              <PosterTile
                key={`${film.movieId}-${film.id}`}
                title={film.title}
                posterPath={posterOf(film.movieId)}
                details={[String(film.year), film.name]}
              />
            ))}
          </PosterTileList>
        </ContentSection>

        <ContentSection id="around-the-world" title="Around the world">
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
              statLabel={`relaxed screenings, ${timesAsMany(relaxedLeader.value, relaxedRunnerUp.value)} as many as ${relaxedRunnerUp.name}`}
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
          id="not-just-cinemas"
          title="Not just cinemas"
          intro={`${DATA.venueTypes.Cinema} cinemas screened films this year. So did ${DATA.venueTypes["Pub & Bar"]} pubs and bars, ${DATA.venueTypes["Library & Archive"]} libraries, ${DATA.venueTypes["Place of Worship"]} places of worship and ${DATA.venueTypes.Hotel} hotels.`}
        >
          <VenueDotMap
            caption={`Every place that screened a film this year. The ${notCinemas} that aren't cinemas are in colour.`}
            viewBox={mapShapes.viewBox}
            outlines={Object.values(mapShapes.paths)}
            groups={PLACE_GROUPS}
            items={mapItems}
          />
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
              <strong>Formats.</strong> We started recording a screening&apos;s
              format on {formatReportDate(DATA.formatFrom)}, so that section
              covers only that time. A screening two sources listed on the same
              format is counted once.
            </li>
            <li>
              <strong>Languages.</strong> A film&apos;s original language is
              TheMovieDB&apos;s. We started recording it on{" "}
              {formatReportDate(DATA.languageFrom)}, and for earlier screenings
              took it from TheMovieDB details we saved while the film was
              showing, which covers all but{" "}
              {(100 - DATA.languageCoverage).toFixed(2)}% of screenings. Silent
              films count as no language.
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
