import type { Meta, StoryObj } from "@storybook/react";
import { GeolocationProvider } from "@/state/geolocation-context";
import VenueMapPicker, {
  type VenueMapPickerItem,
} from "@/components/venue-map-picker";

/**
 * `VenueMapPicker` is the full-screen map the filter overlay opens from its
 * Venues section ("Choose on a map"), for choosing venues by where they are.
 *
 * Selected venues are filled pink pins, unselected ones hollow; clusters say
 * how much of what they hold is selected ("3/12"). Tapping a pin toggles it.
 * An area is chosen by framing it: the bar under the map counts the venues in
 * view, and **Only these** makes them the selection, **Add these** and
 * **Remove these** adjust it.
 *
 * It edits a draft. Nothing reaches the filter until **Apply**, which hands
 * back a snapshot of venue ids — or `null` when every venue is selected, the
 * filter's own "no restriction" value. Cancel, the close button and Escape
 * leave the selection as it was.
 *
 * **When to use:** choosing a set of venues by geography.
 *
 * **When not to use:** picking one venue by name — `VenueQuickAdd` does that
 * without a map. To browse venues rather than choose them, use `VenueMap`.
 *
 * **Notes:**
 * - Portalled to `document.body`, above the filter overlay, and client-only:
 *   Leaflet is loaded when the picker first opens.
 * - Must be rendered inside a `GeolocationProvider` for "Locate me".
 */
const meta = {
  title: "Components/VenueMapPicker",
  component: VenueMapPicker,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark" },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <GeolocationProvider>
        <Story />
      </GeolocationProvider>
    ),
  ],
  args: {
    onApply: () => {},
    onClose: () => {},
  },
} satisfies Meta<typeof VenueMapPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

// Central-London venues close enough to cluster at load, plus a few further
// out, and one with nothing currently showing.
const sampleVenues: VenueMapPickerItem[] = [
  {
    id: "bfi-southbank",
    name: "BFI Southbank",
    lat: 51.5069,
    lon: -0.1146,
    filmCount: 42,
  },
  {
    id: "prince-charles",
    name: "Prince Charles Cinema",
    lat: 51.5111,
    lon: -0.1298,
    filmCount: 31,
  },
  {
    id: "curzon-soho",
    name: "Curzon Soho",
    lat: 51.5122,
    lon: -0.1315,
    filmCount: 18,
  },
  {
    id: "picturehouse-central",
    name: "Picturehouse Central",
    lat: 51.5108,
    lon: -0.1339,
    filmCount: 24,
  },
  {
    id: "the-castle",
    name: "The Castle Cinema",
    lat: 51.5449,
    lon: -0.0554,
    filmCount: 9,
  },
  {
    id: "rio-dalston",
    name: "Rio Cinema",
    lat: 51.5486,
    lon: -0.0755,
    filmCount: 12,
  },
  {
    id: "genesis",
    name: "Genesis Cinema",
    lat: 51.5217,
    lon: -0.0489,
    filmCount: 15,
  },
  {
    id: "peckhamplex",
    name: "Peckhamplex",
    lat: 51.4712,
    lon: -0.0699,
    filmCount: 0,
  },
];

/** No venue filter yet: every venue starts selected. */
export const AllSelected: Story = {
  args: {
    venues: sampleVenues,
    selectedVenues: null,
  },
};

/**
 * A partial selection. The map opens framed on the selected venues, and the
 * central cluster shows how many of its venues are included.
 */
export const PartialSelection: Story = {
  args: {
    venues: sampleVenues,
    selectedVenues: ["prince-charles", "curzon-soho", "rio-dalston"],
  },
};

/** Nothing selected: every pin hollow, and Apply is disabled. */
export const NoneSelected: Story = {
  args: {
    venues: sampleVenues,
    selectedVenues: [],
  },
};
