import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import HeroSection from "@/components/hero-section";
import StandardPageLayout from "@/components/standard-page-layout";
import OutlineHeading from "@/components/outline-heading";
import ContentSection from "@/components/content-section";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "What Clusterflick stores about you, who handles it for us, what stays on your device, and how to see, export or delete it.",
  alternates: {
    canonical: "/privacy",
  },
};

// Change this whenever the page's substance changes, so a reader coming back
// can tell whether anything has moved since they last read it.
const LAST_UPDATED = "11 November 2026";

const ICO_COMPLAIN = "https://ico.org.uk/make-a-complaint/";

interface Entry {
  name: string;
  value: ReactNode;
}

const PROCESSORS: Entry[] = [
  {
    name: "Google Firebase",
    value: (
      <>
        Stores your lists, and the film details that go with them, in London (
        <code className={styles.inlineCode}>europe-west2</code>). Your account
        and sign-in emails are handled by Firebase Authentication, which Google
        may process outside the UK; it covers such transfers under its{" "}
        <a
          href="https://firebase.google.com/terms/data-processing-terms"
          target="_blank"
          rel="noopener noreferrer"
        >
          data processing terms
        </a>
        .
      </>
    ),
  },
  {
    name: "Cloudflare",
    value:
      "Sits in front of the whole site, so it sees the IP address and browser details of every request, as any web host does. It also runs the small service that searches TheMovieDB for you (below).",
  },
  {
    name: "GitHub Pages",
    value:
      "Hosts the site's files, and sees requests that Cloudflare passes on to it.",
  },
  {
    name: "Umami",
    value:
      "Counts page visits and a few anonymous events, such as which filters get used. It sets no cookies and is not linked to your account.",
  },
  {
    name: "CARTO",
    value:
      "Serves the map tiles on pages with a map, so your browser fetches them from CARTO directly.",
  },
  {
    name: "TheMovieDB",
    value: (
      <>
        When you search for a film that isn&apos;t showing, or import from
        Letterboxd, the titles and years you&apos;re looking for are sent to
        TheMovieDB through our search service. Your email address and lists are
        not.
      </>
    ),
  },
];

const DEVICE_STORAGE: Entry[] = [
  {
    name: "Sign-in",
    value: (
      <>
        While you&apos;re signed in, Firebase keeps your session in your
        browser&apos;s storage, and we keep a{" "}
        <code className={styles.inlineCode}>clusterflick-signed-in</code> flag
        so pages know to load your lists. Neither is set unless you sign in.
      </>
    ),
  },
  {
    name: "Sign-in link",
    value: (
      <>
        Your email address is kept in{" "}
        <code className={styles.inlineCode}>clusterflick-sign-in-email</code>{" "}
        between asking for a sign-in link and opening it, so the link can be
        checked. It is deleted when the link is used and ignored after an hour.
      </>
    ),
  },
  {
    name: "Layout",
    value:
      "The height your watchlist and directors rows on the home page last had, so the page doesn't jump while they load.",
  },
  {
    name: "This tab only",
    value:
      "Your filters, the place you picked venues near, and where you'd scrolled to, kept in session storage so Back returns you to where you were. Your location, if you share it, stays here too: it is used in your browser and never sent to us.",
  },
];

