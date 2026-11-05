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
import StatusSection from "./components/status-section";
import type { StatusStats } from "./components/status-section/get-status-stats";
import { socialLinks, partnerSites, features, ratingSources } from "./data";
import styles from "./page.module.css";

interface AboutPageContentProps {
  /** The release's figures, counted at build time by `getStatusStats`. */
  stats: StatusStats;
}

/**
 * Everything the about page renders, given its figures. Split from the page so
 * its story can render it: the page itself reads the dataset from disk.
 */
export default function AboutPageContent({ stats }: AboutPageContentProps) {
  return (
    <>
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
          <StatusSection stats={stats} />
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
                  className={styles.compactCard}
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
                  className={styles.compactCard}
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

      <Divider />

      <div className={styles.content}>
        <div id="behind-the-scenes" className={styles.technicalGroup}>
          <GroupHeader
            icon="/images/icons/neon-projector.svg"
            iconWidth={80}
            iconHeight={66}
            title="Behind the Scenes"
          />

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
                The showing data is refreshed several times a day, published as
                a JSON file and a calendar feed for every venue, and free to use
                — including commercially — under{" "}
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

      <SiteFooter />
    </>
  );
}
