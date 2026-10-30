import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import HeroSection from "@/components/hero-section";
import OutlineHeading from "@/components/outline-heading";
import PageHeader from "@/components/page-header";
import SiteFooter from "@/components/site-footer";
import Divider from "@/components/divider";
import ContentSection from "@/components/content-section";
import DataPageLinks from "@/app/datasets/data-page-links";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "The Clusterflick bot",
  description:
    "What the Clusterflick bot collects from cinema and ticketing websites, how it behaves, and how to get in touch.",
  alternates: {
    canonical: "/bot",
  },
};

export default function BotPage() {
  return (
    <main id="main-content">
      <PageHeader />

      <HeroSection
        backgroundImage="/images/light-circles.jpg"
        backgroundImageAlt="Abstract blurred cinema lights"
        align="center"
        className={styles.hero}
      >
        {/* Decorative: the heading below already says what it is. */}
        <div className={styles.robot}>
          <Image
            src="/images/icons/neon-robot.png"
            alt=""
            width={180}
            height={149}
            priority
          />
        </div>
        <OutlineHeading className={styles.title}>
          The Clusterflick bot
        </OutlineHeading>
        <p className={styles.tagline}>
          Clusterflick is a free listings site covering every screening at over
          450 London cinemas. To keep it up to date, a bot collects listings
          from cinema websites and ticketing platforms twice a day, at around
          4am and 4pm UK time.
        </p>
      </HeroSection>

      <Divider />

      <div className={styles.content}>
        <ContentSection title="What it uses">
          <p className={styles.body}>
            Factual scheduling information: which film is showing, where and
            when, the format, accessibility details such as subtitled or
            audio-described screenings, and the link to book. The bot saves
            pages as it finds them, but only those facts are used. Your
            synopses, marketing copy, images and prices don&apos;t appear on
            Clusterflick or in its published data.
          </p>
        </ContentSection>

        <ContentSection title="What happens to the data">
          <p className={styles.body}>
            Every listing on Clusterflick links directly to the venue&apos;s own
            booking page. Clusterflick doesn&apos;t sell tickets. The listing
            data that powers Clusterflick is also published openly under a{" "}
            <Link href="/data-licence">CC BY 4.0 licence</Link>, and{" "}
            <Link href="/about#built-with-clusterflick">
              other London film sites
            </Link>{" "}
            use it.
          </p>
          <div className={styles.dataPageLinks}>
            <DataPageLinks />
          </div>
        </ContentSection>

        <ContentSection title="How it behaves">
          <p className={styles.body}>
            Each run fetches current listings from scratch, so if you change or
            remove a screening, Clusterflick reflects that after the next run.
            Requests are spaced out to keep load low, and the bot slows down
            where a site limits request rates. Some sites block automated
            requests, so for those the bot uses a standard browser, and its
            visits will look like ordinary traffic in your logs.
          </p>
        </ContentSection>

        <ContentSection title="Getting in touch">
          <p className={styles.body}>
            If the bot is causing problems for your site, or a listing is wrong,
            email{" "}
            <a href="mailto:hello@clusterflick.com">hello@clusterflick.com</a>.
          </p>
          <p className={styles.body}>
            If you&apos;d rather your venue wasn&apos;t listed, get in touch and
            tell me why.
          </p>
        </ContentSection>
      </div>
      <SiteFooter />
    </main>
  );
}
