import type { Metadata } from "next";
import { getStaticData } from "@/utils/get-static-data";
import { LONDON_BOROUGHS } from "@/data/london-boroughs";
import { groupVenuesByBorough } from "@/utils/get-borough-venues";
import { getBoroughUrl } from "@/utils/get-borough-url";
import { formatDateLong } from "@/utils/format-date";
import { getBoroughWeek } from "./get-borough-week";
import LondonCinemasPageContent from "./page-content";

export const metadata: Metadata = {
  title: "London Cinemas by Borough — What's On Across London",
  description:
    "A map of what's on at London's cinemas this week, borough by borough. See how many films are showing in each borough, from independent arthouse venues and repertory cinemas to major multiplex chains, and find the venues near you.",
  alternates: {
    canonical: "/london-cinemas",
  },
  openGraph: {
    title:
      "London Cinemas — Browse Cinemas Across Every Borough | Clusterflick",
    description:
      "Discover cinemas across London, borough by borough. Independent arthouse venues, repertory cinemas and major chains — find what's showing near you.",
    url: "https://clusterflick.com/london-cinemas",
    siteName: "Clusterflick",
  },
  twitter: {
    card: "summary",
    title:
      "London Cinemas — Browse Cinemas Across Every Borough | Clusterflick",
    description:
      "Discover cinemas across London, borough by borough. Independent arthouse venues, repertory cinemas and major chains — find what's showing near you.",
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

  // A build-time snapshot, like the home page's counts: the page is rebuilt
  // with every release, and says which day it counted from.
  const now = Date.parse(new Date().toISOString());
  const { map, week } = getBoroughWeek(data, venuesByBorough, now);

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "London Cinemas",
    description:
      "Cinemas and screening venues across London boroughs, from independent arthouse cinemas to major multiplex chains.",
    numberOfItems: boroughs.length,
    itemListElement: boroughs.map((borough, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "City",
        name: borough.name,
        url: `https://clusterflick.com${borough.href}`,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LondonCinemasPageContent
        boroughs={boroughs}
        totalBoroughs={totalBoroughs}
        map={map}
        week={week}
        countedOn={formatDateLong(now)}
      />
    </>
  );
}
