import type { Metadata } from "next";
import Link from "next/link";
import StandardPageLayout from "@/components/standard-page-layout";
import ContentSection from "@/components/content-section";
import RankedBarChart from "@/components/ranked-bar-chart";
import Tag from "@/components/tag";
import {
  CHECKED_ON,
  DATA_SOURCES,
  VENUE_COUNTS,
  type FetchMethod,
  type SourceGroup,
} from "@/data/reports/data-sources-2026";
import { formatReportDate } from "../format-report-date";
import {
  disallowsOurPaths,
  getSourceAnchor,
  GROUP_LABELS,
  isClash,
  METHOD_LABELS,
  ROBOTS_COLORS,
  ROBOTS_LABELS,
  TERMS_COLORS,
  TERMS_LABELS,
} from "./labels";
import SourceTable from "./source-table";
import WhereWeSit from "./where-we-sit";
import styles from "./page.module.css";

const URL_PATH = "/reports/data-sources-2026";
const checkedOn = formatReportDate(CHECKED_ON);

const clashes = DATA_SOURCES.filter(isClash);
const robotsClashes = DATA_SOURCES.filter(disallowsOurPaths);
const termsBans = DATA_SOURCES.filter((source) => source.terms === "bans");
const inBoth = clashes.filter(
  (source) => disallowsOurPaths(source) && source.terms === "bans",
);
const borderline = DATA_SOURCES.filter(
  (source) => source.terms === "borderline",
);
const limitsReuse = DATA_SOURCES.filter(
  (source) => source.terms === "restricts",
);
const robotsAllowsButTermsBan = DATA_SOURCES.filter(
  (source) => source.robots === "allows" && source.terms === "bans",
);
const sanctioned = DATA_SOURCES.filter(
  (source) => source.method === "api" || source.method === "dataset",
);
const venueSites = DATA_SOURCES.filter(
  (source) => source.group === "venue-sites",
);
const venueSitesWithoutTerms = venueSites.filter(
  (source) => source.terms === "none-found",
);
const venueSitesSilent = venueSites.filter(
  (source) => source.terms === "silent" || source.terms === "restricts",
);
const readInBrowser = DATA_SOURCES.filter((source) => source.readInBrowser);

const byName = (names: string[]) =>
  names.length > 1
    ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`
    : names[0];
const linkTo = (id: string) => {
  const source = DATA_SOURCES.find((s) => s.id === id)!;
  return <a href={`#${getSourceAnchor(source)}`}>{source.name}</a>;
};

const GROUP_INTROS: Record<SourceGroup, string> = {
  "film-data":
    "These attach each film's details and its scores to the screenings.",
  platforms: `${VENUE_COUNTS.viaPlatformsOnly} of our ${VENUE_COUNTS.total} venues have no listings of their own that we read. Their screenings come only from these platforms, where we search for film events in London and match each to a venue.`,
  chains: `${VENUE_COUNTS.viaChains} venues are read through one shared module per chain, or per booking system that several independents use.`,
  "venue-sites": `${venueSites.length} venues are read from their own websites. Their terms were found from the homepage and searched for clauses on scraping, robots, crawling, automated access, data mining and extraction. That will miss a clause worded some other way, and a terms page not linked from the homepage.`,
};

const GROUPS: SourceGroup[] = [
  "film-data",
  "platforms",
  "chains",
  "venue-sites",
];

const METHOD_ORDER: FetchMethod[] = [
  "plain",
  "stealth",
  "camoufox",
  "browser-ua",
  "account",
  "named",
  "api",
  "dataset",
];

const title = "Where Clusterflick's Data Comes From";
const description = `Every place Clusterflick fetches listings and film data from, how we fetch it, and what each site's robots.txt and terms ask. ${clashes.length} of ${DATA_SOURCES.length} say not to do what we do. Checked on ${checkedOn}.`;

