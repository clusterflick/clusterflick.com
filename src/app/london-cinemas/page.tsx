import type { Metadata } from "next";
import { getStaticData } from "@/utils/get-static-data";
import { LONDON_BOROUGHS } from "@/data/london-boroughs";
import { groupVenuesByBorough } from "@/utils/get-borough-venues";
import { getBoroughUrl } from "@/utils/get-borough-url";
import LondonCinemasPageContent from "./page-content";

export const metadata: Metadata = {
  title: "London Cinemas by Borough",
  description:
    "Find cinemas in every London borough. Browse independent cinemas, arthouse venues and major chains near you, from Hackney to Hammersmith, Camden to Croydon.",
  openGraph: {
    title: "London Cinemas by Borough | Clusterflick",
    description:
      "Find cinemas in every London borough. Browse independent cinemas, arthouse venues and major chains near you.",
    url: "https://clusterflick.com/london-cinemas",
    siteName: "Clusterflick",
  },
  twitter: {
    card: "summary",
    title: "London Cinemas by Borough | Clusterflick",
    description:
      "Find cinemas in every London borough. Browse independent cinemas, arthouse venues and major chains near you.",
    creator: "@clusterflick",
  },
};

export type BoroughListItem = {
  name: string;
  slug: string;
  href: string;
  venueCount: number;
};

export default async function LondonCinemasPage() {
  const data = await getStaticData();
  const venuesByBorough = groupVenuesByBorough(data.venues);

  const boroughs: BoroughListItem[] = LONDON_BOROUGHS.filter((b) =>
    venuesByBorough.has(b.slug),
  )
    .map((b) => ({
      name: b.name,
      slug: b.slug,
      href: getBoroughUrl(b),
      venueCount: venuesByBorough.get(b.slug)!.length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const totalBoroughs = boroughs.length;

  return (
    <LondonCinemasPageContent
      boroughs={boroughs}
      totalBoroughs={totalBoroughs}
    />
  );
}
