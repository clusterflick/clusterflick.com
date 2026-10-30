import type { Metadata } from "next";
import StandardPageLayout from "@/components/standard-page-layout";
import LinkedList from "@/components/linked-list";
import { REPORTS, getReportUrl } from "@/data/reports";
import { formatReportDate } from "./format-report-date";
import styles from "./page.module.css";

const title = "Reports";
const description =
  "What London's cinema listings show, and how Clusterflick gathers them. Each report is a dated snapshot, free to cite.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/reports" },
  openGraph: {
    title: `${title} | Clusterflick`,
    description,
    url: "https://clusterflick.com/reports",
    siteName: "Clusterflick",
  },
};

export default function ReportsPage() {
  return (
    <StandardPageLayout title={title} subtitle={description}>
      <p className={styles.intro}>
        Clusterflick gathers the listings of 450+ London venues every day, which
        adds up to a record of what London actually screened. These reports are
        what that record shows, and how we gather it. Each is fixed at the date
        given, and like the data behind them they&apos;re free to use with
        credit.
      </p>
      <LinkedList
        items={REPORTS.map((report) => ({
          key: report.id,
          href: getReportUrl(report),
          label: report.title,
          detail: `Data to ${formatReportDate(report.asOf)}`,
        }))}
      />
    </StandardPageLayout>
  );
}
