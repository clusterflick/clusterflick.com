/**
 * Reports are dated snapshots of what the listings show, written to be cited.
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
    id: "lewisham-2026",
    title: "Lewisham's year without a cinema",
    description:
      "In 2026 so far, Lewisham has had 94 film screenings: as many as Westminster has by 2:40pm on a typical day.",
    asOf: "2026-10-29",
    boroughSlugs: ["lewisham"],
  },
];

export function getReportUrl(report: Pick<Report, "id">): string {
  return `/reports/${report.id}`;
}
