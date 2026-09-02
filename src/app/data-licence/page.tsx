import type { Metadata } from "next";
import Link from "next/link";
import HeroSection from "@/components/hero-section";
import OutlineHeading from "@/components/outline-heading";
import PageHeader from "@/components/page-header";
import SiteFooter from "@/components/site-footer";
import Divider from "@/components/divider";
import ContentSection from "@/components/content-section";
import CardGrid from "@/components/card-grid";
import LinkCard, { CardDescription, CardTitle } from "@/components/link-card";
import {
  LICENSED_DATASETS,
  ATTRIBUTION_SNIPPETS,
  INTERNAL_REPOS,
} from "./data";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Data Licence",
  description:
    "Clusterflick's London cinema screening data is available under CC BY 4.0. Here's what's covered, how to credit it, and what isn't included.",
  alternates: {
    canonical: "/data-licence",
  },
};

const CC_BY = "https://creativecommons.org/licenses/by/4.0/";
const TMDB_TERMS = "https://www.themoviedb.org/api-terms-of-use";
// Deep link to the Attribution clause. Deliberately a link rather than a quote:
// what TMDB asks for is theirs to change, and a copy here would go stale silently.
const TMDB_ATTRIBUTION =
  "https://www.themoviedb.org/api-terms-of-use#:~:text=3.%20Attribution";

