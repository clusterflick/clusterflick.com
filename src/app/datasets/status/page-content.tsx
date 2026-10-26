import Link from "next/link";
import StandardPageLayout from "@/components/standard-page-layout";
import ContentSection from "@/components/content-section";
import type { ReleaseStatus } from "@/utils/release-status";
import StatusView from "./status-view";
import styles from "./page.module.css";

interface DataStatusPageContentProps {
  status: ReleaseStatus;
  /** Off in stories, which have no published data to read */
  latestUrl?: string | null;
}

export default function DataStatusPageContent({
  status,
  latestUrl,
}: DataStatusPageContentProps) {
  return (
    <StandardPageLayout
      title="Data Status"
      subtitle="When the published datasets have been released, and how often."
    >
      <div className={styles.content}>
        <StatusView status={status} latestUrl={latestUrl} />

        <ContentSection title="About this page">
          <p className={styles.body}>
            This is a record of what has happened, drawn from every release of
            the two datasets. It is a personal project run on a best-effort
            basis, and the history here says nothing about what happens next.
          </p>
          <p className={styles.body}>
            The page is rebuilt with each release, but the time since the last
            one and the days without one are worked out in your browser, so if
            releases stop, this page shows it. How to use the data, and how to
            tell when it has changed, is on the{" "}
            <Link href="/datasets">datasets page</Link>.
          </p>
        </ContentSection>
      </div>
    </StandardPageLayout>
  );
}
