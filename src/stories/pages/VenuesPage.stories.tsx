import type { Meta, StoryObj } from "@storybook/react";
import VenuesPageContent from "@/app/venues/page-content";
import { getVenueUrl } from "@/utils/get-venue-url";
import type { VenueGroupData } from "@/app/venues/page";
import type { Venue } from "@/types";
import { fetchMetaData, fetchAllMovies } from "../utils/fetch-story-data";
import StoryDataLoader from "../utils/story-data-loader";
import { handlers, loadingHandlers } from "../../../.storybook/msw/handlers";

/**
 * Venues Page Stories
 *
 * Uses real data from public/data files. The component fetches and
 * decompresses the actual data to render the venues list page.
 */

type VenuesPageData = {
  groups: VenueGroupData[];
  totalVenues: number;
};

function buildVenueGroups(
  venues: Record<string, Venue>,
  eventCounts: Map<string, number>,
): VenueGroupData[] {
  const groupMap = new Map<
    string,
    {
      id: string;
      label: string;
      venues: (Venue & {
        displayName: string;
        href: string;
        eventCount: number;
      })[];
    }
  >();

  for (const venue of Object.values(venues)) {
    const groupKey =
      venue.structure === "group" && venue.groupName
        ? `group-${venue.groupName}`
        : `type-${venue.type}`;
    const groupLabel =
      venue.structure === "group" && venue.groupName
        ? venue.groupName
        : venue.type;

    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, { id: groupKey, label: groupLabel, venues: [] });
    }

    const isGroupStructured = groupKey.startsWith("group-");
    let displayName = venue.name;
    if (isGroupStructured) {
      const prefixPattern = new RegExp(`^${groupLabel}\\s*`, "i");
      displayName = venue.name.replace(prefixPattern, "").trim() || venue.name;
    }

    groupMap.get(groupKey)!.venues.push({
      ...venue,
      displayName,
      href: getVenueUrl(venue),
      eventCount: eventCounts.get(venue.id) || 0,
    });
  }

  return Array.from(groupMap.values())
    .map((group) => ({
      id: group.id,
      label: group.label === "Unknown" ? "Other" : group.label,
      venues: group.venues
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(({ name, displayName, href, eventCount }) => ({
          name,
          displayName,
          href,
          eventCount,
        })),
    }))
    .sort((a, b) => {
      const aIsGroup = a.id.startsWith("group-");
      const bIsGroup = b.id.startsWith("group-");
      if (aIsGroup && !bIsGroup) return -1;
      if (!aIsGroup && bIsGroup) return 1;
      return a.label.localeCompare(b.label);
    });
}

async function loadVenuesData(): Promise<VenuesPageData | null> {
  const metaData = await fetchMetaData();
  const movies = await fetchAllMovies(metaData);

  // Count movies per venue
  const eventCounts = new Map<string, number>();
  for (const movie of Object.values(movies)) {
    const venueIds = new Set<string>();
    for (const showing of Object.values(movie.showings)) {
      venueIds.add(showing.venueId);
    }
    for (const venueId of venueIds) {
      eventCounts.set(venueId, (eventCounts.get(venueId) || 0) + 1);
    }
  }

  const venues: Record<string, Venue> = {};
  for (const [id, venue] of Object.entries(metaData.venues)) {
    venues[id] = { ...venue, id };
  }

  const groups = buildVenueGroups(venues, eventCounts);
  const totalVenues = Object.keys(venues).length;

  return { groups, totalVenues };
}

function VenuesPageWithRealData() {
  return (
    <StoryDataLoader<VenuesPageData>
      loader={loadVenuesData}
      loadingMessage="Loading venues data..."
    >
      {(data) => (
        <VenuesPageContent
          groups={data.groups}
          totalVenues={data.totalVenues}
        />
      )}
    </StoryDataLoader>
  );
}

const meta = {
  title: "Pages/Venues",
  component: VenuesPageWithRealData,
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
    },
    msw: {
      handlers,
    },
    chromatic: { disableSnapshot: true },
  },
} satisfies Meta<typeof VenuesPageWithRealData>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Venues page in loading state - the hero and layout are not yet
 * visible while venue data is being fetched.
 */
export const Loading: Story = {
  parameters: {
    msw: {
      handlers: loadingHandlers,
    },
  },
};

/**
 * Venues page fully loaded with all venue groups displayed,
 * searchable by name. Uses real data from public/data files.
 */
export const Loaded: Story = {
  parameters: {
    msw: {
      handlers,
    },
  },
};
