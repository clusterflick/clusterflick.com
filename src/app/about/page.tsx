import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import HeroSection from "@/components/hero-section";
import LinkCard, {
  CardArrow,
  CardContent,
  CardDescription,
  CardIcon,
  CardTitle,
} from "@/components/link-card";
import { EmailIcon } from "@/components/icons";
import DataPageLinks from "@/app/datasets/data-page-links";
import Divider from "@/components/divider";
import OutlineHeading from "@/components/outline-heading";
import PageHeader from "@/components/page-header";
import SiteFooter from "@/components/site-footer";
import ContentSection from "@/components/content-section";
import GroupHeader from "@/components/group-header";
import CardGrid from "@/components/card-grid";
import StatsBand, { type StatsBandItem } from "@/components/stats-band";
import { getStaticData } from "@/utils/get-static-data";
import { getListingsStats } from "@/utils/get-listings-stats";
import { getFormatUrl } from "@/utils/get-format-url";
import { FORMATS } from "@/data/formats";
import { FormatSource } from "@/types";
import StatusSection from "./components/status-section";
import { socialLinks, partnerSites, features, ratingSources } from "./data";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn more about Clusterflick – the open source project helping you find film screenings across London cinemas.",
  alternates: {
    canonical: "/about",
  },
};

// Answers mirror content visible on this page — a requirement for valid
// FAQPage structured data.
const faqs = [
  {
    question: "What is Clusterflick?",
    answer:
      "Clusterflick is a free site listing every film showing in London — 450+ venues, one search.",
  },
  {
    question: "Where does Clusterflick's film data come from?",
    answer:
      "Clusterflick gets showing details directly from each venue and event source. The film-related metadata (including actor, director, synopses, release dates, trailers and poster art) is supplied by The Movie Database (TMDB). Clusterflick uses the TMDB API but is not endorsed or certified by TMDB.",
  },
  {
    question: "How often is the showing data updated?",
    answer:
      "The showing data is refreshed from each venue and event source daily.",
  },
  {
    question: "Is Clusterflick open source?",
    answer:
      "Yes, the code for the Clusterflick website and the processing pipeline is open source and available on GitHub, under the MIT licence.",
  },
  {
    question: "Can I use Clusterflick's screening data in my own project?",
    answer:
      "Yes. The showing data is refreshed daily, available in two formats, and free to use — including commercially — under CC BY 4.0, as long as you credit us. Film metadata supplied by TMDB is excluded and stays subject to TMDB's own terms; the data licence page has the full terms.",
  },
];

const aboutJsonLd = [
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
        name: "About",
        item: "https://clusterflick.com/about",
      },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  },
];

