import Link from "next/link";
import StandardPageLayout from "@/components/standard-page-layout";
import ContentSection from "@/components/content-section";
import ReleaseFreshness from "@/components/release-freshness";
import { ButtonAnchor, ButtonLink } from "@/components/button";
import { CalendarIcon, FileCodeIcon } from "@/components/icons";
import type { ReleaseStatus } from "@/utils/release-status";
import {
  DATA_INDEX_URL,
  DATA_LATEST_URL,
  DATA_SCHEMA_URL,
  LICENSED_DATASETS,
} from "./data";
import styles from "./page.module.css";

const LATEST_EXAMPLE = `{
  "generatedAt": "2026-10-26T06:03:54.611Z",
  "releases": {
    "data": {
      "repository": "clusterflick/data-transformed",
      "tag": "20261026.050352",
      "publishedAt": "2026-10-26T05:07:56Z"
    },
    "calendar": {
      "repository": "clusterflick/data-calendar",
      "tag": "20261026.051820",
      "publishedAt": "2026-10-26T05:18:21Z"
    }
  }
}`;

const POLL_EXAMPLE = `const response = await fetch("${DATA_LATEST_URL}");
const { releases } = await response.json();

if (releases.data.tag !== lastSeenTag) {
  // New data: fetch index.json and the venue files you need
  lastSeenTag = releases.data.tag;
}`;

interface DatasetsPageContentProps {
  status: ReleaseStatus;
  /** Off in stories, which have no published data to read */
  latestUrl?: string | null;
}

