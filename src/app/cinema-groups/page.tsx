import type { Metadata } from "next";
import { getStaticData } from "@/utils/get-static-data";
import { getVenueGroupUrl } from "@/utils/get-venue-group-url";
import { groupVenuesByGroup } from "@/utils/get-venue-group-venues";
import { VENUE_GROUPS } from "@/data/venue-groups";
import CinemaGroupsPageContent from "./page-content";

const title = "London Cinema Groups & Chains";
const description =
  "Browse London's cinema chains and groups — Picturehouse, Everyman, Curzon, ODEON, Vue, Cineworld and more. See every venue in each group and what's showing now.";

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

  const groups = VENUE_GROUPS.filter((group) => map.has(group.slug))
    .map((group) => ({
      slug: group.slug,
      name: group.name,
      href: getVenueGroupUrl(group),
      description: group.description,
      venueCount: (map.get(group.slug) || []).length,
    }))
    .sort(
      (a, b) => b.venueCount - a.venueCount || a.name.localeCompare(b.name),
    );

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
      <CinemaGroupsPageContent groups={groups} />
    </>
  );
}