export default function PrivacyPage() {
  return (
    <StandardPageLayout
      width="prose"
      hero={
        <HeroSection
          backgroundImage="/images/light-circles.jpg"
          backgroundImageAlt="Abstract blurred cinema lights"
          align="center"
          className={styles.hero}
        >
          <OutlineHeading className={styles.title}>Privacy</OutlineHeading>
          <p className={styles.tagline}>
            You can use Clusterflick without telling us anything. If you make an
            account, we keep your email address and your lists, and nothing
            more.
          </p>
        </HeroSection>
      }
    >
      <ContentSection
        title="Who we are"
        intro={
          <>
            Clusterflick is run as an independent project, and is responsible
            for the personal data described here. Questions, requests and
            complaints go to{" "}
            <a href="mailto:hello@clusterflick.com">hello@clusterflick.com</a>.
          </>
        }
      />

      <ContentSection
        title="What we hold"
        intro="Only what an account needs, and only if you make one."
      >
        <ul className={styles.list}>
          <li>
            <strong>Your email address</strong>, to send you sign-in links.
            There are no passwords.
          </li>
          <li>
            <strong>Your lists</strong>: the films on your watchlist and Seen
            list, with when you added each, and the venues you&apos;ve starred.
          </li>
          <li>
            <strong>Details of the films on your lists</strong>, such as their
            genres, directors and runtime, taken from TheMovieDB, for the stats
            on your Seen list.
          </li>
          <li>
            <strong>Account records Firebase keeps itself</strong>, such as when
            the account was created and last signed in to.
          </li>
        </ul>
        <p className={styles.body}>
          A Letterboxd file you import is read in your browser. Only the films
          you choose to add are saved, and the file itself never leaves your
          device.
        </p>
        <p className={styles.body}>
          Without an account, we hold nothing about you. The services below see
          the requests your browser makes, as any website&apos;s hosts do.
        </p>
      </ContentSection>

      <ContentSection
        title="Why"
        intro="To give you the lists you asked for, and to keep the site running."
      >
        <p className={styles.body}>
          Your account and lists exist because you asked for them, so we hold
          them to provide that service. Anonymous visit counts and the logs our
          hosts keep are in our legitimate interest in running the site and
          seeing which parts of it are used.
        </p>
        <p className={styles.body}>
          We don&apos;t sell your data, show you adverts, or send you anything
          but the sign-in emails you ask for.
        </p>
      </ContentSection>

      <ContentSection
        title="Who handles it for us"
        intro="The services the site runs on, each acting on our behalf."
      >
        <dl className={styles.entries}>
          {PROCESSORS.map((entry) => (
            <div key={entry.name} className={styles.entry}>
              <dt className={styles.entryName}>{entry.name}</dt>
              <dd className={styles.entryValue}>{entry.value}</dd>
            </div>
          ))}
        </dl>
      </ContentSection>

      <ContentSection
        title="On your device"
        intro="No cookies for tracking or advertising. What the site keeps in your browser, it keeps so the site works."
      >
        <dl className={styles.entries}>
          {DEVICE_STORAGE.map((entry) => (
            <div key={entry.name} className={styles.entry}>
              <dt className={styles.entryName}>{entry.name}</dt>
              <dd className={styles.entryValue}>{entry.value}</dd>
            </div>
          ))}
        </dl>
      </ContentSection>

      <ContentSection
        title="How long we keep it"
        intro="Until you delete your account."
      >
        <p className={styles.body}>
          Deleting your account from{" "}
          <Link href="/personalise">Personalise</Link> deletes your lists, the
          film details that go with them, and the account itself, straight away.
          Removing a single film from a list leaves its details behind until the
          account goes. The hosts above keep their own request logs for as long
          as their own terms say.
        </p>
      </ContentSection>

      <ContentSection
        title="Your rights"
        intro="It's your data, and most of what you can ask for you can do yourself."
      >
        <ul className={styles.list}>
          <li>
            <strong>See it and take it with you</strong>: everything is on{" "}
            <Link href="/personalise">Personalise</Link>, and Manage lists
            exports each list as a file Letterboxd can import.
          </li>
          <li>
            <strong>Correct it</strong>: add and remove films and venues there.
          </li>
          <li>
            <strong>Delete it</strong>: Manage account, then Delete account.
          </li>
        </ul>
        <p className={styles.body}>
          For anything else, such as a copy of what Firebase holds about your
          account, or an objection to how we use it, email{" "}
          <a href="mailto:hello@clusterflick.com">hello@clusterflick.com</a>. If
          you&apos;re unhappy with our answer, you can{" "}
          <a href={ICO_COMPLAIN} target="_blank" rel="noopener noreferrer">
            complain to the Information Commissioner&apos;s Office
          </a>
          .
        </p>
      </ContentSection>

      <ContentSection
        title="Changes"
        intro="If what we hold or who handles it changes, this page changes first."
      >
        <p className={styles.updated}>Last updated {LAST_UPDATED}.</p>
      </ContentSection>
    </StandardPageLayout>
  );
}
