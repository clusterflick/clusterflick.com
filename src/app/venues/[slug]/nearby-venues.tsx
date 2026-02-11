import LinkedList from "@/components/linked-list";
import type { NearbyVenue } from "./page-content";

const INITIAL_COUNT = 5;

export default function NearbyVenues({ venues }: { venues: NearbyVenue[] }) {
  return (
    <LinkedList
      items={venues.map(({ venue: nearby, distance, url }) => ({
        key: nearby.id,
        href: url,
        label: nearby.name,
        detail: distance < 0.1 ? "< 0.1 miles" : `${distance.toFixed(1)} miles`,
      }))}
      initialCount={INITIAL_COUNT}
      showAllLabel={`Show all ${venues.length} nearby venues`}
    />
  );
}