export const metadata: Metadata = {
  title: `${title} — robots.txt, Terms and Scraping`,
  description,
  alternates: { canonical: URL_PATH },
  openGraph: {
    type: "article",
    title: `${title} | Clusterflick`,
    description,
    url: `https://clusterflick.com${URL_PATH}`,
    siteName: "Clusterflick",
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} | Clusterflick`,
    description,
    creator: "@clusterflick",
  },
};

export default function DataSources2026Report() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Report",
      headline: title,
      description,
      url: `https://clusterflick.com${URL_PATH}`,
      dateCreated: CHECKED_ON,
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
          name: title,
          item: `https://clusterflick.com${URL_PATH}`,
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
        subtitle={`A Clusterflick report · Checked on ${checkedOn}`}
      >
        <div className={styles.lead}>
          <p>
            Clusterflick lists film screenings at {VENUE_COUNTS.total} London
            venues. Every day a job collects their listings, and a second looks
            each film up on film data and review sites. Of the{" "}
            {DATA_SOURCES.length} places those jobs fetch from,{" "}
            {sanctioned.length} offer their data through an official API or
            download. We read the rest from their websites.
          </p>
          <p>
            This page is our working. For each place, it records how we fetch
            from it, what its robots.txt says about the pages we request, and
            what its terms say about automated access. It doesn&apos;t argue
            whether that&apos;s right. It sets out where we stand against each
            site&apos;s own published rules, as they were on {checkedOn}.
          </p>
        </div>

        <dl className={styles.stats}>
          <div className={styles.stat}>
            <dt>Places we fetch listings and film data from</dt>
            <dd>{DATA_SOURCES.length}</dd>
          </div>
          <div className={styles.stat}>
            <dt>
              Where what we do goes against the site&apos;s own published rules
            </dt>
            <dd>{clashes.length}</dd>
          </div>
          <div className={styles.stat}>
            <dt>
              Whose robots.txt allows the pages we fetch, though{" "}
              {robotsAllowsButTermsBan.length} of them ban it in their terms
            </dt>
            <dd>
              {
                DATA_SOURCES.filter((source) => source.robots === "allows")
                  .length
              }
            </dd>
          </div>
        </dl>

        <ContentSection
          title="Where we sit"
          intro="Every place, by what its robots.txt and its terms say about how we fetch from it. A site can object in either, so a clash is anything in the top row or the right-hand column."
        >
          <WhereWeSit sources={DATA_SOURCES} />
        </ContentSection>

        <ContentSection
          title="How we ask"
          intro="How we fetch from each place, from a plain request to a browser built to get past bot checks."
        >
          <RankedBarChart
            caption="Places, by how we fetch from them"
            labelHeading="How we fetch"
            valueHeading="Places"
            split={{
              split: "Against the site's own rules",
              rest: "Not against them",
            }}
            items={METHOD_ORDER.map((method) => {
              const using = DATA_SOURCES.filter((s) => s.method === method);
              return {
                key: method,
                label: METHOD_LABELS[method],
                value: using.length,
                splitValue: using.filter(isClash).length,
              };
            })}
          />
          <ul className={styles.points}>
            <li>
              Only one request, the {linkTo("bechdel-test")} lookup, names
              Clusterflick in its user agent.
            </li>
            <li>
              Most plain requests go out with Node&apos;s default user agent,{" "}
              <code>node</code>. That&apos;s honest about being a script, but it
              doesn&apos;t say whose.
            </li>
            <li>
              Some plain requests send a Firefox user agent instead. We added it
              where a site refused <code>node</code> after a burst of requests
              but served the same request carrying a browser&apos;s user agent.
            </li>
            <li>
              Every headless-browser fetch runs Playwright with the stealth
              plugin, which hides the usual signs of automation, so those
              requests look like an ordinary Chrome visitor.
            </li>
            <li>
              Camoufox, a browser built to pass bot checks, is mostly an
              escalation: we try a plain request first, and switch when the site
              serves a bot challenge.
            </li>
          </ul>
        </ContentSection>

        <ContentSection
          title="Where we clash"
          intro={`At ${clashes.length} places, what we do goes against the site's own published rules. robots.txt disallows the pages we fetch at ${robotsClashes.length}, and the terms ban automated access or extraction at ${termsBans.length}${inBoth.length ? ` (${byName(inBoth.map((s) => s.name))} in both)` : ""}.`}
        >
          <table className={styles.clashes}>
            <caption className={styles.visuallyHidden}>
              Places where what we do goes against the site&apos;s rules
            </caption>
            <thead>
              <tr>
                <th scope="col">Place</th>
                <th scope="col">What it gives us</th>
                <th scope="col">robots.txt</th>
                <th scope="col">Terms</th>
              </tr>
            </thead>
            <tbody>
              {clashes.map((source) => (
                <tr key={source.id}>
                  <th scope="row">
                    <a href={`#${getSourceAnchor(source)}`}>{source.name}</a>
                  </th>
                  <td>
                    {source.group === "platforms"
                      ? "Listings for many venues"
                      : source.covers}
                  </td>
                  <td>
                    <Tag size="sm" color={ROBOTS_COLORS[source.robots]}>
                      {ROBOTS_LABELS[source.robots]}
                    </Tag>
                  </td>
                  <td>
                    <Tag size="sm" color={TERMS_COLORS[source.terms]}>
                      {TERMS_LABELS[source.terms]}
                    </Tag>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className={styles.body}>
            {borderline.length} more are borderline:{" "}
            {borderline.map((source, index) => (
              <span key={source.id}>
                {index > 0 &&
                  (index === borderline.length - 1 ? " and " : ", ")}
                <a href={`#${getSourceAnchor(source)}`}>{source.name}</a>
              </span>
            ))}
            . Their terms limit how the site may be accessed without naming
            scraping, or ban it on a site whose reach over the pages we read
            isn&apos;t clear.
          </p>
          <p className={styles.body}>
            Another {limitsReuse.length} say nothing about automated access but
            limit copying, republishing or commercial use of their content. We
            show their listings, so that&apos;s arguable too, and they&apos;re
            marked in yellow rather than counted as clashes.
          </p>
        </ContentSection>

        <ContentSection title="What stands out">
          <ol className={styles.points}>
            <li>
              <strong>robots.txt and terms usually disagree.</strong>{" "}
              {robotsAllowsButTermsBan.length} sites allow every page we fetch
              in robots.txt and ban automated access in their terms, among them{" "}
              {linkTo("eventbrite")}, {linkTo("letterboxd")}, {linkTo("vue")}{" "}
              and {linkTo("curzon")}.
            </li>
            <li>
              <strong>
                The big platforms forbid it; the small venues mostly say
                nothing.
              </strong>{" "}
              Of the {venueSites.length} venue sites we read directly,{" "}
              {venueSitesWithoutTerms.length} link no terms from their homepage
              and {venueSitesSilent.length} have terms with nothing on automated
              access.
            </li>
            <li>
              <strong>
                Some sites turn scripts away from their own rules.
              </strong>{" "}
              {readInBrowser.length} terms pages or robots.txt files refused
              automated readers, or needed JavaScript to show anything.
              Metacritic&apos;s terms answer scripts with HTTP 402 Payment
              Required. A script that wanted to check the rules first
              couldn&apos;t, so these were read in a real browser.
            </li>
            <li>
              <strong>We hold an account at one source.</strong>{" "}
              {linkTo("cinebur")}&apos;s listings can only be read signed in, so
              we read them through a Clusterflick account. Its sign-up form says
              that signing up means agreeing to Cinebur&apos;s terms, with
              nothing to tick, but links to a page that returns 404. The terms
              linked from its website say they cover the app, and exclude
              &ldquo;data mining, robots, or similar data gathering and
              extraction tools&rdquo;.
            </li>
            <li>
              <strong>&ldquo;Non-commercial&rdquo; is never defined.</strong>{" "}
              {linkTo("tmdb")}&apos;s API terms, {linkTo("imdb")}&apos;s dataset
              and the {linkTo("bechdel-test")}&apos;s licence all allow only
              non-commercial use, and none says what that means.
            </li>
          </ol>
        </ContentSection>

        {GROUPS.map((group) => {
          const sources = DATA_SOURCES.filter((s) => s.group === group);
          return (
            <ContentSection
              key={group}
              title={GROUP_LABELS[group]}
              titleBadge={
                <span className={styles.badge}>{sources.length}</span>
              }
              intro={GROUP_INTROS[group]}
            >
              <SourceTable sources={sources} caption={GROUP_LABELS[group]} />
            </ContentSection>
          );
        })}

        <ContentSection title="How this was checked">
          <ul className={styles.method}>
            <li>
              <strong>The list of places</strong> comes from{" "}
              <a
                href="https://github.com/clusterflick/scripts"
                target="_blank"
                rel="noopener noreferrer"
              >
                Clusterflick&apos;s scripts
              </a>{" "}
              as they stood on {checkedOn}: every venue, every listings
              platform, the shared chain modules and the film lookups.{" "}
              {VENUE_COUNTS.enteredByHand} venues whose listings we type up
              ourselves are left out, as nothing is fetched for them.
            </li>
            <li>
              <strong>robots.txt</strong> was fetched once per site, identifying
              as Clusterflick, and every path we request was checked against its
              rules for all user agents, since we don&apos;t send a crawler name
              a site could address directly.
            </li>
            <li>
              <strong>Terms</strong> were found from each site&apos;s homepage
              and searched for clauses on automated access. For the film data
              sources, platforms and chains they were then read and quoted. For
              venues&apos; own sites, only the search was done.
            </li>
            <li>
              <strong>Pages that refused scripts</strong> or needed JavaScript
              were opened one at a time in a normal Chrome browser, which Claude
              drove on our behalf. No script was ever retried with a disguised
              user agent.
            </li>
            <li>
              <strong>Not covered:</strong> the occasional scripts we use to
              check our coverage and find new venues, and the one we use to
              fetch venue logos and photos.
            </li>
          </ul>
          <p className={styles.body}>
            Quotes are short extracts: follow the links for the full terms. Like
            our <Link href="/datasets">datasets</Link>, this page is free to use
            with credit.
          </p>
        </ContentSection>
      </StandardPageLayout>
    </>
  );
}
