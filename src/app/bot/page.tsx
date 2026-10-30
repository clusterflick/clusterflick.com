import type { Metadata } from "next";
import Link from "next/link";
import HeroSection from "@/components/hero-section";
import OutlineHeading from "@/components/outline-heading";
import PageHeader from "@/components/page-header";
import SiteFooter from "@/components/site-footer";
import Divider from "@/components/divider";
import ContentSection from "@/components/content-section";
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
        <ContentSection title="What it collects">
          <p className={styles.body}>
            Factual scheduling information: which film is showing, where and
            when, the format, accessibility details such as subtitled or
            audio-described screenings, and the link to book. It doesn&apos;t
            collect synopses, marketing copy, images or prices.
          </p>
        </ContentSection>

        <ContentSection title="What happens to it">
          <p className={styles.body}>
            Every listing on Clusterflick links directly to the venue&apos;s own
            booking page. Clusterflick doesn&apos;t sell tickets. The processed
            listings are also published openly under a{" "}
            <Link href="/data-licence">CC BY 4.0 licence</Link>, and other
            London film sites use them.
          </p>
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
            If you&apos;d rather your venue wasn&apos;t listed, get in touch and
            tell me why.
          </p>
        </ContentSection>
      </div>
      <SiteFooter />
    </main>
  );
}