export default function DataLicencePage() {
  return (
    <main id="main-content">
      <PageHeader />

      <HeroSection
        backgroundImage="/images/light-circles.jpg"
        backgroundImageAlt="Abstract blurred cinema lights"
        align="center"
        className={styles.hero}
      >
        <OutlineHeading className={styles.title}>Data Licence</OutlineHeading>
        <p className={styles.tagline}>
          Clusterflick&apos;s screening data is free to use, including
          commercially, under{" "}
          <a href={CC_BY} target="_blank" rel="noopener noreferrer">
            CC BY 4.0
          </a>
          . Credit us, and it&apos;s yours.
        </p>
      </HeroSection>

      <Divider />

      <div className={styles.content}>
        <ContentSection
          title="What you can use"
          intro="Two datasets are published for reuse. Both are rebuilt daily and released on GitHub."
        >
          <CardGrid className={styles.datasets}>
            {LICENSED_DATASETS.map((dataset) => (
              // No CardArrow: it is absolutely positioned over the bottom of
              // the card and these descriptions run to the full height, so on
              // hover it lands on top of the last line.
              <LinkCard key={dataset.name} href={dataset.url} variant="feature">
                <CardTitle>{dataset.name}</CardTitle>
                <CardDescription>{dataset.description}</CardDescription>
              </LinkCard>
            ))}
          </CardGrid>

          <p className={styles.body}>
            The licence covers our own contribution. Which film is showing, at
            which venue, on which screen, at what time. The booking link, the
            performance notes, the accessibility and format flags. The venue
            records, with their addresses and coordinates. And the normalisation
            and film matching that turns 400+ venues&apos; wildly different
            listings into one consistent shape.
          </p>
          <p className={styles.body}>
            You can redistribute it, build on it, and sell what you build. There
            is no non-commercial restriction and no share-alike requirement.
          </p>
        </ContentSection>

        <ContentSection
          title="How to credit us"
          intro="CC BY 4.0 asks for credit wherever the data appears. Copy whichever of these fits — nothing more elaborate is expected."
        >
          <dl className={styles.snippets}>
            {ATTRIBUTION_SNIPPETS.map((snippet) => (
              <div key={snippet.label} className={styles.snippet}>
                <dt className={styles.snippetLabel}>{snippet.label}</dt>
                <dd className={styles.snippetValue}>
                  <pre>
                    <code>{snippet.value}</code>
                  </pre>
                </dd>
              </div>
            ))}
          </dl>
          <p className={styles.body}>
            Rendered, that reads{" "}
            <em>
              Screening data from{" "}
              <a href="https://clusterflick.com">Clusterflick</a> (CC BY 4.0)
            </em>
            . Link the words rather than pasting a bare URL if your medium
            allows it, and put it somewhere a reader would look — a footer, an
            about page, a caption. The licence also asks that you say so if you
            have changed the data.
          </p>
          <p className={styles.body}>
            Calendar feeds carry the same credit inside the file, in their{" "}
            <code className={styles.inlineCode}>X-WR-CALDESC</code> property,
            because a feed someone has subscribed to has left everything else
            behind. Leave it intact if you pass a feed on.
          </p>
        </ContentSection>

        <ContentSection
          title="What the licence doesn't cover"
          intro="Film metadata isn't ours to give away."
        >
          <p className={styles.body}>
            Synopses, cast and crew, release dates, poster art and trailers come
            from{" "}
            <a
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="nowrap"
            >
              The Movie Database
            </a>{" "}
            (TMDB). We use it under the{" "}
            <a href={TMDB_TERMS} target="_blank" rel="noopener noreferrer">
              TMDB API terms of use
            </a>
            , which don&apos;t let us sublicense it onwards. So it is excluded
            from the CC BY 4.0 grant: your use of it is a matter between you and
            TMDB, on their terms rather than ours. If you show any of it, read{" "}
            <a
              href={TMDB_ATTRIBUTION}
              target="_blank"
              rel="noopener noreferrer"
            >
              their attribution requirements
            </a>{" "}
            and follow whatever they ask for at the time.
          </p>
          <p className={styles.body}>
            In the per-venue JSON these fields are separable — they live in a{" "}
            <code className={styles.inlineCode}>themoviedb</code> object (and a{" "}
            <code className={styles.inlineCode}>themoviedbs</code> array for
            events covering more than one film) on each matched showing. Drop
            those keys and what remains is entirely CC BY 4.0. The TMDB id is
            still worth keeping as a join key if you hold your own TMDB
            credentials.
          </p>
          <p className={styles.body}>
            In the calendar feeds they aren&apos;t separable: the synopsis and
            cast are written into each event&apos;s description as prose. If you
            need a clean split, work from the per-venue JSON instead.
          </p>
          <p className={styles.body}>
            The ratings and review scores shown on film pages are not part of
            either dataset, and are not licensed for reuse. Each belongs to the
            site it came from.
          </p>
        </ContentSection>

        <ContentSection
          title="Everything else is an internal build artifact"
          intro="The pipeline runs in the open, so every stage of it is published. Most of those releases exist to feed the next stage, not to be used."
        >
          <p className={styles.body}>
            None of the repositories below is licensed for reuse. They carry
            third-party content we hold no rights in, they have no schema
            guarantees, and their shape changes whenever the pipeline needs it
            to — without notice, without a version bump and without a
            deprecation period. If you build against one, it will break, and
            that will not be a bug.
          </p>
          <ul className={styles.repoList}>
            {INTERNAL_REPOS.map((repo) => (
              <li key={repo.name} className={styles.repo}>
                <code className={styles.inlineCode}>{repo.name}</code>
                <span className={styles.repoNote}>{repo.note}</span>
              </li>
            ))}
          </ul>
          <p className={styles.body}>
            None of this applies to the code. Every repository in the pipeline,
            these included, is open source under the MIT licence. What changes
            from one repository to the next is only the terms on the data it
            releases.
          </p>
        </ContentSection>

        <ContentSection
          title="No warranty, no promises"
          intro="This project publishes on a best-effort daily schedule."
        >
          <p className={styles.body}>
            The data is provided as-is. There is no warranty, and no guarantee
            of accuracy, availability or continuity. Screenings get cancelled,
            venues change their websites, matches go wrong and runs fail. Always
            send people to the venue&apos;s own booking page before they turn
            up. The schema of the licensed datasets is stable in practice, but
            it is not frozen, and we will change it when we need to, aiming as
            best we can to keep it backwards compatible.
          </p>
          <p className={styles.body}>
            Releases are hosted by GitHub rather than by us, so whatever you
            build against them lives within{" "}
            <a
              href="https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub&apos;s rate limits
            </a>
            . Authenticated requests get a far higher allowance than anonymous
            ones, which is the usual fix if you start seeing 403s.
          </p>
        </ContentSection>

        <ContentSection
          title="Questions"
          intro={
            <>
              If something here is unclear, or you want to use the data in a way
              this page doesn&apos;t obviously allow, email{" "}
              <a href="mailto:hello@clusterflick.com">hello@clusterflick.com</a>{" "}
              and ask. We would rather answer than have you guess. If you build
              something, tell us — there is a list of{" "}
              <Link href="/about">sites built on this data</Link> and we&apos;d
              like to add you to it.
            </>
          }
        />
      </div>
      <SiteFooter />
    </main>
  );
}
