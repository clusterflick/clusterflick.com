import type { Meta, StoryObj } from "@storybook/react";
import { GeolocationProvider } from "@/state/geolocation-context";
import VenueMap, { type VenueMapVenue } from "@/components/venue-map";

/**
 * `VenueMap` is an interactive Leaflet map of London cinema venues, shown atop
 * the `/venues` page. Every venue is a clustering pin (clusters split apart as
 * you zoom in); clicking a pin opens a popup that links through to the venue
 * page. If the visitor has already granted geolocation permission — or presses
 * "Locate me" — a pulsing electric-blue dot marks their position.
 *
 * Two overlay modes: pass `boundary` (a GeoJSON object) to trace the Greater
 * London outline behind the pins (the `/venues` page), or `distanceRingsMiles`
 * (e.g. `[1, 2]`) to draw dashed distance rings around the user and frame them
 * instead of the venues (the `/near-me` page — rings only appear once a position
 * is known).
 *
 * **When to use:** for a spatial, browse-by-location overview of many venues.
 *
 * **When not to use:** for a small, fixed set of places, or where a plain text
 * list is more scannable — reach for `LinkGrid` / `LinkedList` instead.
 *
 * **Notes:**
 * - Client-only and lazy-loaded (Leaflet needs `window`); it never enters the
 *   static-export prerender.
 * - Basemap tiles are fetched from CARTO over the network (free, no API key).
 * - Must be rendered inside a `GeolocationProvider` (the decorator supplies one
 *   here; the real app wires it in `layout.tsx`).
 */
const meta = {
  title: "Components/VenueMap",
  component: VenueMap,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <GeolocationProvider>
        <div style={{ padding: "1rem" }}>
          <Story />
        </div>
      </GeolocationProvider>
    ),
  ],
} satisfies Meta<typeof VenueMap>;

export default meta;
type Story = StoryObj<typeof meta>;

// A spread of real central-London venues so clustering is visible at load.
const sampleVenues: VenueMapVenue[] = [
  {
    id: "bfi-southbank",
    name: "BFI Southbank",
    href: "/venues/bfi-southbank",
    type: "Independent cinema",
    lat: 51.5069,
    lon: -0.1146,
    filmCount: 42,
  },
  {
    id: "prince-charles",
    name: "Prince Charles Cinema",
    href: "/venues/prince-charles",
    type: "Independent cinema",
    lat: 51.5111,
    lon: -0.1298,
    filmCount: 31,
  },
  {
    id: "curzon-soho",
    name: "Curzon Soho",
    href: "/venues/curzon-soho",
    type: "Cinema chain",
    lat: 51.5122,
    lon: -0.1315,
    filmCount: 18,
  },
  {
    id: "picturehouse-central",
    name: "Picturehouse Central",
    href: "/venues/picturehouse-central",
    type: "Cinema chain",
    lat: 51.5108,
    lon: -0.1339,
    filmCount: 24,
  },
  {
    id: "the-castle",
    name: "The Castle Cinema",
    href: "/venues/the-castle",
    type: "Independent cinema",
    lat: 51.5449,
    lon: -0.0554,
    filmCount: 9,
  },
  {
    id: "rio-dalston",
    name: "Rio Cinema",
    href: "/venues/rio-dalston",
    type: "Independent cinema",
    lat: 51.5486,
    lon: -0.0755,
    filmCount: 12,
  },
  {
    id: "genesis",
    name: "Genesis Cinema",
    href: "/venues/genesis",
    type: "Independent cinema",
    lat: 51.5217,
    lon: -0.0489,
    filmCount: 15,
  },
  {
    id: "peckhamplex",
    name: "Peckhamplex",
    href: "/venues/peckhamplex",
    type: "Independent cinema",
    lat: 51.4712,
    lon: -0.0699,
    filmCount: 7,
  },
];

/** The default map, framed to fit all supplied venues. */
export const Default: Story = {
  args: {
    venues: sampleVenues,
  },
};

/** A single venue — the map fits tightly to one pin. */
export const SingleVenue: Story = {
  args: {
    venues: [sampleVenues[0]],
  },
};
