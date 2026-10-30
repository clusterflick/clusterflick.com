/** "2026-10-19" → "19 October 2026", read as a calendar date in any zone. */
export function formatReportDate(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
