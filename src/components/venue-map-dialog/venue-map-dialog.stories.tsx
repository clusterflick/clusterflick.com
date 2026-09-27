import type { Meta, StoryObj } from "@storybook/react";
import { GeolocationProvider } from "@/state/geolocation-context";
import VenueMapDialog, {
  type VenueMapDialogVenue,
} from "@/components/venue-map-dialog";

/**
 * `VenueMapDialog` shows `VenueMap` full screen, over the page, to see where a
 * set of venues sits across London. A film page opens it from "Playing at"
 * ("See on a map"), with each popup counting that film's showings.
 *
 * **When to use:** a page with a list of venues that reads better as places —
 * where a film is showing, say — where an in-page map would be too much.
 *
 * **When not to use:** choosing venues for the filter — `VenueMapPicker` does
 * that. For a map that belongs on the page itself, use `VenueMap`.
 *
 * **Notes:**
 * - Portalled to `document.body`; Escape and the close button call `onClose`,
 *   and focus returns to whatever opened it.
 * - Must be rendered inside a `GeolocationProvider` for "Locate me".
 */
const meta = {
  title: "Components/VenueMapDialog",
  component: VenueMapDialog,
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
    onClose: () => {},
  },
} satisfies Meta<typeof VenueMapDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function venue(
  id: string,
  name: string,
  lat: number,
  lon: number,
  showings: number,
): VenueMapDialogVenue {
  return {
    id,
    name,
    href: `/venues/${id}`,
    type: "Cinema",
    lat,
    lon,
    filmCount: showings,
    detail: `${showings} ${showings === 1 ? "showing" : "showings"}`,
  };
}

/** A film showing across town: central venues cluster, outer ones stand alone. */
export const WhereAFilmIsPlaying: Story = {
  args: {
    title: "Where it's playing",
    summary: "Showing at 6 venues",
    venues: [
      venue("bfi-southbank", "BFI Southbank", 51.5069, -0.1146, 8),
      venue("prince-charles", "Prince Charles Cinema", 51.5111, -0.1298, 3),
      venue("curzon-soho", "Curzon Soho", 51.5122, -0.1315, 5),
      venue("rio-dalston", "Rio Cinema", 51.5486, -0.0755, 2),
      venue("genesis", "Genesis Cinema", 51.5217, -0.0489, 1),
      venue("peckhamplex", "Peckhamplex", 51.4712, -0.0699, 4),
    ],
  },
};

/** One venue: framed at street level rather than all of London. */
export const SingleVenue: Story = {
  args: {
    title: "Where it's playing",
    summary: "Showing at 1 venue",
    venues: [venue("rio-dalston", "Rio Cinema", 51.5486, -0.0755, 2)],
  },
};