export default function DatasetsPageContent({
  status,
  latestUrl,
}: DatasetsPageContentProps) {
  const newest = status.datasets
    .map(({ latest }) => latest)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0];

  return (
    <StandardPageLayout
      title="Datasets"
      subtitle="Clusterflick's screening data, published for reuse under CC BY 4.0."
    >
      <div className={styles.content}>
        <div className={styles.freshness}>
          <ReleaseFreshness
            latest={newest}
            builtAt={status.builtAt}
            latestUrl={latestUrl}
          />
          <p className={styles.statusLink}>
            <Link href="/datasets/status">See the release history</Link>
          </p>
        </div>

        <ContentSection
          title="What's published"
          intro={
            <>
              Two datasets, both covering every venue Clusterflick lists. Both
              are free to use, including commercially, under CC BY 4.0 as long
              as you credit Clusterflick; the film metadata from The Movie
              Database inside them isn&apos;t ours to license. The{" "}
              <Link href="/data-licence">data licence</Link> has the terms.
            </>
          }
        >
          <ul className={styles.datasetList}>
            <li className={styles.datasetItem}>
              <span className={styles.datasetIcon}>
                <FileCodeIcon size={22} />
              </span>
              <p className={styles.datasetText}>
                <strong>A JSON file for each venue</strong>, listing its
                showings in{" "}
                <a
                  href={DATA_SCHEMA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  a shared schema
                </a>
                . The fullest form of the data, and the one to build on.
              </p>
            </li>
            <li className={styles.datasetItem}>
              <span className={styles.datasetIcon}>
                <CalendarIcon size={22} />
              </span>
              <p className={styles.datasetText}>
                <strong>An iCalendar file for each venue</strong>, to subscribe
                to or hand to anything that reads ICS.
              </p>
            </li>
          </ul>
          <p className={styles.indexLink}>
            <ButtonAnchor
              href={DATA_INDEX_URL}
              target="_blank"
              rel="noopener noreferrer"
              variant="secondary"
            >
              Open index.json
            </ButtonAnchor>
          </p>
        </ContentSection>

        <ContentSection
          title="Where to get it"
          intro="Every file has a fixed address, so you can link to it, subscribe to it, or fetch it on a schedule."
        >
          <dl className={styles.snippets}>
            <div className={styles.snippet}>
              <dt className={styles.snippetLabel}>Index</dt>
              <dd className={styles.snippetValue}>
                <pre>
                  <code>{DATA_INDEX_URL}</code>
                </pre>
              </dd>
            </div>
            <div className={styles.snippet}>
              <dt className={styles.snippetLabel}>Latest releases</dt>
              <dd className={styles.snippetValue}>
                <pre>
                  <code>{DATA_LATEST_URL}</code>
                </pre>
              </dd>
            </div>
            {LICENSED_DATASETS.map((dataset) => (
              <div key={dataset.key} className={styles.snippet}>
                <dt className={styles.snippetLabel}>{dataset.name}</dt>
                <dd className={styles.snippetValue}>
                  <pre>
                    <code>{dataset.pattern}</code>
                  </pre>
                </dd>
              </div>
            ))}
            <div className={styles.snippet}>
              <dt className={styles.snippetLabel}>JSON schema</dt>
              <dd className={styles.snippetValue}>
                <pre>
                  <code>{DATA_SCHEMA_URL}</code>
                </pre>
              </dd>
            </div>
          </dl>
          <p className={styles.body}>
            Start from the{" "}
            <a href={DATA_INDEX_URL} target="_blank" rel="noopener noreferrer">
              index
            </a>
            . It lists every venue by id with its name, type, address,
            coordinates and page on Clusterflick, and the files published for
            it. All of these files can be read from a browser on any site.
          </p>
          <p className={styles.body}>
            Only the latest data is hosted here. Every earlier release is kept
            on GitHub, for{" "}
            <a
              href={LICENSED_DATASETS[0].archive}
              target="_blank"
              rel="noopener noreferrer"
            >
              the data files
            </a>{" "}
            and{" "}
            <a
              href={LICENSED_DATASETS[1].archive}
              target="_blank"
              rel="noopener noreferrer"
            >
              the calendars
            </a>
            , if you need to look back.
          </p>
        </ContentSection>

        <ContentSection
          title="The schema"
          intro="The per-venue JSON files follow a published JSON Schema."
        >
          <p className={styles.body}>
            The{" "}
            <a href={DATA_SCHEMA_URL} target="_blank" rel="noopener noreferrer">
              schema
            </a>{" "}
            is the one the pipeline checks every venue&apos;s file against
            before it is released, so it describes the files as published. It is
            stable in practice but not frozen: it changes when the pipeline
            needs it to, with the aim of staying backwards compatible.
          </p>
          <p className={styles.body}>
            The calendar feeds are standard iCalendar. Each event links to the
            film&apos;s page here, and the feed&apos;s{" "}
            <code className={styles.inlineCode}>X-WR-CALDESC</code> carries the
            credit the licence asks for.
          </p>
        </ContentSection>

        <ContentSection
          title="How often it changes"
          intro="New data is released several times a day, as the pipeline runs."
        >
          <p className={styles.body}>
            Each pipeline run releases both datasets, the calendar feeds a few
            minutes after the data files they are built from. The files here are
            replaced when the site next deploys after a release. The{" "}
            <Link href="/datasets/status">release history</Link> shows how often
            that has happened and at what time of day.
          </p>
          <p className={styles.body}>
            The files are cached for up to ten minutes, so there is nothing to
            gain from fetching them more than once an hour.
          </p>
        </ContentSection>

        <ContentSection
          title="Checking for new data"
          intro="Poll latest.json, and compare its release tags with the ones you saw last."
        >
          <p className={styles.body}>
            <a href={DATA_LATEST_URL} target="_blank" rel="noopener noreferrer">
              latest.json
            </a>{" "}
            is a few hundred bytes: the release each dataset was built from,
            exactly as the index gives it, and nothing else. Fetch it as often
            as once an hour, and only fetch the rest when a tag has changed.
          </p>
          <div className={styles.example}>
            <pre>
              <code>{LATEST_EXAMPLE}</code>
            </pre>
          </div>
          <p className={styles.body}>
            Compare the <code className={styles.inlineCode}>tag</code> of the
            dataset you use, not{" "}
            <code className={styles.inlineCode}>generatedAt</code>. The site
            deploys more than once for each release, and{" "}
            <code className={styles.inlineCode}>generatedAt</code> moves with
            every deploy whether the data changed or not.
          </p>
          <div className={styles.example}>
            <pre>
              <code>{POLL_EXAMPLE}</code>
            </pre>
          </div>
        </ContentSection>

        <p className={styles.licenceLink}>
          <ButtonLink href="/data-licence" variant="secondary">
            Read the data licence
          </ButtonLink>
        </p>
      </div>
    </StandardPageLayout>
  );
}
