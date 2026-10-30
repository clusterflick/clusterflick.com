/**
 * Reports are dated snapshots, written to be cited: what the listings show,
 * or how we gather them.
 * Each one's numbers live beside it in this directory and are never
 * recomputed at build time: a report says what was true when it was written.
 */
export type Report = {
  id: string;
  title: string;
  description: string;
  /** Date the report's data runs to, as YYYY-MM-DD. */
  asOf: string;
  /** Boroughs the report is about, so their pages can link to it. */
  boroughSlugs?: string[];
};

export const REPORTS: Report[] = [
  {
    id: "data-sources-2026",
    title: "Where Clusterflick's data comes from",
    description:
      "Every place we fetch listings and film data from, how we fetch it, and what each site's robots.txt and terms ask.",
    asOf: "2026-10-30",
  },
];

export function getReportUrl(report: Pick<Report, "id">): string {
  return `/reports/${report.id}`;
}
