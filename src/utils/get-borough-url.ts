import type { LondonBorough } from "@/data/london-boroughs";

export function getBoroughUrl(borough: LondonBorough): string {
  return `/london-cinemas/${borough.slug}`;
}
