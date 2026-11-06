import type { Metadata } from "next";
import { getStaticData } from "@/utils/get-static-data";
import { groupVenuesByGroup } from "@/utils/get-venue-group-venues";
import { getVenueImagePath } from "@/utils/get-venue-image";
import { getCinemaGroupsIndex } from "@/utils/get-cinema-groups-index";
import { formatDateLong } from "@/utils/format-date";
import CinemaGroupsPageContent from "./page-content";

const title = "London Cinema Groups & Chains";
const description =
  "What's on at London's cinema chains this week — Picturehouse, Everyman, Curzon, ODEON, Vue, Cineworld and more. See each chain's films, what only it is showing, and every venue.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/cinema-groups",
  },
  openGraph: {
    title: `${title} | Clusterflick`,
    description,
    url: "https://clusterflick.com/cinema-groups",
    siteName: "Clusterflick",
  },
  twitter: {
    card: "summary",
    title: `${title} | Clusterflick`,
    description,
    creator: "@clusterflick",
  },
};

export default async function CinemaGroupsPage() {
  const data = await getStaticData();
  const map = groupVenuesByGroup(data.venues);

  // A build-time snapshot of the coming week, as the home page's counts and
  // /london-cinemas are: the page is rebuilt with every release, and says
  // which day it counted from.
  const now = Date.parse(new Date().toISOString());
  const index = getCinemaGroupsIndex(data, map, {
    now,
    getImagePath: getVenueImagePath,
  });
  const groups = [...index.activeGroups, ...index.inactiveGroups];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: title,
      description,
      numberOfItems: groups.length,
      itemListElement: groups.map((group, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: `London ${group.name} Cinemas`,
        url: `https://clusterflick.com${group.href}`,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://clusterflick.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Cinema Groups",
          item: "https://clusterflick.com/cinema-groups",
        },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CinemaGroupsPageContent {...index} countedOn={formatDateLong(now)} />
    </>
  );
}