export default async function AboutPage() {
  // The same week's figures the home page opens with, counted at build time.
  const data = await getStaticData();
  const now = Date.parse(new Date().toISOString());
  const stats = getListingsStats(data, now);
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
  // As on the home page: the curiosity, when there is one to report.
  const thirtyFiveMm = FORMATS.find(
    (format) => format.id === FormatSource.ThirtyFiveMm,
  );
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

  return (
    <main id="main-content">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd) }}
      />
      <PageHeader />

      <HeroSection
        backgroundImage="/images/various-movie-seats.jpg"
        backgroundImageAlt="Rows of cinema seats"
        backdropHeight="extended"
        align="center"
        className={styles.hero}
      >
        <div className={styles.logoLarge}>
          <Image
            src="/images/logo.svg"
            alt="Clusterflick logo"
            width={200}
            height={200}
          />
        </div>
        <OutlineHeading className={styles.title}>Clusterflick</OutlineHeading>
        <p className={styles.headline}>Every film showing in London.</p>
        <p className={styles.tagline}>
          Whether you&apos;re chasing new releases or cult classics, we make it
          easy to see what&apos;s on, where, and&nbsp;when.
        </p>
        <div className={styles.stats}>
          <StatsBand items={statItems} label="This week in London" />
        </div>
      </HeroSection>

      <Divider />

      <div className={styles.content}>
        <div id="explore">
          <GroupHeader
            icon="/images/icons/neon-ticket.svg"
            iconWidth={66}
            iconHeight={66}
            title="Explore"
          />

          <ContentSection
            title="What You Can Do"
            intro="One place for London's whole programme, from the multiplexes to the film clubs."
            as="h3"
            align="center"
          >
            <CardGrid>
              {features.map((feature) => (
                <LinkCard
                  key={feature.href}
                  href={feature.href}
                  variant="feature"
                  className={styles.featureCard}
                >
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                  <CardArrow />
                </LinkCard>
              ))}
            </CardGrid>
          </ContentSection>

          <ContentSection
            id="built-with-clusterflick"
            title="Built with Clusterflick"
            as="h3"
            align="center"
            intro="There's a growing community of independent sites that are building on top of our open data:"
          >
            <CardGrid>
              {partnerSites.map((site) => (
                <LinkCard
                  key={site.name}
                  href={site.url}
                  variant="social"
                  aria-label={`Visit ${site.name}`}
                >
                  <span className={styles.partnerLogo}>
                    {site.logo ? (
                      <Image
                        src={site.logo}
                        alt={`${site.name} logo`}
                        width={48}
                        height={48}
                      />
                    ) : (
                      <span className={styles.partnerInitial} aria-hidden>
                        {site.name.charAt(0)}
                      </span>
                    )}
                  </span>
                  <CardContent>
                    <strong>{site.name}</strong>
                    <span className={styles.partnerDescription}>
                      {site.description}
                    </span>
                  </CardContent>
                </LinkCard>
              ))}
            </CardGrid>
          </ContentSection>
        </div>
      </div>

      <Divider />

      <div className={styles.content}>
        <div id="behind-the-scenes" className={styles.technicalGroup}>
          <GroupHeader
            icon="/images/icons/neon-projector.svg"
            iconWidth={80}
            iconHeight={66}
            title="Behind the Scenes"
          />

          <ContentSection title="Status" as="h3" align="center">
            <StatusSection />
          </ContentSection>

          <ContentSection
            title="Open Source"
            as="h3"
            align="center"
            intro={
              <>
                The code for this site and the processing pipeline behind it is
                open source under the MIT licence, and{" "}
                <a
                  href="https://github.com/clusterflick/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  available on GitHub
                </a>
                . The screening data it produces is published separately under{" "}
                <Link href="/data-licence">CC BY 4.0</Link>. To see what&apos;s
                new on Clusterflick, see{" "}
                <Link href="/changelog">the Changelog</Link>, which details new
                venues, sources and festivals, as well as features and
                improvements across the site and its data.
              </>
            }
          />

          <ContentSection
            title="Showing Data"
            as="h3"
            align="center"
            intro={
              <>
                The showing data is refreshed daily, published as a JSON file
                and a calendar feed for every venue, and free to use — including
                commercially — under{" "}
                <a
                  href="https://creativecommons.org/licenses/by/4.0/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nowrap"
                >
                  CC BY 4.0
                </a>
                , as long as you credit us.
              </>
            }
          >
            <div className={styles.dataLinks}>
              <DataPageLinks />
            </div>
          </ContentSection>

          <ContentSection
            title="Acknowledgements"
            as="h3"
            align="center"
            intro={
              <>
                Film-related metadata used in Clusterflick, including actor,
                director, synopses, release dates, trailers and poster art is
                supplied by{" "}
                <a
                  href="https://themoviedb.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nowrap"
                >
                  The Movie Database
                </a>{" "}
                (TMDB).
              </>
            }
          >
            <div className={styles.tmdbAttribution}>
              <Image
                src="/images/tmdb-logo.svg"
                alt="TMDB Logo"
                width={150}
                height={65}
              />
              <p className={styles.disclaimer}>
                Clusterflick uses the TMDB API but is not endorsed or certified
                by TMDB.
              </p>
            </div>

            <p className={styles.acknowledgement}>
              Ratings and review scores on film pages are courtesy of:
            </p>
            <ul className={styles.ratingSources}>
              {ratingSources.map((source) => (
                <li key={source.name}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.ratingSource}
                  >
                    {source.name}
                  </a>
                </li>
              ))}
            </ul>
            <p className={styles.acknowledgementNote}>
              Every score links back to the source it came from, so you can read
              the reviews behind it.
            </p>

            {/* The notices each source's terms ask for, kept together so they
                read as one block of small print rather than six. */}
            <div className={styles.notices}>
              {/* IMDb's non-commercial datasets licence asks for this exact
                sentence, with the URL shown, so it is quoted verbatim rather
                than folded into the credits above. */}
              <p className={styles.disclaimer}>
                Information courtesy of IMDb (
                <a
                  href="https://www.imdb.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://www.imdb.com
                </a>
                ). Used with permission.
              </p>
              {/* CC BY-NC 3.0 wants the source named and linked, and the licence
                named and linked, wherever the material is used. */}
              <p className={styles.disclaimer}>
                Bechdel Test results come from the{" "}
                <a
                  href="https://bechdeltest.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nowrap"
                >
                  Bechdel Test Movie List
                </a>
                , licensed under{" "}
                <a
                  href="https://creativecommons.org/licenses/by-nc/3.0/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nowrap"
                >
                  CC BY-NC 3.0
                </a>
                .
              </p>
              {/* TfL's open data terms ask for "Powered by TfL Open Data" and the
                OS copyright line wherever the station data is used. */}
              <p className={styles.disclaimer}>
                Station locations are powered by{" "}
                <a
                  href="https://tfl.gov.uk/info-for/open-data-users/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nowrap"
                >
                  TfL Open Data
                </a>
                . Contains OS data © Crown copyright and database rights 2016
                and Geomni UK Map data © and database rights 2019.
              </p>
              <p className={styles.disclaimer}>
                All trademarks are the property of their respective owners.
                Clusterflick is not endorsed by, certified by or affiliated with
                any of them.
              </p>
            </div>
          </ContentSection>
        </div>
      </div>

      <Divider />

      <div className={styles.content}>
        <div className={styles.connectGroup}>
          <GroupHeader
            icon="/images/icons/neon-clapper.svg"
            iconWidth={66}
            iconHeight={66}
            title="Connect"
          />

          <ContentSection
            title="Find Us Around the Internet"
            intro="Say hi! 👋"
            as="h3"
            align="center"
          >
            <CardGrid>
              {socialLinks.map((link) => (
                <LinkCard
                  key={link.name}
                  href={link.url}
                  variant="social"
                  aria-label={`Clusterflick on ${link.name}`}
                >
                  <CardIcon>
                    <link.Icon aria-hidden="true" />
                  </CardIcon>
                  <CardContent>{link.handle}</CardContent>
                </LinkCard>
              ))}
            </CardGrid>
          </ContentSection>

          <ContentSection title="Or Get in Touch" as="h3" align="center">
            <LinkCard
              href="mailto:hello@clusterflick.com"
              variant="contact"
              aria-label="Email Clusterflick at hello@clusterflick.com"
            >
              <CardIcon>
                <EmailIcon aria-hidden="true" />
              </CardIcon>
              <CardContent>hello@clusterflick.com</CardContent>
            </LinkCard>
          </ContentSection>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
