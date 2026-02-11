import type { Metadata } from "next";
import Image from "next/image";
import HeroSection from "@/components/hero-section";
import LinkCard, {
  CardArrow,
  CardContent,
  CardDescription,
  CardIcon,
  CardTitle,
} from "@/components/link-card";
import { EmailIcon } from "@/components/icons";
import Divider from "@/components/divider";
import OutlineHeading from "@/components/outline-heading";
import PageHeader from "@/components/page-header";
import ContentSection from "@/components/content-section";
import GroupHeader from "@/components/group-header";
import CardGrid from "@/components/card-grid";
import StatusSection from "./components/status-section";
import { socialLinks, dataFormats } from "./data";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn more about Clusterflick – the open source project helping you find film screenings across London cinemas.",
};

export default function AboutPage() {
  return (
    <main id="main-content">
      <PageHeader backUrl="/" backText="Back to film list" />

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
            width={320}
            height={320}
          />
        </div>
        <OutlineHeading className={styles.title}>Clusterflick</OutlineHeading>
        <p className={styles.tagline}>
          <strong>Every film, every cinema, one place.</strong>
          <br />
          Compare screenings across London and find your perfect
          movie&nbsp;night.
          <br />
          Whether you&apos;re chasing new releases or cult classics, we make it
          easy to see what&apos;s on, where, and&nbsp;when.
        </p>
      </HeroSection>

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

      <Divider />

      <div className={styles.content}>
        <div className={styles.technicalGroup}>
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
            title="Film Data"
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
                width={190}
                height={82}
              />
              <p className={styles.tmdbDisclaimer}>
                Clusterflick uses the TMDB API but is not endorsed or certified
                by TMDB.
              </p>
            </div>
          </ContentSection>

          <ContentSection
            title="Open Source"
            as="h3"
            align="center"
            intro={
              <>
                The code for this site, the processing pipeline, and data
                generated is all open source and{" "}
                <a
                  href="https://github.com/clusterflick/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  available on GitHub
                </a>
                .
              </>
            }
          />

          <ContentSection
            title="Showing Data"
            as="h3"
            align="center"
            intro="The showing data is refreshed early every morning and available in different formats:"
          >
            <CardGrid>
              {dataFormats.map((format) => (
                <LinkCard key={format.name} href={format.url} variant="feature">
                  <CardTitle>{format.name}</CardTitle>
                  <CardDescription>
                    {format.description}
                    <br />
                    <br />
                  </CardDescription>
                  <CardArrow />
                </LinkCard>
              ))}
            </CardGrid>
          </ContentSection>
        </div>
      </div>
    </main>
  );
}
